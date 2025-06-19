import jsPDF from 'jspdf';
import type { PrintingData, PrintRoomData } from '@/types';
import './Roboto-Regular-normal.js';

const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm
const INVOICE_SPACING = 10; // Space between invoices
const INVOICE_WIDTH = 97; // Fixed invoice width
const INVOICE_HEIGHT = 140; // Fixed invoice height

// Calculate left margin to center the invoices
const TOTAL_WIDTH = INVOICE_WIDTH * 2 + INVOICE_SPACING;
const LEFT_MARGIN = (A4_WIDTH - TOTAL_WIDTH) / 2;

// Calculate top margin to center vertically
const TOTAL_HEIGHT = INVOICE_HEIGHT * 2 + INVOICE_SPACING;
const TOP_MARGIN = (A4_HEIGHT - TOTAL_HEIGHT) / 2;

/**
 * Format a number as Vietnamese currency (VND)
 * Multiply by 1000 and format with space as thousand separator
 */
function formatVND(amount: number): string {
  const inVND = Math.floor(amount * 1000);
  return inVND.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Calculate total cost and round up to nearest thousand VND
 */
function calculateTotalVND(amount: number): number {
  // Convert to VND (multiply by 1000)
  const inVND = amount * 1000;
  // Round up to next 1000 if there's any decimal
  return Math.ceil(inVND / 1000) * 1000;
}

/**
 * Generate a total sheet PDF with rooms grouped by block
 */
export async function generateTotalSheetPDF(data: PrintingData): Promise<Uint8Array> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set Roboto font
  doc.setFont('Roboto-Regular', 'normal');

  // Group rooms by block
  const blockGroups = data.rooms.reduce((groups, room) => {
    const block = room.blockNumber;
    if (!groups[block]) {
      groups[block] = [];
    }
    groups[block].push(room);
    return groups;
  }, {} as Record<string, PrintRoomData[]>);

  // Sort blocks
  const sortedBlocks = Object.keys(blockGroups).sort();

  // Generate a page for each block
  sortedBlocks.forEach((block, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const rooms = blockGroups[block];
    drawTotalSheet(doc, block, rooms, data);
  });

  // Get ArrayBuffer and convert to Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

function drawTotalSheet(
  doc: jsPDF,
  block: string,
  rooms: PrintRoomData[],
  data: PrintingData
) {
  const margin = 5;
  const cellPadding = 3;
  const headerHeight = 12;
  const rowHeight = 10;
  const titleSpacing = 1;
  const totalRowSpacing = 1;
  
  // Set up column widths
  const colWidths = {
    date: 20,
    room: 20,
    electric: 25,
    water: 25,
    garbage: 25,
    rent: 25,
    total: 25,
    note: 40
  };

  // Calculate total width and x position to center the table
  const tableWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
  const startX = (A4_WIDTH - tableWidth) / 2;

  // Calculate total height needed
  const totalRows = rooms.length;
  const contentHeight = headerHeight + (rowHeight * totalRows) + rowHeight + totalRowSpacing; // Include total row
  
  // If bottom up, start from bottom of page
  let currentY = data.utility.totalSheetOptions?.bottomUp
    ? A4_HEIGHT - margin - contentHeight
    : margin;

  // Draw title
  doc.setFontSize(16);
  if (data.utility.totalSheetOptions?.includeDate) {
    doc.text(`Dãy: ${block}`, startX, currentY);
    doc.text(data.utility.printDate.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }), startX + 60, currentY);
    currentY += titleSpacing;
  }

  // Draw header
  doc.setFontSize(14);
  let currentX = startX;
  
  // Header row
  const headers = ['Ngày', 'Phòng', 'Điện', 'Nước', 'Rác', 'Phòng', 'Tổng', 'Ghi chú'];
  headers.forEach((header, index) => {
    const width = Object.values(colWidths)[index];
    doc.rect(currentX, currentY, width, headerHeight);
    doc.text(header, currentX + width/2, currentY + headerHeight/2 + 1, { align: 'center', baseline: 'middle' });
    currentX += width;
  });
  currentY += headerHeight;

  // Calculate totals first
  const totals = rooms.reduce((acc, room) => {
    const electricUsage = room.currentElectric - room.previousElectric;
    const waterUsage = room.currentWater - room.previousWater;
    const electricCost = Math.ceil(electricUsage * data.utility.electricityCost);
    const waterCost = Math.ceil(waterUsage * data.utility.waterCost);
    
    return {
      electric: acc.electric + electricCost,
      water: acc.water + waterCost,
      garbage: acc.garbage + data.utility.garbageCost,
      rent: acc.rent + room.roomPrice,
      total: acc.total + electricCost + waterCost + data.utility.garbageCost + room.roomPrice
    };
  }, { electric: 0, water: 0, garbage: 0, rent: 0, total: 0 });

  // Draw data rows
  doc.setFontSize(12);
  rooms.forEach(room => {
    currentX = startX;
    
    // Calculate values
    const electricUsage = room.currentElectric - room.previousElectric;
    const waterUsage = room.currentWater - room.previousWater;
    
    // Calculate costs
    const electricCost = Math.ceil(electricUsage * data.utility.electricityCost);
    const waterCost = Math.ceil(waterUsage * data.utility.waterCost);
    const total = electricCost + waterCost + data.utility.garbageCost + room.roomPrice;

    // Draw cells
    const cells = [
      data.utility.printDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      room.roomName,
      electricCost.toString(),
      waterCost.toString(),
      data.utility.garbageCost.toString(),
      room.roomPrice.toString(),
      total.toString(),
      ''
    ];

    cells.forEach((cell, index) => {
      const width = Object.values(colWidths)[index];
      doc.rect(currentX, currentY, width, rowHeight);
      
      // Right align numbers, center align room names
      const align = index === 1 ? 'center' : index === 0 ? 'center' : 'right';
      const padding = align === 'right' ? width - cellPadding : width/2;
      
      doc.text(cell, currentX + padding, currentY + rowHeight/2 + 1, 
        { align, baseline: 'middle' });
      
      currentX += width;
    });
    currentY += rowHeight;
  });

  // Draw totals row at the bottom
  if (data.utility.totalSheetOptions?.bottomUp) {
    currentY = A4_HEIGHT - margin - rowHeight;
  } else {
    currentY += totalRowSpacing;
  }
  
  currentX = startX;
  doc.setFontSize(13);

  // Draw total row without borders
  const totalCells = [
    'Tổng cộng',
    '',
    totals.electric.toString(),
    totals.water.toString(),
    totals.garbage.toString(),
    totals.rent.toString(),
    totals.total.toString(),
    ''
  ];

  totalCells.forEach((cell, index) => {
    const width = Object.values(colWidths)[index];
    
    if (cell) {
      const align = index === 0 ? 'left' : 'right';
      const padding = align === 'right' ? width - cellPadding : cellPadding;
      
      doc.text(cell, currentX + padding, currentY + rowHeight/2 + 1,
        { align, baseline: 'middle' });
    }
    
    currentX += width;
  });
}

export async function generateInvoicePDF(data: PrintingData): Promise<Uint8Array> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set Roboto font
  doc.setFont('Roboto-Regular', 'normal');
  doc.setFontSize(14); // Increased from 12

  // Calculate how many pages we need
  const invoicesPerPage = 4;
  const totalPages = Math.ceil(data.rooms.length / invoicesPerPage);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      doc.addPage();
    }

    // Get rooms for this page
    const pageRooms = data.rooms.slice(
      pageIndex * invoicesPerPage,
      (pageIndex + 1) * invoicesPerPage
    );

    // Draw invoices for this page
    pageRooms.forEach((room, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = LEFT_MARGIN + col * (INVOICE_WIDTH + INVOICE_SPACING);
      const y = TOP_MARGIN + row * (INVOICE_HEIGHT + INVOICE_SPACING);

      drawInvoice(doc, x, y, room, data);
    });
  }

  // Get ArrayBuffer and convert to Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

function drawInvoice(
  doc: jsPDF,
  x: number,
  y: number,
  room: PrintRoomData,
  data: PrintingData
) {
  const { utility } = data;
  const lineHeight = 7;
  const indent = 5;
  const colWidth = 25;
  
  // Draw border
  doc.rect(x, y, INVOICE_WIDTH, INVOICE_HEIGHT);

  // Header
  doc.setFontSize(14); // Increased from 12
  doc.text(`Phòng: ${room.roomName}`, x + indent, y + lineHeight);
  const dateStr = utility.printDate.toLocaleDateString('vi-VN');
  doc.text(`Ngày: ${dateStr}`, x + INVOICE_WIDTH - 50, y + lineHeight);

  // Electricity section
  doc.setFontSize(12); // Increased from 10
  let currentY = y + lineHeight * 3;
  doc.text('ĐIỆN:', x + indent, currentY);
  currentY += lineHeight;
  
// Current reading
doc.text('Số mới:', x + indent * 2, currentY);
doc.text(room.currentElectric.toString(), x + indent * 2 + colWidth, currentY);
currentY += lineHeight;

  // Previous reading
  doc.text('Số cũ:', x + indent * 2, currentY);
  doc.text(room.previousElectric.toString(), x + indent * 2 + colWidth, currentY);
  currentY += lineHeight;

  // Calculation
  const electricityUsage = room.currentElectric - room.previousElectric;
  const roundedElectricityCost = Math.ceil(electricityUsage * utility.electricityCost);
  doc.text(
    `${electricityUsage} x ${formatVND(utility.electricityCost)} =`,
    x + indent * 2 + colWidth,
    currentY
  );
  doc.text(
    formatVND(roundedElectricityCost),
    x + INVOICE_WIDTH - 10,
    currentY,
    { align: 'right' }
  );
  currentY += lineHeight * 1.5;

  // Water section
  doc.text('NƯỚC:', x + indent, currentY);
  currentY += lineHeight;

  // Current reading
  doc.text('Số mới:', x + indent * 2, currentY);
  doc.text(room.currentWater.toString(), x + indent * 2 + colWidth, currentY);
  currentY += lineHeight;
  
  // Previous reading
  doc.text('Số cũ:', x + indent * 2, currentY);
  doc.text(room.previousWater.toString(), x + indent * 2 + colWidth, currentY);
  currentY += lineHeight;

  // Calculation
  const waterUsage = room.currentWater - room.previousWater;
  doc.text(
    `${waterUsage} x ${formatVND(utility.waterCost)} =`,
    x + indent * 2 + colWidth,
    currentY
  );
  doc.text(
    formatVND(waterUsage * utility.waterCost),
    x + INVOICE_WIDTH - 10,
    currentY,
    { align: 'right' }
  );
  currentY += lineHeight * 1.5;

  // Room rent
  doc.text('PHÒNG:', x + indent, currentY);
  doc.text(
    formatVND(room.roomPrice),
    x + INVOICE_WIDTH - 10,
    currentY,
    { align: 'right' }
  );
  currentY += lineHeight;

  // Garbage fee
  doc.text('RÁC:', x + indent, currentY);
  doc.text(
    formatVND(utility.garbageCost),
    x + INVOICE_WIDTH - 10,
    currentY,
    { align: 'right' }
  );
  currentY += lineHeight * 2;

  // Calculate total with rounding up
  const subtotal = roundedElectricityCost +
                  (waterUsage * utility.waterCost) +
                  room.roomPrice +
                  utility.garbageCost;
  const total = calculateTotalVND(subtotal);

  // Total
  doc.setFontSize(14);
  doc.text('TỔNG CỘNG:', x + indent, currentY);
  doc.text(
    total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    x + INVOICE_WIDTH - 10,
    currentY,
    { align: 'right' }
  );
  currentY += lineHeight * 2;

  // Footer
  doc.setFontSize(14);
  const footerX = x + INVOICE_WIDTH / 2;
  doc.text('Trả phòng vui lòng báo trước 1 tháng.', footerX, currentY, { align: 'center' });
  currentY += lineHeight + 1;
  doc.text('Nếu không báo, nhà trọ không hoàn cọc.', footerX, currentY, { align: 'center' });
  currentY += lineHeight + 1;
}

export async function generateReceivingSheetPDF(data: PrintingData): Promise<Uint8Array> {
  // Create a new PDF document in landscape
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Set Roboto font
  doc.setFont('Roboto-Regular', 'normal');

  receivingSheet(doc, data.rooms, data);

  // Get ArrayBuffer and convert to Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

function receivingSheet(doc: jsPDF, rooms: PrintRoomData[], data: PrintingData) {
  const { utility } = data;
  const lineHeight = 8;
  const columnWidth = 30;
  const startX = 5;
  const startY = 10;
  const bottomMargin = 5; // Reduced bottom margin
  const blockGap = lineHeight * 1.5; // Gap between blocks
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxColumnsPerPage = Math.floor((pageWidth - startX) / columnWidth);
  
  let currentX = startX;
  let currentY = startY;
  let currentColumn = 0;

  doc.setFontSize(12);

  // Group rooms by block
  const blockGroups = rooms.reduce<Record<string, PrintRoomData[]>>((acc, room) => {
    const blockNumber = room.blockNumber;
    if (!acc[blockNumber]) {
      acc[blockNumber] = [];
    }
    acc[blockNumber].push(room);
    return acc;
  }, {});

  // Sort blocks and process each block
  Object.entries(blockGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([_, blockRooms]) => {
      // Sort rooms within block by room number
      blockRooms
        .sort((a, b) => a.roomNumber - b.roomNumber)
        .forEach((room) => {
          // Check if we need to move to next column
          if (currentY + lineHeight > pageHeight - bottomMargin) {
            currentY = startY;
            currentX += columnWidth;
            currentColumn++;

            // If we've filled all columns, start a new page
            if (currentColumn >= maxColumnsPerPage) {
              doc.addPage();
              currentX = startX;
              currentY = startY;
              currentColumn = 0;
            }
          }

          const electricityUsage = room.currentElectric - room.previousElectric;
          const roundedElectricityCost = Math.ceil(electricityUsage * utility.electricityCost);
          const waterUsage = room.currentWater - room.previousWater;
          const total = roundedElectricityCost +
                      (waterUsage * utility.waterCost) +
                      room.roomPrice +
                      utility.garbageCost;

          doc.text(`${room.roomName}: ${total}`, currentX, currentY);
          currentY += lineHeight;
      });

      // Add gap after each block, but check if we need to move to next column
      if (currentY + blockGap > pageHeight - bottomMargin) {
        currentY = startY;
        currentX += columnWidth;
        currentColumn++;

        // If we've filled all columns, start a new page
        if (currentColumn >= maxColumnsPerPage) {
          doc.addPage();
          currentX = startX;
          currentY = startY;
          currentColumn = 0;
        }
      } else {
        currentY += blockGap; // Add gap between blocks
      }
  });
}

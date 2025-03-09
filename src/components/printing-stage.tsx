import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Room, UtilityCostSet, PrintingOptions, PrintingData } from '@/types';
import { generateInvoicePDF, generateTotalSheetPDF, generateReceivingSheetPDF } from '@/lib/pdf-generator';
import { useUtilityCostsStore } from '@/store/utility-costs';
import { useSessionStore } from '@/store/session';
import { EditUtilityCostDialog } from '@/components/edit-utility-cost-dialog';
import { AddUtilityCostDialog } from '@/components/add-utility-cost-dialog';
import { Pencil, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from "date-fns";
import { vi } from 'date-fns/locale';

interface PrintingStageProps {
  rooms: Room[];
  onPrint: (options: {
    selectedRooms: Room[];
    selectedCostSet: UtilityCostSet;
    printingOptions: PrintingOptions;
  }) => void;
  onCancel: () => void;
}

type GroupByOption = 'block' | 'date';

interface RoomGroup {
  key: string;
  title: string;
  rooms: Room[];
  isAllSelected: boolean;
}

export function PrintingStage({
  rooms,
  onPrint,
  onCancel,
}: PrintingStageProps) {
  const { costSets, updateCostSet, addCostSet } = useUtilityCostsStore();
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [selectedCostSet, setSelectedCostSet] = useState<UtilityCostSet | null>(null);
  const [editingCostSet, setEditingCostSet] = useState<UtilityCostSet | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newCostSetDialogOpen, setNewCostSetDialogOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByOption>('date');
  const [printingOptions, setPrintingOptions] = useState<PrintingOptions>(() => {
    const now = new Date();
    const defaultDate = new Date(now.getFullYear(), now.getMonth(), 10);
    return {
      types: {
        invoice: true,
        total: false,
        receivingSheet: true
      },
      bottomUp: false,
      includeDate: true,
      selectedDate: defaultDate
    };
  });

  // Select the first cost set by default
  useEffect(() => {
    if (costSets.length > 0 && !selectedCostSet) {
      setSelectedCostSet(costSets[0]);
    }
  }, [costSets, selectedCostSet]);

  const roomGroups = useMemo(() => {
    const groups: RoomGroup[] = [];
    
    if (groupBy === 'block') {
      // Group by block number
      const blockMap = new Map<string, Room[]>();
      
      rooms.forEach(room => {
        const block = room.blockNumber;
        if (!blockMap.has(block)) {
          blockMap.set(block, []);
        }
        blockMap.get(block)!.push(room);
      });
      
      // Convert map to array and sort by block number
      Array.from(blockMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([blockNumber, blockRooms]) => {
          groups.push({
            key: `block-${blockNumber}`,
            title: `Dãy ${blockNumber}`,
            rooms: blockRooms.sort((a, b) => a.roomNumber - b.roomNumber),
            isAllSelected: blockRooms.every(room => selectedRooms.has(room.roomName))
          });
        });
    } else {
      // Group by update date
      const dateMap = new Map<string, Room[]>();
      
      rooms.forEach(room => {
        const date = new Date(room.updatedAt);
        const dateKey = format(date, 'dd/MM/yyyy', { locale: vi });
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(room);
      });
      
      // Convert map to array and sort by date (newest first)
      Array.from(dateMap.entries())
        .sort(([dateA], [dateB]) => {
          // Parse dates in format dd/MM/yyyy
          const [dayA, monthA, yearA] = dateA.split('/').map(Number);
          const [dayB, monthB, yearB] = dateB.split('/').map(Number);
          
          // Compare years, then months, then days
          if (yearA !== yearB) return yearB - yearA;
          if (monthA !== monthB) return monthB - monthA;
          return dayB - dayA;
        })
        .forEach(([dateKey, dateRooms]) => {
          groups.push({
            key: `date-${dateKey}`,
            title: `Ngày ${dateKey}`,
            rooms: dateRooms.sort((a, b) => 
              a.blockNumber.localeCompare(b.blockNumber) || a.roomNumber - b.roomNumber
            ),
            isAllSelected: dateRooms.every(room => selectedRooms.has(room.roomName))
          });
        });
    }
    
    return groups;
  }, [rooms, selectedRooms, groupBy]);

  const handleRoomSelect = (roomName: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    if (checked) {
      newSelected.add(roomName);
    } else {
      newSelected.delete(roomName);
    }
    setSelectedRooms(newSelected);
  };

  const handleGroupSelect = (groupKey: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    const group = roomGroups.find(g => g.key === groupKey);
    
    if (!group) return;
    
    group.rooms.forEach(room => {
      if (checked) {
        newSelected.add(room.roomName);
      } else {
        newSelected.delete(room.roomName);
      }
    });
    
    setSelectedRooms(newSelected);
  };

  const selectedRoomsList = rooms.filter(room => selectedRooms.has(room.roomName))
    .sort((a, b) => a.blockNumber.localeCompare(b.blockNumber) || a.roomNumber - b.roomNumber);

  const handlePrint = async () => {
    if (!selectedCostSet || selectedRooms.size === 0 || !printingOptions.selectedDate) {
      return;
    }

    const printData: PrintingData = {
      rooms: selectedRoomsList.map(room => ({
        roomName: room.roomName,
        blockNumber: room.blockNumber,
        roomNumber: room.roomNumber,
        roomPrice: room.roomPrice,
        currentElectric: room.currentElectric,
        currentWater: room.currentWater,
        previousElectric: room.previousElectric,
        previousWater: room.previousWater
      })),
      utility: {
        electricityCost: selectedCostSet.electricityCost,
        waterCost: selectedCostSet.waterCost,
        garbageCost: selectedCostSet.garbageCost,
        printDate: printingOptions.selectedDate,
        printTypes: {
          invoice: printingOptions.types.invoice,
          total: printingOptions.types.total,
          receivingSheet: printingOptions.types.receivingSheet
        },
        totalSheetOptions: {
          bottomUp: printingOptions.bottomUp,
          includeDate: printingOptions.includeDate
        }
      }
    };

    const dateStr = format(printingOptions.selectedDate, 'yyyy-MM-dd', { locale: vi });

    // Generate PDFs based on selected types
    if (printingOptions.types.invoice) {
      const invoicePdf = await generateInvoicePDF(printData);
      const invoiceBlob = new Blob([invoicePdf], { type: 'application/pdf' });
      const invoiceUrl = URL.createObjectURL(invoiceBlob);
      const invoiceLink = document.createElement('a');
      invoiceLink.href = invoiceUrl;
      invoiceLink.download = `invoices-${dateStr}.pdf`;
      document.body.appendChild(invoiceLink);
      invoiceLink.click();
      document.body.removeChild(invoiceLink);
      URL.revokeObjectURL(invoiceUrl);
    }
    
    if (printingOptions.types.total) {
      const totalPdf = await generateTotalSheetPDF(printData);
      const totalBlob = new Blob([totalPdf], { type: 'application/pdf' });
      const totalUrl = URL.createObjectURL(totalBlob);
      const totalLink = document.createElement('a');
      totalLink.href = totalUrl;
      totalLink.download = `total-sheet-${dateStr}.pdf`;
      document.body.appendChild(totalLink);
      totalLink.click();
      document.body.removeChild(totalLink);
      URL.revokeObjectURL(totalUrl);
    }

    if (printingOptions.types.receivingSheet) {
      generateReceivingSheetPDF(printData).then((pdfData) => {
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receiving_sheet_${new Date().toISOString()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Notify parent about the print without closing the print mode
    onPrint({
      selectedRooms: selectedRoomsList,
      selectedCostSet,
      printingOptions
    });
  };

  const isAnyTypeSelected = printingOptions.types.invoice || printingOptions.types.total || printingOptions.types.receivingSheet;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold">Tùy Chọn In</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 p-4 gap-4">
        {/* Left Column - Room Selection */}
        <div className="space-y-4">
          <div className="border p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Chọn Phòng</h3>
                <Select
                  value={groupBy}
                  onValueChange={(value: GroupByOption) => setGroupBy(value)}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Xếp theo ngày cập nhập</SelectItem>
                    <SelectItem value="block">Xếp theo dãy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {useSessionStore.getState().hasCalculatedRooms() && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const calculatedRooms = useSessionStore.getState().getCalculatedRooms();
                    const calculatedRoomNames = new Set(calculatedRooms.map(room => room.roomName));
                    setSelectedRooms(calculatedRoomNames);
                  }}
                >
                  Chọn phòng vừa tính hôm nay
                </Button>
              )}
            </div>
            <div className="p-3 bg-muted rounded-lg mb-4">
              <p className="text-sm font-medium">
                Đã chọn: {selectedRooms.size} phòng
              </p>
              {selectedRoomsList.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRoomsList.map(room => room.roomName).join(', ')}
                </p>
              )}
            </div>
            <ScrollArea className="h-[60vh]">
              {roomGroups.map((group) => (
                <div key={group.key} className="space-y-2 mb-4 pr-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={group.key}
                      checked={group.isAllSelected}
                      onCheckedChange={(checked) => 
                        handleGroupSelect(group.key, checked === true)
                      }
                    />
                    <Label
                      htmlFor={group.key}
                      className="text-sm font-medium"
                    >
                      {group.title}
                    </Label>
                  </div>
                  <div className="ml-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.rooms.map((room) => (
                      <div key={room.roomName} className="flex items-center space-x-2">
                        <Checkbox
                          id={room.roomName}
                          checked={selectedRooms.has(room.roomName)}
                          onCheckedChange={(checked) => 
                            handleRoomSelect(room.roomName, checked === true)
                          }
                        />
                        <Label
                          htmlFor={room.roomName}
                          className="text-sm"
                        >
                          {room.roomName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* Right Column - Utility Cost Set and Options */}
        <div className="space-y-4">
          <div className="border p-4 rounded-md space-y-4">
            <h3 className="font-medium">Bộ Giá Tiện Ích</h3>
            <div className="flex gap-2">
              <Select
                value={selectedCostSet?.id.toString()}
                onValueChange={(value) => {
                  if (value === "new") {
                    setNewCostSetDialogOpen(true);
                  } else {
                    const costSet = costSets.find(set => set.id === parseInt(value));
                    if (costSet) {
                      setSelectedCostSet(costSet);
                    }
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Chọn bộ giá" />
                </SelectTrigger>
                <SelectContent>
                  {costSets.map((costSet) => (
                    <SelectItem key={costSet.id} value={costSet.id.toString()}>
                      {costSet.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new" className="text-primary">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Thêm Bộ Giá Mới
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedCostSet && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingCostSet(selectedCostSet);
                    setEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>

            {selectedCostSet && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCostSet.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Điện:</span>
                      <span>{selectedCostSet.electricityCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nước:</span>
                      <span>{selectedCostSet.waterCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rác:</span>
                      <span>{selectedCostSet.garbageCost}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="border p-4 rounded-md">
            <h3 className="font-medium mb-4">Tùy Chọn In</h3>
            <div className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ngày In</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !printingOptions.selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {printingOptions.selectedDate ? (
                        format(printingOptions.selectedDate, "PPP", { locale: vi })
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    locale={vi}
                      mode="single"
                      selected={printingOptions.selectedDate}
                      onSelect={(date) => {
                        setPrintingOptions(prev => ({
                          ...prev,
                          selectedDate: date
                        }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Printing Type */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Kiểu In</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={printingOptions.types.invoice}
                        onCheckedChange={(checked) => {
                          setPrintingOptions(prev => ({
                            ...prev,
                            types: {
                              ...prev.types,
                              invoice: checked as boolean
                            }
                          }));
                        }}
                      />
                      <Label>Hóa đơn</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={printingOptions.types.total}
                        onCheckedChange={(checked) => {
                          setPrintingOptions(prev => ({
                            ...prev,
                            types: {
                              ...prev.types,
                              total: checked as boolean
                            }
                          }));
                        }}
                      />
                      <Label>Tờ tổng</Label>
                    </div>

                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={printingOptions.bottomUp}
                          disabled={!printingOptions.types.total}
                          onCheckedChange={(checked) => {
                            setPrintingOptions(prev => ({
                              ...prev,
                              bottomUp: checked as boolean
                            }));
                          }}
                        />
                        <Label className={!printingOptions.types.total ? "text-muted-foreground" : ""}>
                          In từ dưới lên
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={printingOptions.includeDate}
                          disabled={!printingOptions.types.total}
                          onCheckedChange={(checked) => {
                            setPrintingOptions(prev => ({
                              ...prev,
                              includeDate: checked as boolean
                            }));
                          }}
                        />
                        <Label className={!printingOptions.types.total ? "text-muted-foreground" : ""}>
                          Bao gồm dãy/ngày
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={printingOptions.types.receivingSheet}
                        onCheckedChange={(checked) => {
                          setPrintingOptions(prev => ({
                            ...prev,
                            types: {
                              ...prev.types,
                              receivingSheet: checked as boolean
                            }
                          }));
                        }}
                      />
                      <Label>Tờ thu</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            </div>
            <div className="mt-8 flex justify-end space-x-2">
            <Button 
                variant="outline" 
                
                onClick={onCancel}
              >
                Thoát
              </Button>
              <Button 
                onClick={handlePrint}
                disabled={!selectedCostSet || selectedRooms.size === 0 || !isAnyTypeSelected}
              >
                Xuất ra file in
              </Button>
          </div>
        </div>
      </div>

      {editingCostSet && (
        <EditUtilityCostDialog
          costSet={editingCostSet}
          onSave={(updates) => {
            updateCostSet(editingCostSet.id, updates);
            if (selectedCostSet?.id === editingCostSet.id) {
              setSelectedCostSet({ ...editingCostSet, ...updates });
            }
          }}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}

      <AddUtilityCostDialog
        open={newCostSetDialogOpen}
        onOpenChange={setNewCostSetDialogOpen}
        onSave={(newCostSet) => {
          const addedSet = addCostSet(newCostSet);
          setSelectedCostSet(addedSet);
        }}
      />
    </div>
  );
}

import type { Room, UtilCost, ExportData } from '@/types';

/**
 * Exports data to a JSON file with proper error handling and validation
 * @param rooms - Array of rooms to export
 * @param utilityCosts - Array of utility costs to export
 * @returns Promise that resolves when the file is saved
 */
export async function exportToJson(rooms: Room[], utilityCosts: UtilCost[]): Promise<void> {
  try {
    // Prepare the data with metadata
    const exportData: ExportData = {
      rooms,
      utilityCosts,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    // Validate the data before export
    validateExportData(exportData);

    // Create a Blob with the JSON data
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unit-ledger-export-${formatDate(new Date())}.json`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}

/**
 * Imports data from a JSON file
 * @param file - File to import
 * @returns Promise that resolves with the imported data
 */
export async function importFromJson(file: File): Promise<ExportData> {
  try {
    // Read the file
    const text = await file.text();
    const data = JSON.parse(text) as ExportData;

    // Validate the imported data
    validateExportData(data);

    return data;
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Failed to import data. Please ensure the file is a valid Unit Ledger export.');
  }
}

/**
 * Validates the export data structure
 * @param data - Data to validate
 * @throws Error if validation fails
 */
function validateExportData(data: ExportData): void {
  // Check if rooms array exists
  if (!Array.isArray(data.rooms)) {
    throw new Error('Invalid rooms data format');
  }

  // Check if utility costs array exists
  if (!Array.isArray(data.utilityCosts)) {
    throw new Error('Invalid utility costs data format');
  }

  // Validate each room has required fields
  data.rooms.forEach((room, index) => {
    const requiredFields = [
      'roomName',
      'blockNumber',
      'roomNumber',
      'roomPrice',
      'currentElectric',
      'currentWater',
      'previousElectric',
      'previousWater',
      'updatedAt'
    ] as const;

    for (const field of requiredFields) {
      if (!(field in room)) {
        throw new Error(`Missing required field "${field}" in room at index ${index}`);
      }
    }
  });

  // Validate each utility cost has required fields
  data.utilityCosts.forEach((cost, index) => {
    const requiredFields = ['type', 'price'] as const;

    for (const field of requiredFields) {
      if (!(field in cost)) {
        throw new Error(`Missing required field "${field}" in utility cost at index ${index}`);
      }
    }

    // Validate utility cost type
    if (!['electric', 'water', 'garbage'].includes(cost.type)) {
      throw new Error(`Invalid utility cost type "${cost.type}" at index ${index}`);
    }
  });
}

/**
 * Formats a date for the filename
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

import type { ExportData } from "@/types";
import { useRoomsStore } from "@/store/rooms";
import { useUtilityCostsStore } from "@/store/utility-costs";
import { useInvoiceSettingsStore } from "@/store/invoice-settings";
import { migrateUtilityCostSet, migrateInvoiceSettings } from "@/utils/migrate";

/**
 * Exports data from stores to a JSON file
 * @returns Promise that resolves when the file is saved
 */
export async function exportToJson(): Promise<void> {
  try {
    // Get data from stores
    const rooms = useRoomsStore.getState().rooms;
    const utilityCosts = useUtilityCostsStore.getState().costSets;
    const invoiceSettings = useInvoiceSettingsStore.getState().settings;

    // Prepare the data with metadata
    const exportData: ExportData = {
      rooms: rooms || [],
      utilityCosts: utilityCosts || [],
      invoiceSettings,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    // Validate the data before export
    validateExportData(exportData);

    // Create a Blob with the JSON data
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `unit-ledger-export-${formatDate(new Date())}.json`;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export data:", error);
    throw new Error("Failed to export data. Please try again.");
  }
}

/**
 * Imports data from a JSON file into stores
 * @param file - File to import
 */
export async function importFromJson(file: File): Promise<void> {
  try {
    // Read the file as text
    const text = await file.text();

    // Parse the JSON data
    const importedData = JSON.parse(text) as ExportData;

    // Validate the imported data
    validateExportData(importedData);

    // Migrate legacy garbageCost → serviceCosts
    const migratedCosts = (importedData.utilityCosts || []).map(
      migrateUtilityCostSet,
    );

    // Migrate invoiceSettings (compat for old exports)
    const invoiceSettings = migrateInvoiceSettings(
      importedData.invoiceSettings,
    );

    // Update stores
    useRoomsStore.getState().setRooms(importedData.rooms || []);
    useUtilityCostsStore.getState().importCostSets(migratedCosts);
    useInvoiceSettingsStore.getState().importSettings(invoiceSettings);
  } catch (error) {
    console.error("Failed to import data:", error);
    throw new Error(
      "Failed to import data. Please ensure the file is valid JSON.",
    );
  }
}

/**
 * Validates the export data structure
 * @param data - Data to validate
 * @throws Error if validation fails
 */
function validateExportData(data: ExportData): void {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data format");
  }

  // Validate version
  if (data.version !== "1.0.0") {
    throw new Error("Unsupported file version");
  }

  // Validate exportedAt
  if (!data.exportedAt || isNaN(Date.parse(data.exportedAt))) {
    throw new Error("Invalid export date");
  }

  // Initialize empty arrays if missing
  data.rooms = data.rooms || [];
  data.utilityCosts = data.utilityCosts || [];

  // Validate rooms array
  if (!Array.isArray(data.rooms)) {
    throw new Error("Rooms must be an array");
  }

  // Validate each room if any exist
  data.rooms.forEach((room, index) => {
    if (!room || typeof room !== "object") {
      throw new Error(`Invalid room object at index ${index + 1}`);
    }
    if (room.roomName && typeof room.roomName !== "string") {
      throw new Error(`Invalid room name in room ${index + 1}`);
    }
    if (room.blockNumber && typeof room.blockNumber !== "string") {
      throw new Error(`Invalid block number in room ${index + 1}`);
    }
    if (
      room.roomNumber &&
      (typeof room.roomNumber !== "number" || isNaN(room.roomNumber))
    ) {
      throw new Error(`Invalid room number in room ${index + 1}`);
    }
    if (
      room.roomPrice &&
      (typeof room.roomPrice !== "number" || isNaN(room.roomPrice))
    ) {
      throw new Error(`Invalid room price in room ${index + 1}`);
    }
    if (
      room.currentElectric &&
      (typeof room.currentElectric !== "number" || isNaN(room.currentElectric))
    ) {
      throw new Error(`Invalid current electric reading in room ${index + 1}`);
    }
    if (
      room.currentWater &&
      (typeof room.currentWater !== "number" || isNaN(room.currentWater))
    ) {
      throw new Error(`Invalid current water reading in room ${index + 1}`);
    }
    if (
      room.previousElectric &&
      (typeof room.previousElectric !== "number" ||
        isNaN(room.previousElectric))
    ) {
      throw new Error(`Invalid previous electric reading in room ${index + 1}`);
    }
    if (
      room.previousWater &&
      (typeof room.previousWater !== "number" || isNaN(room.previousWater))
    ) {
      throw new Error(`Invalid previous water reading in room ${index + 1}`);
    }
  });

  // Validate utility costs array
  if (!Array.isArray(data.utilityCosts)) {
    throw new Error("Utility costs must be an array");
  }

  // Validate each utility cost set if any exist
  data.utilityCosts.forEach((cost, index) => {
    if (!cost || typeof cost !== "object") {
      throw new Error(`Invalid utility cost object at index ${index + 1}`);
    }
    if (cost.name && typeof cost.name !== "string") {
      throw new Error(`Invalid name in utility cost set ${index + 1}`);
    }
    if (cost.id && (typeof cost.id !== "number" || isNaN(cost.id))) {
      throw new Error(`Invalid id in utility cost set ${index + 1}`);
    }
    if (
      cost.electricityCost &&
      (typeof cost.electricityCost !== "number" || isNaN(cost.electricityCost))
    ) {
      throw new Error(
        `Invalid electricity cost in utility cost set ${index + 1}`,
      );
    }
    if (
      cost.waterCost &&
      (typeof cost.waterCost !== "number" || isNaN(cost.waterCost))
    ) {
      throw new Error(`Invalid water cost in utility cost set ${index + 1}`);
    }
    if (cost.serviceCosts && !Array.isArray(cost.serviceCosts)) {
      throw new Error(`Invalid service costs in utility cost set ${index + 1}`);
    }
  });
}

/**
 * Formats a date for the filename
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

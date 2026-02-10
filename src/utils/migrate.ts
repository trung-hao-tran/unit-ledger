import type { UtilityCostSet, InvoiceSettings } from "@/types";
import { DEFAULT_INVOICE_REMARKS } from "@/store/invoice-settings";

/**
 * Migrate a legacy UtilityCostSet that has `garbageCost` into the new
 * `serviceCosts` array format.  Safe to call on already-migrated data.
 *
 * TODO: Remove this migration once all persisted data has been converted.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateUtilityCostSet(data: any): UtilityCostSet {
  if (data.garbageCost !== undefined && !data.serviceCosts) {
    const { garbageCost, ...rest } = data;
    return {
      ...rest,
      serviceCosts: [{ name: "Rác", fee: garbageCost }],
    };
  }
  return data as UtilityCostSet;
}

/**
 * Ensure invoiceSettings exists on export data.
 * If missing, return the default.
 *
 * TODO: Remove once all persisted data includes invoiceSettings.
 */
export function migrateInvoiceSettings(
  settings?: InvoiceSettings,
): InvoiceSettings {
  if (settings && Array.isArray(settings.remarks)) {
    return settings;
  }
  return { remarks: DEFAULT_INVOICE_REMARKS };
}

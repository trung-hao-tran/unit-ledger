import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_INVOICE_REMARKS = [
  "Trả phòng vui lòng báo trước 1 tháng.",
  "Nếu không báo, nhà trọ không hoàn cọc.",
];

export interface InvoiceSettings {
  remarks: string[];
}

interface InvoiceSettingsState {
  settings: InvoiceSettings;
  setRemarks: (remarks: string[]) => void;
  importSettings: (settings?: InvoiceSettings) => void;
}

export const useInvoiceSettingsStore = create<InvoiceSettingsState>()(
  persist(
    (set) => ({
      settings: { remarks: DEFAULT_INVOICE_REMARKS },

      setRemarks: (remarks) =>
        set({ settings: { remarks } }),

      importSettings: (settings) => {
        if (settings && Array.isArray(settings.remarks)) {
          set({ settings });
        } else {
          set({ settings: { remarks: DEFAULT_INVOICE_REMARKS } });
        }
      },
    }),
    {
      name: "invoice-settings",
    },
  ),
);

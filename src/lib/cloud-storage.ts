import { supabase } from "./supabase";
import type { Room, UtilityCostSet, InvoiceSettings } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { migrateUtilityCostSet, migrateInvoiceSettings } from "@/utils/migrate";

const MAX_VERSIONS = 30;

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

interface CloudExportData {
  rooms: Room[];
  utilityCosts: UtilityCostSet[];
  invoiceSettings?: InvoiceSettings;
  exportedAt: string;
  version: string;
}

/**
 * Save data to Supabase Storage under a versioned folder.
 * Each save creates a new file: ${cloudName}/v_${timestamp}.json
 * Old versions beyond MAX_VERSIONS are pruned automatically.
 */
export async function saveToCloud(
  cloudName: string,
  rooms: Room[],
  utilityCosts: UtilityCostSet[],
  invoiceSettings?: InvoiceSettings,
): Promise<string> {
  try {
    const timestamp = formatTimestamp(new Date());
    const filename = `${cloudName}/${timestamp}.json`;

    const exportData: CloudExportData = {
      rooms,
      utilityCosts,
      invoiceSettings,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    const blob = new Blob([JSON.stringify(exportData)], {
      type: "application/json",
    });

    const { error } = await supabase.storage
      .from("exports")
      .upload(filename, blob, {
        contentType: "application/json",
        upsert: false,
      });

    if (error) throw error;

    // Prune old versions — keep only the latest MAX_VERSIONS
    const { data: files, error: listError } = await supabase.storage
      .from("exports")
      .list(cloudName, { sortBy: { column: "created_at", order: "asc" } });

    if (!listError && files && files.length > MAX_VERSIONS) {
      const toDelete = files
        .slice(0, files.length - MAX_VERSIONS)
        .map((f) => `${cloudName}/${f.name}`);
      await supabase.storage.from("exports").remove(toDelete);
    }

    const { data: urlData } = supabase.storage
      .from("exports")
      .getPublicUrl(filename);

    toast({
      title: "Lưu trữ thành công",
      description: `Dữ liệu đã được lưu trữ với tên "${cloudName}" (${new Date().toLocaleString()})`,
    });

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error saving to cloud:", error);
    toast({
      title: "Lỗi lưu trữ",
      description: "Không thể lưu trữ dữ liệu trên đám mây.",
      variant: "destructive",
    });
    throw error;
  }
}

/**
 * Load the latest version of data from Supabase Storage for a given cloud name.
 * If no versioned folder exists, falls back to the legacy flat file and migrates it.
 */
export async function loadFromCloud(
  cloudName: string,
): Promise<CloudExportData | null> {
  try {
    // Check for versioned folder
    const { data: files } = await supabase.storage
      .from("exports")
      .list(cloudName, { sortBy: { column: "created_at", order: "desc" } });

    if (files && files.length > 0) {
      // Load latest versioned file
      const { data, error } = await supabase.storage
        .from("exports")
        .download(`${cloudName}/${files[0].name}`);

      if (error) throw error;

      const exportData: CloudExportData = JSON.parse(await data.text());

      exportData.utilityCosts = (exportData.utilityCosts || []).map(
        migrateUtilityCostSet,
      );
      exportData.invoiceSettings = migrateInvoiceSettings(
        exportData.invoiceSettings,
      );

      toast({
        title: "Tải dữ liệu thành công",
        description: `Đã tải dữ liệu từ "${cloudName}" (${new Date(exportData.exportedAt).toLocaleString()})`,
      });

      return exportData;
    }

    // No versioned folder — check for legacy flat file
    const { data: flatFiles, error: flatListError } = await supabase.storage
      .from("exports")
      .list("", { search: `${cloudName}.json` });

    if (flatListError) throw flatListError;

    const legacyFile = flatFiles?.find((f) => f.name === `${cloudName}.json`);

    if (!legacyFile) {
      toast({
        title: "Không tìm thấy dữ liệu",
        description: `Không có dữ liệu nào được lưu trữ với tên "${cloudName}"`,
        variant: "destructive",
      });
      return null;
    }

    // Migrate: move flat file into versioned folder using original upload time as filename
    const timestamp = formatTimestamp(new Date(legacyFile.created_at ?? Date.now()));
    const migratedFilename = `${cloudName}/${timestamp}.json`;

    const { data: flatData, error: flatDownloadError } = await supabase.storage
      .from("exports")
      .download(`${cloudName}.json`);

    if (flatDownloadError) throw flatDownloadError;

    const { error: moveError } = await supabase.storage
      .from("exports")
      .move(`${cloudName}.json`, migratedFilename);

    if (moveError) throw moveError;

    const exportData: CloudExportData = JSON.parse(await flatData.text());

    exportData.utilityCosts = (exportData.utilityCosts || []).map(
      migrateUtilityCostSet,
    );
    exportData.invoiceSettings = migrateInvoiceSettings(
      exportData.invoiceSettings,
    );

    toast({
      title: "Tải dữ liệu thành công",
      description: `Đã tải dữ liệu từ "${cloudName}" (${new Date(exportData.exportedAt).toLocaleString()})`,
    });

    return exportData;
  } catch (error) {
    console.error("Error loading from cloud:", error);
    toast({
      title: "Lỗi tải dữ liệu",
      description: "Không thể tải dữ liệu từ đám mây.",
      variant: "destructive",
    });
    return null;
  }
}

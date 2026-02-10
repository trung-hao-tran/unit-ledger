import { supabase } from "./supabase";
import type { Room, UtilityCostSet, InvoiceSettings } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { migrateUtilityCostSet, migrateInvoiceSettings } from "@/utils/migrate";

interface CloudExportData {
  rooms: Room[];
  utilityCosts: UtilityCostSet[];
  invoiceSettings?: InvoiceSettings;
  exportedAt: string;
  version: string;
}

/**
 * Save data to Supabase Storage with a specific cloud name
 * This will replace any existing file with the same name
 */
export async function saveToCloud(
  cloudName: string,
  rooms: Room[],
  utilityCosts: UtilityCostSet[],
  invoiceSettings?: InvoiceSettings,
): Promise<string> {
  try {
    // Use a consistent filename based on cloud name
    const filename = `${cloudName}.json`;

    // Create export data
    const exportData: CloudExportData = {
      rooms,
      utilityCosts,
      invoiceSettings,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    // Convert data to JSON string
    const jsonData = JSON.stringify(exportData);

    // Create a Blob from the JSON string
    const blob = new Blob([jsonData], { type: "application/json" });

    // Upload to Supabase Storage with upsert: true to replace existing file
    const { error } = await supabase.storage
      .from("exports")
      .upload(filename, blob, {
        contentType: "application/json",
        upsert: true, // Replace existing file
      });

    if (error) throw error;

    // Get public URL
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
 * Load data from Supabase Storage for a specific cloud name
 */
export async function loadFromCloud(
  cloudName: string,
): Promise<CloudExportData | null> {
  try {
    // Use a consistent filename based on cloud name
    const filename = `${cloudName}.json`;

    // Check if the file exists
    const { data: fileExists, error: checkError } = await supabase.storage
      .from("exports")
      .list("", {
        search: filename,
      });

    if (checkError) throw checkError;

    if (
      !fileExists ||
      fileExists.length === 0 ||
      !fileExists.some((file) => file.name === filename)
    ) {
      toast({
        title: "Không tìm thấy dữ liệu",
        description: `Không có dữ liệu nào được lưu trữ với tên "${cloudName}"`,
        variant: "destructive",
      });
      return null;
    }

    // Download the file
    const { data, error } = await supabase.storage
      .from("exports")
      .download(filename);

    if (error) throw error;

    // Parse the JSON data
    const jsonText = await data.text();
    const exportData: CloudExportData = JSON.parse(jsonText);

    // Migrate legacy data
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

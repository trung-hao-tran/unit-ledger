import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { ToolbarProps } from '@/types';
import { exportToJson, importFromJson } from '@/utils/export';
import { CloudInput } from '@/components/cloud-input';

export function Toolbar({
  onPrint,
  isCalculating,
  onToggleCalculation,
  calculationButtonClass,
  printButtonClass,
  printButtonText = "Print",
  isPrinting,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportToJson();
    } catch (error) {
      // You might want to show a toast notification here
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importFromJson(file);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // You might want to show a toast notification here
      console.error('Import failed:', error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center justify-between p-4 border-b ">
      <div className="flex space-x-2">
        <CloudInput />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />
        <Button variant="outline" onClick={triggerFileInput}>
          Tải file từ máy
        </Button>
        <Button variant="outline" onClick={handleExport}>
          Xuất file ra máy
        </Button>
        {!isCalculating && (
          <Button
            onClick={onPrint}
            className={printButtonClass}
          >
            {printButtonText === "Print" ? "In" : "Thoát"}
          </Button>
        )}
        {!isPrinting && (
          <Button
            onClick={onToggleCalculation}
            className={calculationButtonClass}
          >
            {isCalculating ? "Thoát" : "Thêm điện nước tháng mới"}
          </Button>
        )}
      </div>
    </div>
  );
}
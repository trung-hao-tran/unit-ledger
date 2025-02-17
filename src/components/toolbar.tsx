import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { ToolbarProps } from '@/types';
import { exportToJson, importFromJson } from '@/utils/export';

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
      <div className="space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />
        <Button variant="outline" onClick={triggerFileInput}>
          Import
        </Button>
        <Button variant="outline" onClick={handleExport}>
          Export
        </Button>
      </div>
      <div className="space-x-2">
        {!isPrinting && (
          <Button 
            onClick={onToggleCalculation}
            className={calculationButtonClass}
          >
            {isCalculating ? "Exit Calculation" : "Start Calculation"}
          </Button>
        )}
        {!isCalculating && (
          <Button 
            onClick={onPrint}
            className={printButtonClass}
          >
            {printButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
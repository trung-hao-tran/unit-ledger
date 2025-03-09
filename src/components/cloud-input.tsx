import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCloudStore } from '@/store/cloud-store';
import { Loader2, Cloud, Save } from 'lucide-react';

export function CloudInput() {
  const { cloudName, setCloudName, isLoading, loadData, saveCurrentData } = useCloudStore();
  const [inputValue, setInputValue] = useState(cloudName);

  const handleLoad = async () => {
    if (!inputValue.trim()) return;
    
    setCloudName(inputValue.trim());
    await loadData();
  };

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    
    setCloudName(inputValue.trim());
    await saveCurrentData();
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        placeholder="Tên đám mây"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-32 h-9"
        disabled={isLoading}
      />
      <Button 
        variant="outline" 
        onClick={handleLoad}
        disabled={isLoading || !inputValue.trim()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Cloud className="h-4 w-4 mr-2" />
        )}
        Tải
      </Button>
      <Button 
        variant="outline" 
        onClick={handleSave}
        disabled={isLoading || !inputValue.trim()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Lưu
      </Button>
      <Separator orientation="vertical" className="h-8" />
    </div>
  );
} 
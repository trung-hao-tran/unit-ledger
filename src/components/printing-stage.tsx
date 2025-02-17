import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Room, UtilityCostSet, PrintingOptions, PrintingData } from '@/types';
import { generateInvoicePDF, generateTotalSheetPDF } from '@/lib/pdf-generator';
import { useUtilityCostsStore } from '@/store/utility-costs';
import { EditUtilityCostDialog } from '@/components/edit-utility-cost-dialog';
import { AddUtilityCostDialog } from '@/components/add-utility-cost-dialog';
import { Pencil, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from "date-fns";

interface PrintingStageProps {
  rooms: Room[];
  onPrint: (options: {
    selectedRooms: Room[];
    selectedCostSet: UtilityCostSet;
    printingOptions: PrintingOptions;
  }) => void;
  onCancel: () => void;
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
  const [printingOptions, setPrintingOptions] = useState<PrintingOptions>(() => {
    const now = new Date();
    const defaultDate = new Date(now.getFullYear(), now.getMonth(), 10);
    return {
      types: {
        invoice: true,
        total: false
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

  const blockGroups = useMemo(() => {
    const groups = rooms.reduce((acc, room) => {
      const block = acc.get(room.blockNumber) || [];
      block.push(room);
      acc.set(room.blockNumber, block);
      return acc;
    }, new Map<string, Room[]>());

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([blockNumber, rooms]) => ({
        blockNumber,
        rooms: rooms.sort((a, b) => a.roomNumber - b.roomNumber),
        isAllSelected: rooms.every(room => selectedRooms.has(room.roomName)),
      }));
  }, [rooms, selectedRooms]);

  const handleRoomSelect = (roomName: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    if (checked) {
      newSelected.add(roomName);
    } else {
      newSelected.delete(roomName);
    }
    setSelectedRooms(newSelected);
  };

  const handleBlockSelect = (blockNumber: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    const blockRooms = rooms.filter(room => room.blockNumber === blockNumber);
    
    blockRooms.forEach(room => {
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
          total: printingOptions.types.total
        },
        totalSheetOptions: {
          bottomUp: printingOptions.bottomUp,
          includeDate: printingOptions.includeDate
        }
      }
    };

    const dateStr = format(printingOptions.selectedDate, 'yyyy-MM-dd');

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

    // Notify parent about the print without closing the print mode
    onPrint({
      selectedRooms: selectedRoomsList,
      selectedCostSet,
      printingOptions
    });
  };

  const isAnyTypeSelected = printingOptions.types.invoice || printingOptions.types.total;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Print Documents</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={!selectedCostSet || selectedRooms.size === 0 || !isAnyTypeSelected}
          >
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - Room Selection */}
        <div className="space-y-4">
          <div className="border p-4 rounded-md">
            <h3 className="font-medium mb-2">Room Selection</h3>
            <div className="p-3 bg-muted rounded-lg mb-4">
              <p className="text-sm font-medium">
                Selected: {selectedRooms.size} rooms
              </p>
              {selectedRoomsList.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRoomsList.map(room => room.roomName).join(', ')}
                </p>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              {blockGroups.map((group) => (
                <div key={group.blockNumber} className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`block-${group.blockNumber}`}
                      checked={group.isAllSelected}
                      onCheckedChange={(checked) => 
                        handleBlockSelect(group.blockNumber, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`block-${group.blockNumber}`}
                      className="text-sm font-medium"
                    >
                      Block {group.blockNumber}
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
                          Room {room.roomNumber}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Utility Cost Set and Options */}
        <div className="space-y-4">
          <div className="border p-4 rounded-md space-y-4">
            <h3 className="font-medium">Utility Cost Set</h3>
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
                  <SelectValue placeholder="Select a cost set" />
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
                      Add New Cost Set
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
                      <span>Electricity:</span>
                      <span>{selectedCostSet.electricityCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Water:</span>
                      <span>{selectedCostSet.waterCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Garbage:</span>
                      <span>{selectedCostSet.garbageCost}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="border p-4 rounded-md">
            <h3 className="font-medium mb-4">Custom Options</h3>
            <div className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Print Date</Label>
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
                        format(printingOptions.selectedDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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
                <Label className="text-sm font-medium">Printing Type</Label>
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
                      <Label>Invoice</Label>
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
                      <Label>Total Sheet</Label>
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
                          Bottom Up
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
                          Include Date
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

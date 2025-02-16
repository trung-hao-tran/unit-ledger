import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Room } from '@/types';

interface RoomSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedRooms: Room[]) => void;
  availableRooms: Room[];
}

export function RoomSelectionDialog({
  isOpen,
  onClose,
  onConfirm,
  availableRooms,
}: RoomSelectionDialogProps) {
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [activeBlock, setActiveBlock] = useState<string>('');

  const blockGroups = useMemo(() => {
    const groups = availableRooms.reduce((acc, room) => {
      const block = acc.get(room.blockNumber) || [];
      block.push(room);
      acc.set(room.blockNumber, block);
      return acc;
    }, new Map<number, Room[]>());

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([blockNumber, rooms]) => ({
        blockNumber,
        rooms: rooms.sort((a, b) => a.roomNumber - b.roomNumber),
        isAllSelected: rooms.every(room => selectedRooms.has(room.roomName)),
      }));
  }, [availableRooms, selectedRooms]);

  // Set initial active block
  useState(() => {
    if (blockGroups.length > 0 && !activeBlock) {
      setActiveBlock(String(blockGroups[0].blockNumber));
    }
  });

  const handleRoomSelect = (roomName: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    if (checked) {
      newSelected.add(roomName);
    } else {
      newSelected.delete(roomName);
    }
    setSelectedRooms(newSelected);
  };

  const handleBlockSelect = (blockNumber: number, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    const blockRooms = availableRooms.filter(room => room.blockNumber === blockNumber);
    
    blockRooms.forEach(room => {
      if (checked) {
        newSelected.add(room.roomName);
      } else {
        newSelected.delete(room.roomName);
      }
    });
    
    setSelectedRooms(newSelected);
  };

  const handleConfirm = () => {
    const selectedRoomsList = availableRooms.filter(room => 
      selectedRooms.has(room.roomName)
    );
    onConfirm(selectedRoomsList);
    onClose();
  };

  const selectedRoomsList = availableRooms.filter(room => selectedRooms.has(room.roomName))
    .sort((a, b) => a.blockNumber - b.blockNumber || a.roomNumber - b.roomNumber);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Rooms</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Selected: {selectedRooms.size} rooms
            </p>
            {selectedRoomsList.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRoomsList.map(room => room.roomName).join(', ')}
              </p>
            )}
          </div>

          <Tabs 
            value={activeBlock} 
            onValueChange={setActiveBlock}
            className="w-full space-y-6"
          >
            <div className="border-b">
              <TabsList className="h-10 items-center justify-start w-full rounded-none bg-transparent p-0">
                {blockGroups.map(({ blockNumber }) => (
                  <TabsTrigger
                    key={blockNumber}
                    value={String(blockNumber)}
                    className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
                  >
                    Block {blockNumber}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {blockGroups.map(({ blockNumber, rooms, isAllSelected }) => (
              <TabsContent 
                key={blockNumber} 
                value={String(blockNumber)}
                className="rounded-md border shadow-sm"
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`block-${blockNumber}`}
                      checked={isAllSelected}
                      onCheckedChange={(checked) => 
                        handleBlockSelect(blockNumber, checked === true)
                      }
                    />
                    <label
                      htmlFor={`block-${blockNumber}`}
                      className="text-sm font-medium leading-none"
                    >
                      Select All in Block {blockNumber}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ml-6">
                    {rooms.map((room) => (
                      <div key={room.roomName} className="flex items-center space-x-2">
                        <Checkbox
                          id={room.roomName}
                          checked={selectedRooms.has(room.roomName)}
                          onCheckedChange={(checked) => 
                            handleRoomSelect(room.roomName, checked === true)
                          }
                        />
                        <label
                          htmlFor={room.roomName}
                          className="text-sm leading-none"
                        >
                          Room {room.roomName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedRooms.size === 0}>
              Add Selected ({selectedRooms.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

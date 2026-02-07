import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Room } from "@/types";

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
  const [activeBlock, setActiveBlock] = useState<string>("");

  const blockGroups = useMemo(() => {
    const groups = availableRooms.reduce((acc, room) => {
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
        isAllSelected: rooms.every((room) => selectedRooms.has(room.roomName)),
      }));
  }, [availableRooms, selectedRooms]);

  // Set initial active block
  useState(() => {
    if (blockGroups.length > 0 && !activeBlock) {
      setActiveBlock(blockGroups[0].blockNumber);
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

  const handleBlockSelect = (blockNumber: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    const blockRooms = availableRooms.filter(
      (room) => room.blockNumber === blockNumber,
    );

    blockRooms.forEach((room) => {
      if (checked) {
        newSelected.add(room.roomName);
      } else {
        newSelected.delete(room.roomName);
      }
    });

    setSelectedRooms(newSelected);
  };

  const handleConfirm = () => {
    const selectedRoomsList = availableRooms.filter((room) =>
      selectedRooms.has(room.roomName),
    );
    onConfirm(selectedRoomsList);
    onClose();
  };

  const selectedRoomsList = availableRooms
    .filter((room) => selectedRooms.has(room.roomName))
    .sort(
      (a, b) =>
        a.blockNumber.localeCompare(b.blockNumber) ||
        a.roomNumber - b.roomNumber,
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-7xl p-6">
        <DialogHeader>
          <DialogTitle>Chọn Phòng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Đã chọn: {selectedRooms.size} phòng
            </p>
            {selectedRoomsList.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRoomsList.map((room) => room.roomName).join(", ")}
              </p>
            )}
          </div>

          <ScrollArea className="h-[400px] rounded-md">
            <Tabs
              defaultValue={blockGroups[0]?.blockNumber}
              value={activeBlock}
              onValueChange={setActiveBlock}
            >
              <ScrollArea className="max-w-full overflow-x-auto">
                <TabsList className="flex space-x-2">
                  {blockGroups.map((group) => (
                    <TabsTrigger
                      key={group.blockNumber}
                      value={group.blockNumber}
                    >
                      Dãy {group.blockNumber}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {blockGroups.map((group) => (
                <TabsContent
                  key={group.blockNumber}
                  value={group.blockNumber}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`block-${group.blockNumber}`}
                      checked={group.isAllSelected}
                      onCheckedChange={(checked) =>
                        handleBlockSelect(group.blockNumber, checked === true)
                      }
                    />
                    <label
                      htmlFor={`block-${group.blockNumber}`}
                      className="text-sm font-medium leading-none"
                    >
                      Chọn Tất Cả Dãy {group.blockNumber}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-10 gap-2 pr-4">
                    {group.rooms.map((room) => (
                      <div
                        key={room.roomName}
                        className="flex items-center space-x-2"
                      >
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
                          {room.roomName}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </ScrollArea>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={selectedRooms.size === 0}>
            Thêm Phòng Đã Chọn ({selectedRooms.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

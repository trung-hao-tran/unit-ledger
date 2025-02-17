import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Room } from '@/types';

interface PreparationStageProps {
  rooms: Room[];
  onConfirm: (selectedRooms: Room[]) => void;
  onCancel: () => void;
}

export function PreparationStage({
  rooms,
  onConfirm,
  onCancel,
}: PreparationStageProps) {
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());

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

  const handleConfirm = () => {
    const selectedRoomsList = rooms.filter(room => 
      selectedRooms.has(room.roomName)
    );
    onConfirm(selectedRoomsList);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-4xl w-full space-y-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chọn Phòng</h2>
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedRooms.size === 0}
            >
              Tiếp tục
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {blockGroups.map((group) => (
            <div key={group.blockNumber} className="rounded-md border">
              <div className="flex items-center space-x-2 mb-4 p-4">
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
                  Dãy {group.blockNumber}
                </label>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 px-4 pb-4 ml-6">
                {group.rooms.map((room) => (
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
                      {room.roomName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
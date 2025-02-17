import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import type { Room } from '@/types';
import { useRoomsStore } from '@/store/rooms';

interface RoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Partial<Room>) => void;
  room?: Room;
}

const defaultNewRoom: Partial<Room> = {
  roomName: '',
  blockNumber: '',
  roomNumber: 1,
  roomPrice: 0,
  currentElectric: 0,
  currentWater: 0,
  previousElectric: 0,
  previousWater: 0,
};

const parseRoomName = (roomName: string): { blockNumber: string; roomNumber: number } | null => {
  const match = roomName.trim().match(/^([a-zA-Z])(\d+)$/);
  if (!match) return null;
  
  const [, blockLetter, roomNum] = match;
  return {
    blockNumber: blockLetter.toUpperCase(),
    roomNumber: parseInt(roomNum, 10)
  };
};

export function RoomDialog({ isOpen, onClose, onSave, room }: RoomDialogProps) {
  const [formData, setFormData] = useState<Partial<Room>>(defaultNewRoom);
  const [roomNameError, setRoomNameError] = useState<string>('');
  const isEditMode = !!room;
  const { rooms } = useRoomsStore();

  // Reset form when dialog opens/closes or room changes
  useEffect(() => {
    if (isOpen) {
      setFormData(room ?? defaultNewRoom);
      setRoomNameError('');
    }
  }, [isOpen, room]);

  const handleRoomNameChange = (value: string) => {
    setRoomNameError('');
    const parsed = parseRoomName(value);
    
    if (!value.trim()) {
      setRoomNameError('Phải có tên phòng');
    } else if (!parsed) {
      setRoomNameError('Tên phòng phải là một chữ cái theo sau là số (ví dụ: A1, b2)');
    } else {
      // Check for duplicate room name
      const upperValue = value.toUpperCase();
      const roomExists = rooms.some(r => 
        r.roomName.toUpperCase() === upperValue && (!isEditMode || r.roomName !== room?.roomName)
      );
      
      if (roomExists) {
        setRoomNameError('Phòng này đã tồn tại');
      }
    }

    if (parsed) {
      setFormData(prev => ({
        ...prev,
        roomName: value.toUpperCase(),
        blockNumber: parsed.blockNumber,
        roomNumber: parsed.roomNumber
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roomName: value.toUpperCase()
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate room name
    if (!formData.roomName?.trim()) {
      setRoomNameError('Phải có tên phòng');
      return;
    }

    const parsed = parseRoomName(formData.roomName);
    if (!parsed) {
      setRoomNameError('Tên phòng phải là một chữ cái theo sau là số (ví dụ: A1, b2)');
      return;
    }

    // Check for duplicate room name
    const roomExists = rooms.some(r => 
      r.roomName.toUpperCase() === formData.roomName?.toUpperCase() && 
      (!isEditMode || r.roomName !== room?.roomName)
    );
    
    if (roomExists) {
      setRoomNameError('Phòng này đã tồn tại');
      return;
    }

    // Validate numeric fields
    const numericFields = ['roomPrice', 'currentElectric', 'currentWater'] as const;
    for (const field of numericFields) {
      const value = formData[field];
      if (typeof value !== 'number' || value < 0) {
        alert(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} phải là một số dương`);
        return;
      }
    }

    // Add default values for previous readings when adding new room
    const updatedData = {
      ...formData,
      blockNumber: parsed.blockNumber,
      roomNumber: parsed.roomNumber,
      previousElectric: isEditMode ? formData.previousElectric : 0,
      previousWater: isEditMode ? formData.previousWater : 0,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedData);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[550px] max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold mb-4">
            {isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
          </Dialog.Title>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roomName" className="text-right">Phòng</Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="roomName"
                    value={formData.roomName}
                    onChange={(e) => handleRoomNameChange(e.target.value)}
                    placeholder="ví dụ: A1, B2"
                    className={roomNameError ? "border-red-500" : ""}
                  />
                  {roomNameError && (
                    <p className="text-sm text-red-500">{roomNameError}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roomPrice" className="text-right">Giá phòng</Label>
                <Input
                  id="roomPrice"
                  type="number"
                  value={formData.roomPrice}
                  onChange={(e) => setFormData({ ...formData, roomPrice: Number(e.target.value) })}
                  className="col-span-3"
                  min={0}
                  step="0.01"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentElectric" className="text-right">Điện hiện tại</Label>
                <Input
                  id="currentElectric"
                  type="number"
                  value={formData.currentElectric}
                  onChange={(e) => setFormData({ ...formData, currentElectric: Number(e.target.value) })}
                  className="col-span-3"
                  min={0}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentWater" className="text-right">Nước hiện tại</Label>
                <Input
                  id="currentWater"
                  type="number"
                  value={formData.currentWater}
                  onChange={(e) => setFormData({ ...formData, currentWater: Number(e.target.value) })}
                  className="col-span-3"
                  min={0}
                  required
                />
              </div>
              {isEditMode && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="previousElectric" className="text-right">Điện trước đó</Label>
                    <Input
                      id="previousElectric"
                      type="number"
                      value={formData.previousElectric}
                      onChange={(e) => setFormData({ ...formData, previousElectric: Number(e.target.value) })}
                      className="col-span-3"
                      min={0}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="previousWater" className="text-right">Nước trước đó</Label>
                    <Input
                      id="previousWater"
                      type="number"
                      value={formData.previousWater}
                      onChange={(e) => setFormData({ ...formData, previousWater: Number(e.target.value) })}
                      className="col-span-3"
                      min={0}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

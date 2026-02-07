import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRoomsStore } from '@/store/rooms';
import { useCalculationRoomsStore } from '@/store/calculation-rooms';
import { RoomSelectionDialog } from '@/components/room-selection-dialog';
import { Pencil2Icon, Cross2Icon } from '@radix-ui/react-icons';
import type { Room, CalculationRoom, CalculationFields } from '@/types';

interface CalculationStageProps {
  onSave: (updatedRooms: Room[]) => void;
  onCancel: () => void;
}

type EditableFields = keyof Pick<CalculationFields, 'newElectric' | 'newWater'>;
type RoomFields = keyof Pick<Room, 'roomPrice' | 'currentElectric' | 'currentWater'>;

export function CalculationStage({
  onSave,
  onCancel,
}: CalculationStageProps) {
  const { getRemainingRooms } = useRoomsStore();
  const {
    calculationRooms,
    addCalculationRoom,
    removeCalculationRoom,
    updateCalculationRoom,
  } = useCalculationRoomsStore();

  const [activeBlock, setActiveBlock] = useState<string>(
    String(calculationRooms[0]?.blockNumber ?? '')
  );
  const [editingRooms, setEditingRooms] = useState<Set<string>>(new Set());
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, Set<string>>>({}); // roomName -> Set of field names with errors

  const blockGroups = useMemo(() => {
    const groups = calculationRooms.reduce((acc, room) => {
      const block = acc.get(room.blockNumber) || [];
      block.push(room);
      acc.set(room.blockNumber, block);
      return acc;
    }, new Map<string, CalculationRoom[]>());

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([blockNumber, rooms]) => ({
        blockNumber,
        rooms: rooms.sort((a, b) => a.roomNumber - b.roomNumber),
      }));
  }, [calculationRooms]);

  const validateInput = (room: CalculationRoom, field: string, value: number) => {
    const roomErrors = new Set(validationErrors[room.roomName] || []);
    
    // Remove existing error for this field
    roomErrors.delete(field);
    
    // Check for negative numbers
    if (value < 0) {
      return value; // Don't allow negative numbers
    }

    // Validate electric readings
    if (field === 'newElectric' && value < room.currentElectric) {
      roomErrors.add('newElectric');
    }
    if (field === 'currentElectric' && room.newElectric < value) {
      roomErrors.add('newElectric');
    }

    // Validate water readings
    if (field === 'newWater' && value < room.currentWater) {
      roomErrors.add('newWater');
    }
    if (field === 'currentWater' && room.newWater < value) {
      roomErrors.add('newWater');
    }

    // Update validation errors
    if (roomErrors.size > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [room.roomName]: roomErrors
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[room.roomName];
        return newErrors;
      });
    }

    return value;
  };

  const handleInputChange = (
    roomName: string,
    field: EditableFields | RoomFields,
    inputValue: number
  ) => {
    const room = calculationRooms.find(r => r.roomName === roomName);
    if (!room) return;

    // Don't allow negative numbers
    const value = Math.max(0, inputValue);

    const updates: Partial<CalculationFields> & Partial<Room> = {};
    
    // Handle each field independently
    switch (field) {
      case 'currentElectric':
        updates.currentElectric = validateInput(room, field, value);
        break;
      case 'currentWater':
        updates.currentWater = validateInput(room, field, value);
        break;
      case 'newElectric':
        updates.newElectric = validateInput(room, field, value);
        break;
      case 'newWater':
        updates.newWater = validateInput(room, field, value);
        break;
      case 'roomPrice':
        updates.roomPrice = value;
        validateInput(room, field, value);
        break;
    }

    updateCalculationRoom(roomName, updates);
  };

  const handleAddRooms = (selectedRooms: Room[]) => {
    selectedRooms.forEach(room => addCalculationRoom(room));
  };

  const handleSave = () => {
    const updatedRooms: Room[] = calculationRooms.map(room => ({
      roomName: room.roomName,
      blockNumber: room.blockNumber,
      roomNumber: room.roomNumber,
      roomPrice: room.roomPrice,
      currentElectric: room.newElectric,
      currentWater: room.newWater,
      previousElectric: room.currentElectric,
      previousWater: room.currentWater,
      updatedAt: new Date().toISOString(),
    }));
    onSave(updatedRooms);
  };

  const toggleEdit = (roomName: string) => {
    const newEditing = new Set(editingRooms);
    if (newEditing.has(roomName)) {
      newEditing.delete(roomName);
    } else {
      newEditing.add(roomName);
    }
    setEditingRooms(newEditing);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-4xl w-full space-y-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Cập nhật chỉ số điện nước</h2>
          <div className="space-x-2">
            <Button 
              variant="outline"
              onClick={() => setIsSelectionOpen(true)}
            >
              Thêm phòng
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              Lưu
            </Button>
          </div>
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
                  value={blockNumber}
                  className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
                >
                  Dãy {blockNumber}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {blockGroups.map(({ blockNumber, rooms }) => (
            <TabsContent 
              key={blockNumber} 
              value={blockNumber}
              className="rounded-md border shadow-xs"
            >
              <div className="p-4 space-y-4">
                <div className="rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Phòng</th>
                        <th className="p-2 text-left">Giá Phòng</th>
                        <th className="p-2 text-left">Điện hiện tại</th>
                        <th className="p-2 text-left">Điện mới</th>
                        <th className="p-2 text-left">Nước hiện tại</th>
                        <th className="p-2 text-left">Nước mới</th>
                        <th className="p-2 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map(room => {
                        const isEditing = editingRooms.has(room.roomName);
                        return (
                          <tr key={room.roomName} className="border-b">
                            <td className="p-2">{room.roomName}</td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={room.roomPrice}
                                onChange={e =>
                                  handleInputChange(room.roomName, 'roomPrice', Number(e.target.value))
                                }
                                className={`w-24 ${validationErrors[room.roomName]?.has('roomPrice') ? 'border-red-500' : ''}`}
                                disabled={!isEditing}
                                min="0"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={room.currentElectric}
                                onChange={e =>
                                  handleInputChange(room.roomName, 'currentElectric', Number(e.target.value))
                                }
                                className={`w-24 ${validationErrors[room.roomName]?.has('currentElectric') ? 'border-red-500' : ''}`}
                                disabled={!isEditing}
                                min="0"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={room.newElectric}
                                onChange={e =>
                                  handleInputChange(room.roomName, 'newElectric', Number(e.target.value))
                                }
                                className={`w-24 ${validationErrors[room.roomName]?.has('newElectric') ? 'border-red-500' : ''}`}
                                placeholder="Điện mới"
                                min="0"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={room.currentWater}
                                onChange={e =>
                                  handleInputChange(room.roomName, 'currentWater', Number(e.target.value))
                                }
                                className={`w-24 ${validationErrors[room.roomName]?.has('currentWater') ? 'border-red-500' : ''}`}
                                disabled={!isEditing}
                                min="0"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={room.newWater}
                                onChange={e =>
                                  handleInputChange(room.roomName, 'newWater', Number(e.target.value))
                                }
                                className={`w-24 ${validationErrors[room.roomName]?.has('newWater') ? 'border-red-500' : ''}`}
                                placeholder="Nước mới"
                                min="0"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  tabIndex={-1}
                                  onClick={() => toggleEdit(room.roomName)}
                                  className={isEditing ? 'text-white bg-black' : 'text-primary'}
                                >
                                  <Pencil2Icon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  tabIndex={-1}
                                  size="icon"
                                  onClick={() => removeCalculationRoom(room.roomName)}
                                >
                                  <Cross2Icon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <RoomSelectionDialog
          isOpen={isSelectionOpen}
          onClose={() => setIsSelectionOpen(false)}
          onConfirm={handleAddRooms}
          availableRooms={getRemainingRooms(calculationRooms.map(r => r.roomName))}
        />
      </div>
    </div>
  );
}

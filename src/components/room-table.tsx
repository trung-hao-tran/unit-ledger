import { useState } from 'react';
import { DataTable } from './ui/data-table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RoomDialog } from './room-dialog';
import { useRoomsStore } from '@/store/rooms';
import { Pencil2Icon, Cross2Icon } from '@radix-ui/react-icons';
import type { Room } from '@/types';
import { ColumnDef } from '@tanstack/react-table';

interface RoomTableProps {
  rooms: Room[];
}

export function RoomTable({ rooms }: RoomTableProps) {
  const { editRoom, addRoom, deleteRoom } = useRoomsStore();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRoom(null);
    setIsEditDialogOpen(true);
  };

  const handleSave = (updatedRoom: Partial<Room>) => {
    if (selectedRoom) {
      // Edit existing room
      editRoom(selectedRoom.roomName, updatedRoom);
    } else {
      // Add new room
      addRoom(updatedRoom as Room);
    }
    setIsEditDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedRoom) return;

    deleteRoom(selectedRoom.roomName);
    setIsDeleteDialogOpen(false);
  };

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: 'roomName',
      header: 'Room Name',
    },
    {
      accessorKey: 'roomPrice',
      header: 'Price',
    },
    {
      accessorKey: 'currentElectric',
      header: 'Current Electric',
    },
    {
      accessorKey: 'currentWater',
      header: 'Current Water',
    },
    {
      accessorKey: 'previousElectric',
      header: 'Previous Electric',
    },
    {
      accessorKey: 'previousWater',
      header: 'Previous Water',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'));
        return date.toLocaleDateString();
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(room)}
              className="h-8 w-8 p-0"
            >
              <Pencil2Icon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(room)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-900 hover:bg-red-100"
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable 
        columns={columns} 
        data={rooms} 
        onAddNew={handleAddNew}
        blockNumbers={Array.from(new Set(rooms.map(room => room.blockNumber))).sort()}
      />

      <RoomDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSave}
        room={selectedRoom ?? undefined}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room {selectedRoom?.roomName}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

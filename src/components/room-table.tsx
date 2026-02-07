import { useState } from "react";
import { DataTable } from "./ui/data-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoomDialog } from "./room-dialog";
import { useRoomsStore } from "@/store/rooms";
import { Pencil2Icon, Cross2Icon } from "@radix-ui/react-icons";
import type { Room } from "@/types";
import {
  ColumnDef,
  FilterFn,
  VisibilityState,
  Updater,
  SortingFn,
} from "@tanstack/react-table";

interface RoomTableProps {
  rooms: Room[];
}

const fuzzyFilter: FilterFn<Room> = (row, columnId, value) => {
  const cellValue = row.getValue(columnId);
  if (typeof cellValue === "string" && typeof value === "string") {
    return cellValue.toLowerCase().includes(value.toLowerCase());
  }
  return false;
};

const getRoomSortingFn = <TData extends Room>(): SortingFn<TData> => {
  return (rowA, rowB) => {
    // First compare by block
    const blockA = rowA.getValue("blockNumber") as string;
    const blockB = rowB.getValue("blockNumber") as string;
    const blockComparison = blockA.localeCompare(blockB);

    // If blocks are different, return block comparison
    if (blockComparison !== 0) {
      return blockComparison;
    }

    // If blocks are the same, compare by room number
    const roomA = rowA.getValue("roomNumber") as number;
    const roomB = rowB.getValue("roomNumber") as number;
    return roomA - roomB;
  };
};

export function RoomTable({ rooms }: RoomTableProps) {
  const { editRoom, addRoom, deleteRoom } = useRoomsStore();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    blockNumber: false, // Hide block number column by default
    roomNumber: false, // Hide room number column by default
  });

  const handleColumnVisibilityChange = (
    updaterOrValue: Updater<VisibilityState>,
  ) => {
    if (typeof updaterOrValue === "function") {
      setColumnVisibility(updaterOrValue(columnVisibility));
    } else {
      setColumnVisibility(updaterOrValue);
    }
  };

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
      accessorKey: "roomNumber",
      enableSorting: true,
      enableColumnFilter: false,
      enableHiding: true,
    },
    {
      accessorKey: "roomName",
      header: "Phòng",
      filterFn: fuzzyFilter,
      enableColumnFilter: true,
      enableSorting: true,
      sortingFn: getRoomSortingFn(),
    },
    {
      accessorKey: "roomPrice",
      header: "Giá Phòng",
      enableSorting: true,
    },
    {
      accessorKey: "currentElectric",
      header: "Điện Hiện Tại",
      enableSorting: true,
    },
    {
      accessorKey: "previousElectric",
      header: "Điện Trước Đó",
      enableSorting: true,
    },
    {
      accessorKey: "currentWater",
      header: "Nước Hiện Tại",
      enableSorting: true,
    },
    {
      accessorKey: "previousWater",
      header: "Nước Trước Đó",
      enableSorting: true,
    },
    {
      accessorKey: "updatedAt",
      header: "Lần Cập Nhật Cuối",
      enableSorting: true,
      sortingFn: "datetime",
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      enableSorting: false,
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
              className="h-8 w-8 p-0"
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    // Hidden column for block filtering
    {
      accessorKey: "blockNumber",
      header: "Khu",
      filterFn: fuzzyFilter,
      enableColumnFilter: true,
      enableSorting: true,
    },
  ];

  // Extract unique block numbers for the filter dropdown
  const blockNumbers = [...new Set(rooms.map((room) => room.blockNumber))];

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-7xl w-full space-y-4 p-4">
        <DataTable
          columns={columns}
          data={rooms}
          onAddNew={handleAddNew}
          blockNumbers={blockNumbers}
          initialState={{
            columnVisibility,
          }}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />

        <RoomDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSave}
          room={selectedRoom ?? undefined}
        />

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn
                phòng và tất cả dữ liệu của nó.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

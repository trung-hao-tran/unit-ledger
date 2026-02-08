import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Room } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PreparationStageProps {
  rooms: Room[];
  onConfirm: (selectedRooms: Room[]) => void;
  onCancel: () => void;
}

type GroupByOption = "block" | "date";

interface RoomGroup {
  key: string;
  title: string;
  rooms: Room[];
  isAllSelected: boolean;
}

export function PreparationStage({
  rooms,
  onConfirm,
  onCancel,
}: PreparationStageProps) {
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByOption>("date");

  const roomGroups = useMemo(() => {
    const groups: RoomGroup[] = [];

    if (groupBy === "block") {
      // Group by block number
      const blockMap = new Map<string, Room[]>();

      rooms.forEach((room) => {
        const block = room.blockNumber;
        if (!blockMap.has(block)) {
          blockMap.set(block, []);
        }
        blockMap.get(block)!.push(room);
      });

      // Convert map to array and sort by block number
      Array.from(blockMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([blockNumber, blockRooms]) => {
          groups.push({
            key: `block-${blockNumber}`,
            title: `Dãy ${blockNumber}`,
            rooms: blockRooms.sort((a, b) => a.roomNumber - b.roomNumber),
            isAllSelected: blockRooms.every((room) =>
              selectedRooms.has(room.roomName),
            ),
          });
        });
    } else {
      // Group by update date
      const dateMap = new Map<string, Room[]>();

      rooms.forEach((room) => {
        const date = new Date(room.updatedAt);
        const dateKey = format(date, "dd/MM/yyyy", { locale: vi });

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(room);
      });

      // Convert map to array and sort by date (oldest first)
      Array.from(dateMap.entries())
        .sort(([dateA], [dateB]) => {
          // Parse dates in format dd/MM/yyyy
          const [dayA, monthA, yearA] = dateA.split("/").map(Number);
          const [dayB, monthB, yearB] = dateB.split("/").map(Number);

          // Compare years, then months, then days (ascending order)
          if (yearA !== yearB) return yearA - yearB;
          if (monthA !== monthB) return monthA - monthB;
          return dayA - dayB;
        })
        .forEach(([dateKey, dateRooms]) => {
          groups.push({
            key: `date-${dateKey}`,
            title: `Ngày ${dateKey}`,
            rooms: dateRooms.sort(
              (a, b) =>
                a.blockNumber.localeCompare(b.blockNumber) ||
                a.roomNumber - b.roomNumber,
            ),
            isAllSelected: dateRooms.every((room) =>
              selectedRooms.has(room.roomName),
            ),
          });
        });
    }

    return groups;
  }, [rooms, selectedRooms, groupBy]);

  const handleRoomSelect = (roomName: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    if (checked) {
      newSelected.add(roomName);
    } else {
      newSelected.delete(roomName);
    }
    setSelectedRooms(newSelected);
  };

  const handleGroupSelect = (groupKey: string, checked: boolean) => {
    const newSelected = new Set(selectedRooms);
    const group = roomGroups.find((g) => g.key === groupKey);

    if (!group) return;

    group.rooms.forEach((room) => {
      if (checked) {
        newSelected.add(room.roomName);
      } else {
        newSelected.delete(room.roomName);
      }
    });

    setSelectedRooms(newSelected);
  };

  const handleConfirm = () => {
    const selectedRoomsList = rooms.filter((room) =>
      selectedRooms.has(room.roomName),
    );
    onConfirm(selectedRoomsList);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-7xl w-full space-y-4 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Chọn Phòng</h2>
            <Select
              value={groupBy}
              onValueChange={(value: GroupByOption) => setGroupBy(value)}
            >
              <SelectTrigger className="w-50 h-8">
                <SelectValue placeholder="Xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Xếp theo ngày cập nhập</SelectItem>
                <SelectItem value="block">Xếp theo dãy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button onClick={handleConfirm} disabled={selectedRooms.size === 0}>
              Tiếp tục
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <ScrollArea className="h-[70vh]">
            {roomGroups.map((group) => (
              <div key={group.key} className="rounded-md border mb-4">
                <div className="flex items-center space-x-2 mb-4 p-4">
                  <Checkbox
                    id={group.key}
                    checked={group.isAllSelected}
                    onCheckedChange={(checked) =>
                      handleGroupSelect(group.key, checked === true)
                    }
                  />
                  <Label htmlFor={group.key} className="text-sm font-medium">
                    {group.title}
                  </Label>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 px-4 pb-4 ml-6">
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
                      <Label htmlFor={room.roomName} className="text-sm">
                        {room.roomName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

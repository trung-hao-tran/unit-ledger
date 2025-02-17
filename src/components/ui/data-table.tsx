import { Input } from './input';
import { Button } from './button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
  OnChangeFn,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "@radix-ui/react-icons";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onAddNew?: () => void;
  blockNumbers?: string[];
  initialState?: {
    columnVisibility?: VisibilityState;
  };
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onAddNew,
  blockNumbers = [],
  initialState,
  onColumnVisibilityChange,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange,
    initialState,
    state: {
      columnFilters,
      columnVisibility: initialState?.columnVisibility,
    },
  });

  const sortedBlockNumbers = [...blockNumbers].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-4">
          <Input
            placeholder="Filter rooms..."
            value={(table.getColumn('roomName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('roomName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn('blockNumber')?.getFilterValue() as string) ?? ''}
            onValueChange={(value: string) => {
              table.getColumn('blockNumber')?.setFilterValue(value === 'all' ? '' : value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All blocks</SelectItem>
              {sortedBlockNumbers.map((block) => (
                <SelectItem key={block} value={block}>
                  Block {block}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onAddNew && (
          <Button onClick={onAddNew} className="whitespace-nowrap">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Room
          </Button>
        )}
      </div>
      
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

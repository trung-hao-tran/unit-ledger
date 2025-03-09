import { Input } from './input';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
  OnChangeFn,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, CaretSortIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";

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
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange,
    onSortingChange: setSorting,
    initialState,
    state: {
      columnFilters,
      columnVisibility: initialState?.columnVisibility,
      sorting,
    },
  });

  const sortedBlockNumbers = [...blockNumbers].sort();

  // Define column widths consistently for both header and body
  const getColumnWidth = (columnId: string) => {
    switch (columnId) {
      case 'actions': return '80px';
      case 'roomName': return '120px';
      case 'roomPrice': return '120px';
      case 'currentElectric': return '140px';
      case 'previousElectric': return '140px';
      case 'currentWater': return '140px';
      case 'previousWater': return '140px';
      case 'updatedAt': return '160px';
      case 'blockNumber': return '120px';
      default: return '120px';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-4">
          <Input
            placeholder="Lọc phòng..."
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
              <SelectValue placeholder="Chọn dãy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả dãy</SelectItem>
              {sortedBlockNumbers.map((block) => (
                <SelectItem key={block} value={block}>
                  Dãy {block}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onAddNew && (
          <Button onClick={onAddNew} className="whitespace-nowrap">
            <PlusIcon className="mr-2 h-4 w-4" /> Thêm Phòng
          </Button>
        )}
      </div>
      
      <div className="rounded-md border">
        <ScrollArea className="w-full">
          <div className="min-w-[900px]">
            <div className="sticky top-0 z-10 bg-background">
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
                          className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap"
                          style={{ width: getColumnWidth(header.id) }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort()
                                  ? "flex items-center justify-center gap-1 cursor-pointer select-none"
                                  : "flex items-center justify-center"
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <div className="ml-1">
                                  {{
                                    asc: <ArrowUpIcon className="h-4 w-4" />,
                                    desc: <ArrowDownIcon className="h-4 w-4" />,
                                  }[header.column.getIsSorted() as string] ?? (
                                    <CaretSortIcon className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
              </table>
            </div>
            <ScrollArea className="h-[calc(100vh-220px)] min-h-[400px]">
              <table className="w-full caption-bottom text-sm">
                <tbody className="[&_tr:last-child]:border-0">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td 
                            key={cell.id} 
                            className="p-4 text-center align-middle"
                            style={{ width: getColumnWidth(cell.column.id) }}
                          >
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
            </ScrollArea>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

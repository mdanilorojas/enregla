import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Eye, Edit, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from '@/lib/lucide-icons'

export interface PermitRow {
  id: string
  location: string
  locationId: string | null
  type: string
  status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado'
  expires_at: string | null
  authority: string
  responsible: string
}

const columnHelper = createColumnHelper<PermitRow>()

export interface PermitTableProps {
  data: PermitRow[]
}

export function PermitTable({ data }: PermitTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(() => [
    columnHelper.accessor('location', {
      header: 'Sede',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('type', { header: 'Tipo' }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: info => {
        const status = info.getValue()
        const variant = {
          vigente: 'status-vigente' as const,
          por_vencer: 'status-por-vencer' as const,
          vencido: 'status-vencido' as const,
          en_tramite: 'status-en-tramite' as const,
          no_registrado: 'status-no-registrado' as const,
        }[status]
        return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
      },
    }),
    columnHelper.accessor('expires_at', {
      header: 'Vencimiento',
      cell: info => {
        const v = info.getValue()
        return v ? new Date(v).toLocaleDateString('es-EC') : '-'
      },
    }),
    columnHelper.accessor('authority', { header: 'Autoridad' }),
    columnHelper.accessor('responsible', {
      header: 'Responsable',
      cell: info => (
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <Avatar name={info.getValue()} size="sm" />
          <span>{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-[var(--ds-space-050)]">
          <Link to={`/permisos/${row.original.id}`}>
            <Button variant="subtle" size="sm"><Eye className="w-3.5 h-3.5" /></Button>
          </Link>
          <Link to={`/permisos/${row.original.id}?edit=true`}>
            <Button variant="subtle" size="sm"><Edit className="w-3.5 h-3.5" /></Button>
          </Link>
        </div>
      ),
    }),
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div className="space-y-[var(--ds-space-200)]">
      <div className="overflow-x-auto rounded-[var(--ds-radius-100)] shadow-[var(--ds-shadow-raised)] bg-white">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-[var(--ds-space-150)] py-[var(--ds-space-100)] text-left text-[var(--ds-font-size-050)] font-semibold uppercase tracking-wide text-[var(--ds-text-subtle)] bg-[var(--ds-neutral-50)] border-b-2 border-[var(--ds-border)] cursor-pointer hover:text-[var(--ds-text)]"
                  >
                    <div className="flex items-center gap-[var(--ds-space-050)]">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-[var(--ds-neutral-50)] transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-[var(--ds-space-150)] py-[var(--ds-space-150)] border-b border-[var(--ds-border)]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
          Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
        </div>
        <div className="flex items-center gap-[var(--ds-space-100)]">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-[var(--ds-space-100)] py-[var(--ds-space-050)] border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] text-[var(--ds-font-size-075)]"
          >
            {[25, 50, 100].map(s => <option key={s} value={s}>{s} por página</option>)}
          </select>
          <Button
            variant="outline" size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

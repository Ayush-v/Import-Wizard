import { cn } from "@/lib/utils"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
    rows: string[][]
    columns: string[]
    selectedRow?: number
    onSelectRow?: (index: number) => void
    showRowIndex?: boolean
    showHeader?: boolean
    headerRow?: string[]
    columnWidths?: number[]
    minColumnWidth?: number
}

export function VirtualizedTable({
    rows,
    columns,
    selectedRow,
    onSelectRow,
    showRowIndex = false,
    showHeader,
    headerRow,
    columnWidths,
    minColumnWidth = 120
}: Props) {
    const parentRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
        overscan: 10,
    })

    // Monitor container width changes
    useEffect(() => {
        const updateWidth = () => {
            if (parentRef.current) {
                setContainerWidth(parentRef.current.clientWidth)
            }
        }

        updateWidth()

        const resizeObserver = new ResizeObserver(updateWidth)
        if (parentRef.current) {
            resizeObserver.observe(parentRef.current)
        }

        return () => resizeObserver.disconnect()
    }, [])

    const hasRowIndexOrSelect = !!onSelectRow || !!showRowIndex

    // Calculate total width and column template
    const { columnTemplate, totalWidth, needsHorizontalScroll } = useMemo(() => {
        const indexColumnWidth = hasRowIndexOrSelect ? 64 : 0
        const dataColumnWidths = columnWidths || columns.map(() => minColumnWidth)
        const totalDataWidth = dataColumnWidths.reduce((sum, width) => sum + width, 0)
        const totalWidth = indexColumnWidth + totalDataWidth

        // Dynamic detection based on actual container width
        const needsHorizontalScroll = containerWidth > 0 && totalWidth > containerWidth

        const template = [
            hasRowIndexOrSelect ? (needsHorizontalScroll ? `${indexColumnWidth}px` : `${indexColumnWidth}px`) : null,
            ...dataColumnWidths.map(width =>
                needsHorizontalScroll ? `${width}px` : `minmax(${Math.min(width, 120)}px, 1fr)`
            )
        ].filter(Boolean).join(' ')

        return { columnTemplate: template, totalWidth, needsHorizontalScroll }
    }, [columns, columnWidths, hasRowIndexOrSelect, minColumnWidth, containerWidth])

    return (
        <div className="border rounded-md overflow-hidden">
            <div
                ref={parentRef}
                className="max-h-96 overflow-auto relative"
                style={{ position: "relative" }}
            >
                {showHeader && (
                    <div
                        className="grid border-b text-sm font-medium bg-gray-100 sticky top-0 z-10"
                        style={{
                            gridTemplateColumns: columnTemplate,
                            ...(needsHorizontalScroll && { minWidth: `${totalWidth}px` })
                        }}
                    >
                        {hasRowIndexOrSelect && <div className="border-r p-2">#</div>}
                        {columns.map((col, i) => (
                            <div key={i} className="border-r last:border-r-0 p-2 truncate">
                                {col}
                            </div>
                        ))}
                    </div>
                )}
                <div
                    style={{
                        height: rowVirtualizer.getTotalSize(),
                        position: "relative",
                        ...(needsHorizontalScroll && { minWidth: `${totalWidth}px` }),
                    }}
                    className="w-full"
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const index = virtualRow.index
                        const row = rows[index]

                        return (
                            <div
                                key={index}
                                ref={rowVirtualizer.measureElement}
                                data-index={index}
                                style={{
                                    transform: `translateY(${virtualRow.start}px)`,
                                    position: "absolute",
                                    left: 0,
                                    ...(needsHorizontalScroll
                                        ? { width: `${totalWidth}px` }
                                        : { right: 0 }
                                    ),
                                    display: "grid",
                                    gridTemplateColumns: columnTemplate,
                                }}
                                className={cn(
                                    "border-b text-sm cursor-pointer",
                                    selectedRow === index ? "bg-muted/50" : index % 2 === 0 ? "bg-white" : "bg-gray-50",
                                )}
                                onClick={() => onSelectRow?.(index)}
                            >
                                {hasRowIndexOrSelect && (
                                    <div className="border-r p-2 flex items-center justify-center">
                                        {onSelectRow ? (
                                            <div className="relative flex items-center">
                                                <input
                                                    type="radio"
                                                    name="selectedRow"
                                                    checked={selectedRow === index}
                                                    onChange={() => onSelectRow?.(index)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "appearance-none h-4 w-4 rounded-full border shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                                        selectedRow === index ? "border-primary" : "border-gray-300"
                                                    )}
                                                />
                                                {selectedRow === index && (
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500">{index + 1}</span>
                                        )}
                                    </div>
                                )}
                                {row.map((cell, i) => (
                                    <div
                                        key={i}
                                        className="border-r last:border-r-0 p-2 truncate"
                                        title={cell}
                                    >
                                        {cell}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
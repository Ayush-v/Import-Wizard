import { Button } from "@/components/ui/button"
import { Info, ChevronLeft, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VirtualizedTable } from "../_components/VirtualizedTable"

type Props = {
    fileName: string
    rows: string[][]
    selectedHeaderRow: number | null
    onSelectRow: (index: number) => void
    onNext: () => void
    onBack: () => void
}

export default function SelectHeaderStep({
    fileName,
    rows,
    selectedHeaderRow,
    onSelectRow,
    onNext,
    onBack,
}: Props) {
    const columnHeaders = rows[0]?.map((_, i) => `Column ${i + 1}`) || []
    return (
        <>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select header row</h2>
            <p className="text-gray-500 mb-6">Choose which row contains your column headers</p>

            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">File: {fileName}</h3>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-2">
                                    <Info className="h-4 w-4 text-gray-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    Select the row that contains your column headers. This will be used to map your data in the next
                                    step.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <VirtualizedTable
                    rows={rows}
                    columns={columnHeaders}
                    selectedRow={selectedHeaderRow ?? undefined}
                    onSelectRow={onSelectRow}
                />

            </div>

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={onNext} className="flex items-center gap-2">
                    Next <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </>
    )
}

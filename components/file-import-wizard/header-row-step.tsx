"use client"

import { Info, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { FileData } from "./types"

interface HeaderRowStepProps {
  displayData: FileData | null
  selectedHeaderRow: number | null
  onHeaderRowSelect: (rowIndex: number) => void
  onNext: () => void
  onPrevious: () => void
}

export function HeaderRowStep({
  displayData,
  selectedHeaderRow,
  onHeaderRowSelect,
  onNext,
  onPrevious,
}: HeaderRowStepProps) {
  if (!displayData) return null

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select header row</h2>
      <p className="text-gray-500 mb-6">Choose which row contains your column headers</p>

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">File: {displayData.fileName}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Info className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Select the row that contains your column headers. This will be used to map your data in the next step.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <RadioGroup
            value={selectedHeaderRow?.toString()}
            onValueChange={(value) => onHeaderRowSelect(Number.parseInt(value))}
          >
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {displayData.rows.slice(0, 10).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={cn(
                        "border-b last:border-b-0",
                        selectedHeaderRow === rowIndex
                          ? "bg-primary/5"
                          : rowIndex % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50",
                      )}
                    >
                      <td className="px-4 py-3 border-r w-16">
                        <div className="flex items-center">
                          <RadioGroupItem value={rowIndex.toString()} id={`row-${rowIndex}`} />
                          <Label htmlFor={`row-${rowIndex}`} className="ml-2">
                            Row {rowIndex + 1}
                          </Label>
                        </div>
                      </td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 text-gray-600 border-r last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="flex items-center gap-2" disabled={selectedHeaderRow === null}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

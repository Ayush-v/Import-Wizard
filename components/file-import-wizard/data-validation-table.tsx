"use client"

import { TooltipContent } from "@/components/ui/tooltip"

import { TooltipTrigger } from "@/components/ui/tooltip"

import { Tooltip } from "@/components/ui/tooltip"

import { TooltipProvider } from "@/components/ui/tooltip"

import { useState } from "react"
import { Edit, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ColumnMapping, ExpectedColumn, ValidationIssue } from "./types"

interface DataValidationTableProps {
  expectedColumns: ExpectedColumn[]
  columnMappings: ColumnMapping[]
  dataRows: string[][]
  validationIssues: ValidationIssue[]
  selectedHeaderRow: number
  selectedRows: number[]
  editingRow: number | null
  editedData: Record<string, any>
  onRowSelect: (rowIndex: number, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onStartEditing: (rowIndex: number) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditFieldChange: (field: string, value: string) => void
}

export function DataValidationTable({
  expectedColumns,
  columnMappings,
  dataRows,
  validationIssues,
  selectedHeaderRow,
  selectedRows,
  editingRow,
  editedData,
  onRowSelect,
  onSelectAll,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditFieldChange,
}: DataValidationTableProps) {
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    onSelectAll(checked)
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 w-10">
              <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="Select all rows" />
            </th>
            {expectedColumns.map((col) => (
              <th key={col.field} className="px-4 py-3 text-left font-medium text-gray-700">
                {col.label}
                {col.field === "isManager" && <span className="ml-2 text-xs text-gray-500">(toggle)</span>}
              </th>
            ))}
            <th className="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIndex) => {
            const actualRowIndex = rowIndex + selectedHeaderRow + 1
            const isSelected = selectedRows.includes(actualRowIndex)
            const isEditing = editingRow === actualRowIndex

            // Check if this row has any validation issues
            const rowIssues = validationIssues.filter((issue) => issue.row === actualRowIndex + 1)

            const hasError = rowIssues.some((issue) => issue.severity === "error")
            const hasWarning = rowIssues.some((issue) => issue.severity === "warning")

            return (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b last:border-b-0",
                  isSelected ? "bg-primary/5" : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50",
                  hasError ? "bg-red-50" : hasWarning ? "bg-yellow-50/50" : "",
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onRowSelect(actualRowIndex, !!checked)}
                    aria-label={`Select row ${rowIndex + 1}`}
                  />
                </td>
                {expectedColumns.map((col, colIndex) => {
                  const mapping = columnMappings.find((m) => m.targetField === col.field)
                  if (!mapping)
                    return (
                      <td key={colIndex} className="px-4 py-3 text-gray-600">
                        -
                      </td>
                    )

                  // Get value from primary source
                  let value = mapping.sourceIndex !== null ? row[mapping.sourceIndex] : "-"

                  // Add values from additional sources if any
                  if (mapping.additionalSources && mapping.additionalSources.length > 0) {
                    const additionalValues = mapping.additionalSources
                      .map((source) => row[source.sourceIndex])
                      .filter(Boolean)

                    if (additionalValues.length > 0) {
                      value = [value, ...additionalValues].filter((v) => v !== "-").join(", ")
                    }
                  }

                  // Check if this cell has a validation issue
                  const cellIssue = validationIssues.find(
                    (issue) => issue.row === actualRowIndex + 1 && issue.column === col.field,
                  )

                  // For boolean fields (isManager), render a switch
                  if (col.field === "isManager") {
                    return (
                      <td key={colIndex} className="px-4 py-3">
                        <Switch checked={value === "true"} disabled={isEditing} />
                        {/* <Switch checked={value.toLowerCase() === "true"} disabled={isEditing} /> */}
                      </td>
                    )
                  }

                  // If editing this row, show input field
                  if (isEditing) {
                    return (
                      <td key={colIndex} className="px-4 py-3">
                        <Input
                          value={editedData[col.field] || value}
                          onChange={(e) => onEditFieldChange(col.field, e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                    )
                  }

                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        "px-4 py-3",
                        cellIssue?.severity === "error"
                          ? "text-red-600"
                          : cellIssue?.severity === "warning"
                            ? "text-amber-600"
                            : "text-gray-600",
                      )}
                    >
                      {value}
                      {cellIssue && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-3 w-3 inline ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{cellIssue.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={onSaveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={onCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onStartEditing(actualRowIndex)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

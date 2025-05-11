"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ColumnMapping, ExpectedColumn, FileData } from "./types"
import { TransformationOptions } from "./transformation-options"

interface ColumnMappingSectionProps {
  expectedColumn: ExpectedColumn
  mapping: ColumnMapping
  headerRow: string[]
  displayData: FileData
  selectedHeaderRow: number
  onMappingChange: (targetField: string, sourceIndex: number | null) => void
  onTransformationChange: (targetField: string, transformation: any) => void
  onAdditionalSourceAdd: (targetField: string, sourceIndex: number, label: string) => void
  onAdditionalSourceRemove: (targetField: string, sourceIndex: number) => void
}

export function ColumnMappingSection({
  expectedColumn,
  mapping,
  headerRow,
  displayData,
  selectedHeaderRow,
  onMappingChange,
  onTransformationChange,
  onAdditionalSourceAdd,
  onAdditionalSourceRemove,
}: ColumnMappingSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showMultiSelect, setShowMultiSelect] = useState(false)

  // Get all columns that are not already used as the primary source
  const availableColumns = headerRow.filter((_, index) => {
    // Don't include the primary source
    if (index === mapping.sourceIndex) return false

    // Include columns that are already used as additional sources
    // (we'll show them as checked in the multi-select)
    return true
  })

  // Track which columns are selected in the multi-select
  const [selectedColumns, setSelectedColumns] = useState<number[]>(() =>
    mapping.additionalSources.map((source) => source.sourceIndex),
  )

  const toggleColumnSelection = (columnIndex: number) => {
    if (selectedColumns.includes(columnIndex)) {
      setSelectedColumns(selectedColumns.filter((idx) => idx !== columnIndex))
    } else {
      setSelectedColumns([...selectedColumns, columnIndex])
    }
  }

  const applyMultiSelection = () => {
    // First, remove any existing additional sources
    mapping.additionalSources.forEach((source) => {
      onAdditionalSourceRemove(expectedColumn.field, source.sourceIndex)
    })

    // Then add all selected columns as additional sources
    selectedColumns.forEach((columnIndex) => {
      onAdditionalSourceAdd(expectedColumn.field, columnIndex, headerRow[columnIndex])
    })

    setShowMultiSelect(false)
  }

  const cancelMultiSelection = () => {
    // Reset selection to current additional sources
    setSelectedColumns(mapping.additionalSources.map((source) => source.sourceIndex))
    setShowMultiSelect(false)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Select
            value={mapping.sourceIndex !== null ? mapping.sourceIndex.toString() : ""}
            onValueChange={(value) =>
              onMappingChange(expectedColumn.field, value === "" ? null : Number.parseInt(value))
            }
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder={expectedColumn.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">Not mapped</SelectItem>
              {headerRow.map((header, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {header} (Column {index + 1})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {mapping.sourceIndex !== null && (
            <Badge variant="outline" className="ml-2">
              <Check className="h-3 w-3 mr-1" />
            </Badge>
          )}

          {mapping.required && <span className="text-red-500 ml-1">*</span>}
        </div>

        <div className="flex items-center gap-2">
          {mapping.sourceIndex !== null && (
            <TransformationOptions
              mapping={mapping}
              expectedColumn={expectedColumn}
              displayData={displayData}
              selectedHeaderRow={selectedHeaderRow}
              onTransformationChange={onTransformationChange}
            />
          )}

          {mapping.sourceIndex !== null && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowMultiSelect(true)}
            >
              Match Multiple
            </Button>
          )}
        </div>
      </div>

      {mapping.additionalSources.length > 0 && (
        <div className="mt-2 mb-2">
          <div className="flex flex-wrap gap-2">
            {mapping.additionalSources.map((source) => (
              <Badge key={source.sourceIndex} variant="secondary" className="flex items-center gap-1">
                {source.label}
                <button
                  className="ml-1 hover:text-red-500"
                  onClick={() => onAdditionalSourceRemove(expectedColumn.field, source.sourceIndex)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showMultiSelect && (
        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Match Multiple Columns to {expectedColumn.label}</h4>
            <Button variant="ghost" size="sm" onClick={cancelMultiSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto mb-4">
            {availableColumns.map((column, index) => {
              const actualIndex = headerRow.indexOf(column)
              const isSelected = selectedColumns.includes(actualIndex)

              return (
                <div key={index} className="flex items-center space-x-2 py-1.5 border-b last:border-0">
                  <Checkbox
                    id={`col-${expectedColumn.field}-${actualIndex}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleColumnSelection(actualIndex)}
                  />
                  <Label htmlFor={`col-${expectedColumn.field}-${actualIndex}`} className="flex-1 cursor-pointer">
                    {column}
                  </Label>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelMultiSelection}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyMultiSelection}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

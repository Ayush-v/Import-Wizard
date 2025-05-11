"use client"
import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { ColumnMapping, ExpectedColumn, FileData, TransformationType } from "./types"

interface TransformationOptionsProps {
  mapping: ColumnMapping
  expectedColumn: ExpectedColumn
  displayData: FileData
  selectedHeaderRow: number
  onTransformationChange: (targetField: string, transformation: any) => void
}

export function TransformationOptions({
  mapping,
  expectedColumn,
  displayData,
  selectedHeaderRow,
  onTransformationChange,
}: TransformationOptionsProps) {
  const dataType = expectedColumn.dataType || "text"

  // Apply transformations to a value
  const transformValue = (value: string, transformation: any): string => {
    if (!value) return value

    switch (transformation.type) {
      case "none":
        return value
      case "trim":
        return value.trim()
      case "uppercase":
        return value.toUpperCase()
      case "lowercase":
        return value.toLowerCase()
      case "capitalize":
        return value
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      case "number":
        const num = Number.parseFloat(value)
        if (isNaN(num)) return value
        const places = transformation.options?.decimalPlaces ?? 0
        return num.toFixed(places)
      case "boolean":
        const trueValues = transformation.options?.trueValues || ["true", "yes", "1"]
        const falseValues = transformation.options?.falseValues || ["false", "no", "0"]

        if (trueValues.includes(value.toLowerCase())) return "true"
        if (falseValues.includes(value.toLowerCase())) return "false"
        return value
      case "date":
        try {
          const date = new Date(value)
          // In a real app, you'd use a proper date formatting library
          return date.toLocaleDateString()
        } catch {
          return value
        }
      case "custom":
        // In a real app, you'd implement a safe way to evaluate custom formulas
        // This is just a placeholder
        return `${value} (custom)`
      default:
        return value
    }
  }

  // Get transformed value for preview
  const getTransformedValue = (): string => {
    if (!displayData || selectedHeaderRow === null || mapping.sourceIndex === null) return "-"

    const dataRows = displayData.rows.slice(selectedHeaderRow + 1)
    if (dataRows.length === 0) return "-"

    const originalValue = dataRows[0][mapping.sourceIndex]
    return transformValue(originalValue, mapping.transformation)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("ml-2", mapping.transformation.type !== "none" && "bg-primary/10 border-primary/20")}
        >
          <Wand2 className="h-3.5 w-3.5 mr-1" />
          {mapping.transformation.type === "none" ? "Transform" : "Transforming"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Transform {expectedColumn.label}</h4>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor={`transform-${mapping.targetField}`}>Transformation</Label>
                <Select
                  value={mapping.transformation.type}
                  onValueChange={(value) =>
                    onTransformationChange(mapping.targetField, { type: value as TransformationType })
                  }
                >
                  <SelectTrigger id={`transform-${mapping.targetField}`}>
                    <SelectValue placeholder="Select transformation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="trim">Trim whitespace</SelectItem>
                    <SelectItem value="uppercase">UPPERCASE</SelectItem>
                    <SelectItem value="lowercase">lowercase</SelectItem>
                    <SelectItem value="capitalize">Capitalize</SelectItem>
                    {dataType === "number" && <SelectItem value="number">Format as number</SelectItem>}
                    {dataType === "boolean" && <SelectItem value="boolean">Format as boolean</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* Number options */}
              {mapping.transformation.type === "number" && (
                <div className="space-y-2">
                  <Label htmlFor={`decimal-places-${mapping.targetField}`}>Decimal places</Label>
                  <Select
                    value={(mapping.transformation.options?.decimalPlaces || 0).toString()}
                    onValueChange={(value) =>
                      onTransformationChange(mapping.targetField, {
                        type: "number",
                        options: {
                          ...mapping.transformation.options,
                          decimalPlaces: Number.parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger id={`decimal-places-${mapping.targetField}`}>
                      <SelectValue placeholder="Select decimal places" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 (Integer)</SelectItem>
                      <SelectItem value="1">1 decimal place</SelectItem>
                      <SelectItem value="2">2 decimal places</SelectItem>
                      <SelectItem value="3">3 decimal places</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Boolean options */}
              {mapping.transformation.type === "boolean" && (
                <div className="space-y-3">
                  <div>
                    <Label className="mb-1 block">Values treated as TRUE</Label>
                    <div className="flex flex-wrap gap-1">
                      {(mapping.transformation.options?.trueValues || ["true", "yes", "1"]).map((value, i) => (
                        <Badge key={i} variant="outline" className="bg-green-50">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block">Values treated as FALSE</Label>
                    <div className="flex flex-wrap gap-1">
                      {(mapping.transformation.options?.falseValues || ["false", "no", "0"]).map((value, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-2">
              {dataType === "date" && (
                <div className="space-y-2">
                  <Label htmlFor={`date-format-${mapping.targetField}`}>Date format</Label>
                  <Select
                    value={mapping.transformation.type === "date" ? "date" : "none"}
                    onValueChange={(value) =>
                      onTransformationChange(mapping.targetField, {
                        type: value as TransformationType,
                        options: { dateFormat: "MM/DD/YYYY" },
                      })
                    }
                  >
                    <SelectTrigger id={`date-format-${mapping.targetField}`}>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="date">Format as date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`custom-formula-${mapping.targetField}`}>Custom formula</Label>
                  <Switch
                    id={`custom-switch-${mapping.targetField}`}
                    checked={mapping.transformation.type === "custom"}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onTransformationChange(mapping.targetField, {
                          type: "custom",
                          options: { customFormula: "" },
                        })
                      } else {
                        onTransformationChange(mapping.targetField, { type: "none" })
                      }
                    }}
                  />
                </div>

                {mapping.transformation.type === "custom" && (
                  <div className="pt-2">
                    <Input
                      id={`custom-formula-${mapping.targetField}`}
                      placeholder="e.g., value.replace('old', 'new')"
                      value={mapping.transformation.options?.customFormula || ""}
                      onChange={(e) =>
                        onTransformationChange(mapping.targetField, {
                          type: "custom",
                          options: { customFormula: e.target.value },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">Use 'value' to reference the original cell value</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id={`apply-empty-${mapping.targetField}`} checked={false} />
                  <Label htmlFor={`apply-empty-${mapping.targetField}`}>Apply to empty values</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {displayData && selectedHeaderRow !== null && mapping.sourceIndex !== null && (
            <div className="pt-2 border-t">
              <h5 className="text-sm font-medium mb-2">Preview</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 block">Original</span>
                  <div className="border rounded p-1.5 bg-gray-50">
                    {displayData.rows[selectedHeaderRow + 1][mapping.sourceIndex]}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block">Transformed</span>
                  <div className="border rounded p-1.5 bg-primary/5 border-primary/20">{getTransformedValue()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

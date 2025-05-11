"use client"

import type React from "react"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  AlertCircle,
  ArrowDown,
  Wand2,
  Save,
  Trash2,
  BookmarkPlus,
  Bookmark,
  MoreHorizontal,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Step = {
  number: number
  label: string
  isActive: boolean
  isCompleted: boolean
}

type FileData = {
  rows: string[][]
  fileName: string
}

type TransformationType =
  | "none"
  | "trim"
  | "uppercase"
  | "lowercase"
  | "capitalize"
  | "number"
  | "date"
  | "boolean"
  | "custom"

type TransformationConfig = {
  type: TransformationType
  options?: {
    dateFormat?: string
    decimalPlaces?: number
    trueValues?: string[]
    falseValues?: string[]
    customFormula?: string
  }
}

type ColumnMapping = {
  sourceIndex: number | null
  targetField: string
  required: boolean
  transformation: TransformationConfig
  additionalSources?: { sourceIndex: number; label: string }[]
}

type ValidationIssue = {
  row: number
  column: string
  message: string
  severity: "error" | "warning"
}

type TransformationTemplate = {
  id: string
  name: string
  description: string
  dateCreated: string
  mappings: ColumnMapping[]
}

function isBooleanLike(value: any) {
  return (
    value === true ||
    value === false ||
    value === "true" ||
    value === "false" ||
    value === 1 ||
    value === 0 ||
    value === "1" ||
    value === "0"
  );
}

export default function FileImportWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number | null>(0)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [validationProgress, setValidationProgress] = useState(0)
  const [showAdvancedTransformations, setShowAdvancedTransformations] = useState(false)
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [savedTemplates, setSavedTemplates] = useState<TransformationTemplate[]>([
    {
      id: "template-1",
      name: "Standard Text Cleanup",
      description: "Trims whitespace and capitalizes names",
      dateCreated: "2023-05-15",
      mappings: [
        {
          sourceIndex: 0,
          targetField: "name",
          required: true,
          transformation: { type: "capitalize" },
        },
        {
          sourceIndex: 1,
          targetField: "surname",
          required: true,
          transformation: { type: "capitalize" },
        },
        {
          sourceIndex: 2,
          targetField: "age",
          required: true,
          transformation: { type: "number", options: { decimalPlaces: 0 } },
        },
        {
          sourceIndex: 3,
          targetField: "team",
          required: true,
          transformation: { type: "trim" },
        },
        {
          sourceIndex: 4,
          targetField: "isManager",
          required: false,
          transformation: {
            type: "boolean",
            options: {
              trueValues: ["true", "yes", "1", "y"],
              falseValues: ["false", "no", "0", "n"],
            },
          },
        },
      ],
    },
    {
      id: "template-2",
      name: "All Uppercase",
      description: "Converts all text fields to uppercase",
      dateCreated: "2023-06-22",
      mappings: [
        {
          sourceIndex: 0,
          targetField: "name",
          required: true,
          transformation: { type: "uppercase" },
        },
        {
          sourceIndex: 1,
          targetField: "surname",
          required: true,
          transformation: { type: "uppercase" },
        },
        {
          sourceIndex: 2,
          targetField: "age",
          required: true,
          transformation: { type: "number", options: { decimalPlaces: 0 } },
        },
        {
          sourceIndex: 3,
          targetField: "team",
          required: true,
          transformation: { type: "uppercase" },
        },
        {
          sourceIndex: 4,
          targetField: "isManager",
          required: false,
          transformation: { type: "boolean" },
        },
      ],
    },
  ])

  const [steps, setSteps] = useState<Step[]>([
    { number: 1, label: "Upload file", isActive: true, isCompleted: false },
    { number: 2, label: "Select header row", isActive: false, isCompleted: false },
    { number: 3, label: "Match Columns", isActive: false, isCompleted: false },
    { number: 4, label: "Validate data", isActive: false, isCompleted: false },
  ])

  const [useRealValidation, setUseRealValidation] = useState(true)

  // Expected columns definition
  const expectedColumns = [
    { field: "name", label: "NAME", required: true, dataType: "text" },
    { field: "surname", label: "SURNAME", required: true, dataType: "text" },
    { field: "age", label: "AGE", required: true, dataType: "number" },
    { field: "team", label: "TEAM", required: true, dataType: "text" },
    { field: "isManager", label: "IS MANAGER", required: false, dataType: "boolean" },
  ]

  const sampleData = [
    {
      name: "Stephanie",
      surname: "McDonald",
      age: "23",
      team: "Team one",
      isManager: "true",
    },
  ]

  // Mock data for preview when no file is uploaded
  const getMockFileData = (): FileData => {
    return {
      fileName: "example.csv",
      rows: [
        ["NAME", "SURNAME", "AGE", "TEAM", "IS MANAGER"],
        ["John", "Doe", "30", "Team A", "false"],
        ["Jane", "Smith", "28", "Team B", "true"],
        ["Michael", "Johnson", "35", "Team A", "false"],
        ["Emily", "Williams", "32", "Team C", "true"],
        ["Robert ", " Brown", "27", "team b", "FALSE"],
      ],
    }
  }

  // Use mock data if no file is uploaded but we're on step 2 or higher
  const displayData = fileData || (currentStep >= 2 ? getMockFileData() : null)

  // Initialize column mappings
  useEffect(() => {
    setColumnMappings(
      expectedColumns.map((col) => ({
        sourceIndex: null,
        targetField: col.field,
        required: col.required,
        transformation: {
          type: "none",
        },
      })),
    )
  }, [])

  // Update steps when current step changes
  useEffect(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({
        ...step,
        isActive: step.number === currentStep,
        isCompleted: step.number < currentStep,
      })),
    )
  }, [currentStep])

  // Auto-map columns when header row is selected
  useEffect(() => {
    if (displayData && selectedHeaderRow !== null) {
      const headerRow = displayData.rows[selectedHeaderRow]

      // Try to auto-map columns based on header names
      const newMappings = columnMappings.map((mapping) => {
        const matchIndex = headerRow.findIndex(
          (header) => header.toLowerCase().trim() === mapping.targetField.toLowerCase(),
        )

        // Auto-suggest transformations based on data type
        let transformation = mapping.transformation
        const expectedCol = expectedColumns.find((col) => col.field === mapping.targetField)

        if (expectedCol) {
          if (expectedCol.dataType === "number") {
            transformation = { type: "number", options: { decimalPlaces: 0 } }
          } else if (expectedCol.dataType === "boolean") {
            transformation = {
              type: "boolean",
              options: {
                trueValues: ["true", "yes", "1"],
                falseValues: ["false", "no", "0"],
              },
            }
          } else if (mapping.targetField.toLowerCase().includes("name")) {
            transformation = { type: "trim" }
          }
        }

        return {
          ...mapping,
          sourceIndex: matchIndex !== -1 ? matchIndex : mapping.sourceIndex,
          transformation: matchIndex !== -1 ? transformation : mapping.transformation,
        }
      })

      setColumnMappings(newMappings)
    }
  }, [selectedHeaderRow, displayData])

  // Mock file parsing function (in a real app, you'd use a library like xlsx or papaparse)
  const parseFile = useCallback((file: File): Promise<FileData> => {
    return new Promise((resolve) => {
      // Mock CSV parsing - in a real app, use proper parsing libraries
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        // Simple CSV parsing (this is a mock implementation)
        const rows = content.split("\n").map((line) => line.split(",").map((cell) => cell.trim()))
        resolve({ rows, fileName: file.name })
      }
      reader.readAsText(file)
    })
  }, [])

  // Helper to remove rows where all mapped columns are empty
  function removeEmptyRows(fileData: FileData, expectedColumns: any[], selectedHeaderRow: number) {
    const header = fileData.rows[selectedHeaderRow]
    // Find indices of columns that match expected fields
    const mappedIndices = expectedColumns.map(col =>
      header.findIndex(h => h.toLowerCase().trim() === col.field.toLowerCase())
    )
    return {
      ...fileData,
      rows: fileData.rows.filter((row, idx) => {
        if (idx <= selectedHeaderRow) return true // keep header and above
        return mappedIndices.some(i => i !== -1 && row[i] && row[i].trim() !== "")
      })
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      // Parse the file
      const parsedData = await parseFile(file)

      // Auto-select the first row as header by default
      let headerRowIndex = 0
      if (parsedData.rows.length > 0) {
        headerRowIndex = 0
      }

      // Remove empty rows right after upload
      const filteredData = removeEmptyRows(parsedData, expectedColumns, headerRowIndex)
      setFileData(filteredData)
      setSelectedHeaderRow(headerRowIndex)

      // Move to next step
      setCurrentStep(2)
    } catch (error) {
      console.error("Error parsing file:", error)
      // Handle error state here
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const goToNextStep = () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)

      // If moving to validation step, run validation
      if (nextStep === 4) {
        validateData()
      }
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleColumnMappingChange = (targetField: string, sourceIndex: number | null) => {
    setColumnMappings(
      columnMappings.map((mapping) => (mapping.targetField === targetField ? { ...mapping, sourceIndex } : mapping)),
    )
  }

  const handleTransformationChange = (targetField: string, transformation: TransformationConfig) => {
    setColumnMappings(
      columnMappings.map((mapping) => (mapping.targetField === targetField ? { ...mapping, transformation } : mapping)),
    )
  }

  // Apply transformations to a value
  const transformValue = (value: string, transformation: TransformationConfig): string => {
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
  const getTransformedValue = (rowIndex: number, mapping: ColumnMapping): string => {
    if (!displayData || selectedHeaderRow === null || mapping.sourceIndex === null) return "-"

    const dataRows = displayData.rows.slice(selectedHeaderRow + 1)
    if (rowIndex >= dataRows.length) return "-"

    const originalValue = dataRows[rowIndex][mapping.sourceIndex]
    return transformValue(originalValue, mapping.transformation)
  }

  // Save current transformation configuration as a template
  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) return

    const newTemplate: TransformationTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription,
      dateCreated: new Date().toISOString().split("T")[0],
      mappings: [...columnMappings],
    }

    setSavedTemplates([...savedTemplates, newTemplate])
    setSaveTemplateDialogOpen(false)
    setNewTemplateName("")
    setNewTemplateDescription("")
  }

  // Apply a saved template to current mappings
  const applyTemplate = useCallback((templateId: string) => {
    const template = savedTemplates.find((t) => t.id === templateId)
    if (!template) return

    setColumnMappings(prevMappings =>
      prevMappings.map(currentMapping => {
        const templateMapping = template.mappings.find(m => m.targetField === currentMapping.targetField)
        return templateMapping ? {
          ...currentMapping,
          transformation: templateMapping.transformation,
        } : currentMapping
      })
    )
  }, [savedTemplates])

  // Delete a saved template
  const deleteTemplate = (templateId: string) => {
    setSavedTemplates(savedTemplates.filter((t) => t.id !== templateId))
  }

  // Dummy validation (original mock)
  const validateDataDummy = () => {
    if (!displayData || selectedHeaderRow === null) return

    const issues: ValidationIssue[] = []
    const dataRows = displayData.rows
      .slice(selectedHeaderRow + 1)
      .filter(row => row.some(cell => cell && cell.trim() !== ""));

    // Simulate validation progress
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 10
      setValidationProgress(progress)
      if (progress >= 100) {
        clearInterval(progressInterval)
      }
    }, 200)

    // Generate some mock validation issues
    columnMappings.forEach((mapping) => {
      if (mapping.sourceIndex === null && mapping.required) {
        issues.push({
          row: 0,
          column: mapping.targetField,
          message: `Required column "${mapping.targetField}" is not mapped`,
          severity: "error",
        })
      }
    })

    // Dummy team validation (random row)
    const teamMapping = columnMappings.find((m) => m.targetField === "team")
    if (teamMapping && teamMapping.sourceIndex !== null) {
      const randomRow = Math.floor(Math.random() * dataRows.length)
      issues.push({
        row: randomRow + selectedHeaderRow + 2,
        column: "team",
        message: "Team name should be standardized",
        severity: "warning",
      })
    }

    // Age validation (keep as is)
    const ageMapping = columnMappings.find((m) => m.targetField === "age")
    if (ageMapping && ageMapping.sourceIndex !== null) {
      const randomRow = Math.floor(Math.random() * dataRows.length)
      const ageValue = dataRows[randomRow][ageMapping.sourceIndex]
      const transformedAge = transformValue(ageValue, ageMapping.transformation)

      if (isNaN(Number(transformedAge))) {
        issues.push({
          row: randomRow + selectedHeaderRow + 2,
          column: "age",
          message: `Invalid age value: "${transformedAge}"`,
          severity: "error",
        })
      }
    }

    setTimeout(() => {
      setValidationIssues(issues)
    }, 2000)
  }

  // Real validation
  const validateDataReal = useCallback(() => {
    if (!displayData || selectedHeaderRow === null) return

    const issues: ValidationIssue[] = []
    // Don't filter the rows yet - work with all rows to maintain correct indexing
    const dataRows = displayData.rows.slice(selectedHeaderRow + 1)

    // Use Set for faster lookups
    const allowedTeams = new Set(['alpha', 'beta', 'gamma'])

    const teamMapping = columnMappings.find((m) => m.targetField === "team") ?? {
      sourceIndex: null,
      targetField: "team",
      required: true,
      transformation: { type: "none" as const }
    }

    const ageMapping = columnMappings.find((m) => m.targetField === "age") ?? {
      sourceIndex: null,
      targetField: "age",
      required: true,
      transformation: { type: "none" as const }
    }

    const batchSize = 100
    let progress = 0

    const processRows = (startIdx: number) => {
      const endIdx = Math.min(startIdx + batchSize, dataRows.length)

      for (let i = startIdx; i < endIdx; i++) {
        const row = dataRows[i]
        // Calculate the actual row number by adding header row offset + 1 for UI display
        const rowNumber = i + selectedHeaderRow + 1

        // Only process non-empty rows
        if (!row.some(cell => cell?.trim())) continue

        // Team validation
        if (teamMapping.sourceIndex !== null) {
          const transformedValue = transformValue(row[teamMapping.sourceIndex], teamMapping.transformation)?.toLowerCase()
          if (transformedValue && !allowedTeams.has(transformedValue)) {
            issues.push({
              row: rowNumber,
              column: "team",
              message: `Team name "${transformedValue}" is not standardized`,
              severity: "warning"
            })
          }
        }

        // Age validation
        if (ageMapping.sourceIndex !== null) {
          const transformedAge = transformValue(row[ageMapping.sourceIndex], ageMapping.transformation)
          if (isNaN(Number(transformedAge))) {
            issues.push({
              row: rowNumber,
              column: "age",
              message: `Invalid age value: "${transformedAge}"`,
              severity: "error"
            })
          }
        }
      }

      progress = Math.min(100, Math.round((endIdx / dataRows.length) * 100))
      setValidationProgress(progress)

      if (endIdx < dataRows.length) {
        setTimeout(() => processRows(endIdx), 0)
      } else {
        setValidationIssues(issues)
      }
    }

    processRows(0)
  }, [displayData, selectedHeaderRow, columnMappings, transformValue])

  const validateData = () => {
    if (useRealValidation) {
      validateDataReal()
    } else {
      validateDataDummy()
    }
  }

  // --- New state for selection and editing ---
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [editedRows, setEditedRows] = useState<Record<number, Record<string, any>>>({})
  const [showOnlyIssues, setShowOnlyIssues] = useState(false)

  // --- Row selection handlers ---
  const handleRowSelect = useCallback((rowIndex: number, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, rowIndex] : prev.filter(idx => idx !== rowIndex)
    )
  }, [])
  const handleSelectAll = (selected: boolean, dataRows: string[][]) => {
    if (!displayData || selectedHeaderRow === null) return
    const allRowIndices = dataRows.map((_, i) => i + selectedHeaderRow + 1)
    setSelectedRows(selected ? allRowIndices : [])
  }

  // --- Filter rows with issues if needed ---
  const getFilteredDataRows = useCallback(() => {
    if (!displayData || selectedHeaderRow === null) return [];
    const allRows = displayData.rows.slice(selectedHeaderRow + 1);
    // The absolute row number for the first data row is selectedHeaderRow + 1 (0-based), +1 for 1-based
    const indexedRows = allRows.map((row, idx) => ({
      row,
      absoluteIndex: idx + selectedHeaderRow + 1,
    }));
    if (!showOnlyIssues) return indexedRows;
    const issueRows = new Set(validationIssues.map((i) => i.row));
    return indexedRows.filter(({ absoluteIndex }) => issueRows.has(absoluteIndex));
  }, [displayData, selectedHeaderRow, showOnlyIssues, validationIssues]);

  // --- Keep editedRows in sync with visible rows when toggling showOnlyIssues or entering edit mode ---
  useEffect(() => {
    if (!displayData || selectedHeaderRow === null) return
    if (Object.keys(editedRows).length > 0) {
      handleStartEditingAll()
    }
    // If all issues are fixed, turn off showOnlyIssues
    if (validationIssues.length === 0 && showOnlyIssues) {
      setShowOnlyIssues(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyIssues, Object.keys(editedRows).length, validationIssues.length])

  // --- Editing handlers ---
  const handleEditFieldChange = useCallback((rowIndex: number, field: string, value: any) => {
    setEditedRows(prev => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], [field]: value }
    }))
  }, [])
  const handleStartEditingAll = () => {
    const dataRows = getFilteredDataRows();
    const newEditedRows: Record<number, Record<string, string>> = {};
    dataRows.forEach(({ row, absoluteIndex }) => {
      const rowEdit: Record<string, string> = {};
      columnMappings.forEach((mapping) => {
        if (mapping.sourceIndex !== null) {
          let values: string[] = [];
          if (row[mapping.sourceIndex] !== undefined) {
            values.push(row[mapping.sourceIndex]);
          }
          if (mapping.additionalSources && mapping.additionalSources.length > 0) {
            mapping.additionalSources.forEach(source => {
              if (row[source.sourceIndex] !== undefined) {
                values.push(row[source.sourceIndex]);
              }
            });
          }
          rowEdit[mapping.targetField] = values.join(" ");
        }
      });
      newEditedRows[absoluteIndex] = rowEdit;
    });
    console.log("handleStartEditingAll: newEditedRows", newEditedRows);
    setEditedRows(newEditedRows);
  };
  const handleCancelEdit = () => setEditedRows({})
  const handleSaveEdit = () => {
    // For each edited row
    Object.entries(editedRows).forEach(([absoluteIndexStr, rowEdits]) => {
      const absoluteIndex = Number(absoluteIndexStr);
      // For each edited field in the row
      Object.entries(rowEdits).forEach(([field, value]) => {
        const mapping = columnMappings.find(m => m.targetField === field);
        if (mapping) {
          // Set the primary source to the edited value
          displayData.rows[absoluteIndex][mapping.sourceIndex] = value;
          // Set all additional sources to empty string
          if (mapping.additionalSources) {
            mapping.additionalSources.forEach(source => {
              displayData.rows[absoluteIndex][source.sourceIndex] = "";
            });
          }
        }
      });
    });

    // Revalidate after saving edits
    validateData(); // <-- Make sure this uses the latest data

    setEditedRows({});
  };

  // --- Delete selected rows ---
  const handleDeleteRows = () => {
    if (!displayData || selectedHeaderRow === null) return
    const keepRows = displayData.rows.filter(
      (_, idx) => !selectedRows.includes(idx)
    )
    setFileData({ ...displayData, rows: keepRows })
    setSelectedRows([])
  }

  // Only validate when fileData changes and not in edit mode
  useEffect(() => {
    if (Object.keys(editedRows).length === 0 && currentStep === 4 && fileData) {
      validateData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData])

  // Helper to get only mapped columns for import
  function getCleanedImportData() {
    if (!displayData || selectedHeaderRow === null) return [];
    const dataRows = displayData.rows.slice(selectedHeaderRow + 1);

    // Only keep columns that are mapped (sourceIndex !== null), in the order of expectedColumns
    return dataRows.map(row => {
      const cleanedRow: Record<string, string> = {};
      columnMappings.forEach(mapping => {
        if (mapping.sourceIndex !== null) {
          // --- Merge values from primary and additional sources ---
          let values: string[] = [];
          if (row[mapping.sourceIndex] !== undefined) {
            values.push(row[mapping.sourceIndex]);
          }
          if (mapping.additionalSources && mapping.additionalSources.length > 0) {
            mapping.additionalSources.forEach(source => {
              if (row[source.sourceIndex] !== undefined) {
                values.push(row[source.sourceIndex]);
              }
            });
          }
          cleanedRow[mapping.targetField] = values.join(" ");
        }
      });
      return cleanedRow;
    });
  }

  // --- New state for multi-select mapping ---
  const [multiSelectOpenFor, setMultiSelectOpenFor] = useState<string | null>(null)
  const [multiSelectSelected, setMultiSelectSelected] = useState<number[]>([])
  // Add additionalSources to each mapping (initialize if not present)
  useEffect(() => {
    setColumnMappings((prev) =>
      prev.map((m) =>
        m.additionalSources ? m : { ...m, additionalSources: [] }
      )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handler to open multi-select for a column
  const handleOpenMultiSelect = (targetField: string, mapping: ColumnMapping) => {
    setMultiSelectOpenFor(targetField)
    setMultiSelectSelected(mapping.additionalSources?.map(s => s.sourceIndex) || [])
  }

  // Handler to toggle selection in multi-select
  const handleToggleMultiSelect = (colIdx: number) => {
    setMultiSelectSelected((prev) =>
      prev.includes(colIdx) ? prev.filter(i => i !== colIdx) : [...prev, colIdx]
    )
  }

  // Handler to apply multi-select
  const handleApplyMultiSelect = (targetField: string, headerRow: string[]) => {
    setColumnMappings((prev) =>
      prev.map((m) =>
        m.targetField === targetField
          ? {
            ...m,
            additionalSources: multiSelectSelected
              .filter(idx => idx !== m.sourceIndex && idx >= 0)
              .map(idx => ({
                sourceIndex: idx,
                label: headerRow[idx] || `Column ${idx + 1}`,
              })),
          }
          : m
      )
    )
    setMultiSelectOpenFor(null)
  }

  // Handler to cancel multi-select
  const handleCancelMultiSelect = () => {
    setMultiSelectOpenFor(null)
  }

  // Handler to remove an additional source
  const handleRemoveAdditionalSource = (targetField: string, sourceIndex: number) => {
    setColumnMappings((prev) =>
      prev.map((m) =>
        m.targetField === targetField
          ? {
            ...m,
            additionalSources: (m.additionalSources || []).filter(s => s.sourceIndex !== sourceIndex),
          }
          : m
      )
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderUploadStep()
      case 2:
        return renderSelectHeaderStep()
      case 3:
        return renderMatchColumnsStep()
      case 4:
        return renderValidateDataStep()
      default:
        return renderUploadStep()
    }
  }

  const renderUploadStep = () => {
    return (
      <>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload file</h2>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-1">Data that we expect:</h3>
          <p className="text-sm text-gray-500 mb-4">
            (You will have a chance to rename or remove columns in next steps)
          </p>

          {/* Sample table */}
          <div className="overflow-x-auto mb-6 border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">NAME</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">SURNAME</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">AGE</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">TEAM</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">IS MANAGER</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-gray-600">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.surname}</td>
                    <td className="px-4 py-3 text-gray-600">{row.age}</td>
                    <td className="px-4 py-3 text-gray-600">{row.team}</td>
                    <td className="px-4 py-3 text-gray-600">{row.isManager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* File upload area */}
          <div
            className="border-2 border-dashed border-primary/20 rounded-lg p-8 flex flex-col items-center justify-center h-64 bg-primary/5 cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="h-10 w-10 text-primary mb-4" />
            <p className="text-gray-700 mb-6 text-center">Upload .xlsx, .xls or .csv file</p>
            <Button>Select file</Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
            />
          </div>
        </div>
      </>
    )
  }

  const renderSelectHeaderStep = () => {
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
                    Select the row that contains your column headers. This will be used to map your data in the next
                    step.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <RadioGroup
              value={selectedHeaderRow?.toString()}
              onValueChange={(value) => setSelectedHeaderRow(Number.parseInt(value))}
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
          <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={goToNextStep} className="flex items-center gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    )
  }

  const renderTransformationOptions = (mapping: ColumnMapping, expectedCol: any) => {
    const dataType = expectedCol?.dataType || "text"

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
            <h4 className="font-medium">Transform {expectedCol.label}</h4>

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
                      handleTransformationChange(mapping.targetField, { type: value as TransformationType })
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
                        handleTransformationChange(mapping.targetField, {
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
                        handleTransformationChange(mapping.targetField, {
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
                          handleTransformationChange(mapping.targetField, {
                            type: "custom",
                            options: { customFormula: "" },
                          })
                        } else {
                          handleTransformationChange(mapping.targetField, { type: "none" })
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
                          handleTransformationChange(mapping.targetField, {
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
                    <div className="border rounded p-1.5 bg-primary/5 border-primary/20">
                      {getTransformedValue(0, mapping)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const renderSaveTemplateDialog = () => {
    return (
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Transformation Template</DialogTitle>
            <DialogDescription>
              Save your current column mappings and transformations as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Standard Text Cleanup"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-description" className="text-right">
                Description
              </Label>
              <Input
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Trims whitespace and capitalizes names"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAsTemplate} disabled={!newTemplateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const renderTemplateCard = useMemo(() => (template: TransformationTemplate) => {
    // Count active transformations
    const activeTransformations = template.mappings.filter((m) => m.transformation.type !== "none").length

    return (
      <div key={template.id} className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <Bookmark className="h-4 w-4 text-primary mr-2" />
            <h4 className="font-medium">{template.name}</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => applyTemplate(template.id)}>
                <Check className="h-4 w-4 mr-2" /> Apply
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteTemplate(template.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-gray-500 mb-3">{template.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Badge variant="outline" className="bg-primary/5">
              <Wand2 className="h-3 w-3 mr-1" /> {activeTransformations} transformations
            </Badge>
          </div>
          <span className="text-xs text-gray-400">Created: {template.dateCreated}</span>
        </div>
      </div>
    )
  }, [applyTemplate, deleteTemplate])

  const renderMatchColumnsStep = () => {
    if (!displayData || selectedHeaderRow === null) return null

    const headerRow = displayData.rows[selectedHeaderRow]
    // Show all data rows, not just 3
    const dataPreviewRows = displayData.rows.slice(selectedHeaderRow + 1)

    // Count active transformations
    const activeTransformations = columnMappings.filter((m) => m.transformation.type !== "none").length

    return (
      <>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Match Columns</h2>
        <p className="text-gray-500 mb-6">Map the columns from your file to the expected fields</p>

        {/* Templates Section */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bookmark className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Transformation Templates</h3>
            </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">View Templates</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Saved Transformation Templates</DialogTitle>
                    <DialogDescription>
                      Apply a saved template to quickly set up your transformations.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 gap-4 py-4 max-h-[400px] overflow-y-auto">
                    {savedTemplates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BookmarkPlus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No templates saved yet.</p>
                        <p className="text-sm">Save your current transformations as a template to reuse them later.</p>
                      </div>
                    ) : (
                      savedTemplates.map((template) => renderTemplateCard(template))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setSaveTemplateDialogOpen(true)}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save Template</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {savedTemplates.slice(0, 3).map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-white"
                onClick={() => applyTemplate(template.id)}
              >
                <Bookmark className="h-3.5 w-3.5 text-primary" />
                {template.name}
              </Button>
            ))}

            {savedTemplates.length > 3 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white">
                    +{savedTemplates.length - 3} more
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>All Templates</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-4 max-h-[400px] overflow-y-auto">
                    {savedTemplates.map((template) => renderTemplateCard(template))}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {savedTemplates.length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No templates saved yet. Save your transformations to reuse them later.
              </div>
            )}
          </div>

          {activeTransformations > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wand2 className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">{activeTransformations}</span> active transformations
                  </span>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setSaveTemplateDialogOpen(true)}>
                  Save Current Setup
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Wand2 className="h-4 w-4 mr-2 text-primary" />
            <h3 className="text-lg font-medium text-gray-800">Data Transformations</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Apply transformations to clean and format your data before importing.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {expectedColumns.map((expectedCol) => {
              const mapping = columnMappings.find((m) => m.targetField === expectedCol.field)
              if (!mapping) return null

              return (
                <div key={expectedCol.field} className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <Label className="font-medium">
                      {expectedCol.label}
                      {expectedCol.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {mapping?.sourceIndex !== null && (
                      <Badge variant="outline" className="ml-2">
                        <Check className="h-3 w-3 mr-1" /> Mapped
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Select
                      value={mapping?.sourceIndex !== null ? mapping.sourceIndex.toString() : ""}
                      onValueChange={(value) =>
                        handleColumnMappingChange(expectedCol.field, value === "" ? null : Number.parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a column" />
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

                    {mapping.sourceIndex !== null && renderTransformationOptions(mapping, expectedCol)}

                    {/* --- Extra: Match Multiple Button --- */}
                    {mapping.sourceIndex !== null && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleOpenMultiSelect(expectedCol.field, mapping)}
                      >
                        Match Multiple
                      </Button>
                    )}
                  </div>

                  {/* --- Show additional sources as badges --- */}
                  {mapping.additionalSources && mapping.additionalSources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mapping.additionalSources.map((source) => (
                        <Badge key={source.sourceIndex} variant="secondary" className="flex items-center gap-1">
                          {source.label}
                          <button
                            className="ml-1 hover:text-red-500"
                            onClick={() => handleRemoveAdditionalSource(expectedCol.field, source.sourceIndex)}
                            type="button"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* --- Multi-select modal/panel --- */}
                  {multiSelectOpenFor === expectedCol.field && (
                    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Match Multiple Columns to {expectedCol.label}</h4>
                        <Button variant="ghost" size="sm" onClick={handleCancelMultiSelect}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-60 overflow-y-auto mb-4">
                        {headerRow.map((col, idx) => {
                          // Don't show the primary source
                          if (idx === mapping.sourceIndex) return null
                          return (
                            <div key={idx} className="flex items-center space-x-2 py-1.5 border-b last:border-0">
                              <Checkbox
                                id={`col-${expectedCol.field}-${idx}`}
                                checked={multiSelectSelected.includes(idx)}
                                onCheckedChange={() => handleToggleMultiSelect(idx)}
                              />
                              <Label htmlFor={`col-${expectedCol.field}-${idx}`} className="flex-1 cursor-pointer">
                                {col}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelMultiSelect}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApplyMultiSelect(expectedCol.field, headerRow)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Data Preview with Transformations</h3>
            {/* Make table scrollable and show all data */}
            <div className="border rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {expectedColumns.map((col) => (
                      <th key={col.field} className="px-4 py-3 text-left font-medium text-gray-700">
                        {col.label}
                        {columnMappings.find((m) => m.targetField === col.field)?.transformation.type !== "none" && (
                          <Badge variant="outline" className="ml-2 bg-primary/5 border-primary/20">
                            <Wand2 className="h-3 w-3 mr-1" />
                            Transformed
                          </Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreviewRows.map((row, rowIndex) => {
                    const absoluteIndex = rowIndex + selectedHeaderRow + 1
                    return (
                      <tr
                        key={absoluteIndex}
                        className={cn(
                          "border-b last:border-b-0",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        {expectedColumns.map((col, colIndex) => {
                          const mapping = columnMappings.find((m) => m.targetField === col.field)
                          if (!mapping)
                            return (
                              <td key={colIndex} className="px-4 py-3 text-gray-600">
                                -
                              </td>
                            )

                          // Check for edited value (even after saving)
                          const editedValue = editedRows[absoluteIndex]?.[col.field];
                          if (editedValue !== undefined && editedValue !== null && editedValue !== "") {
                            return (
                              <td key={colIndex} className="px-4 py-3 text-gray-600">
                                {editedValue}
                              </td>
                            );
                          }

                          // Only merge if no edited value
                          let values: string[] = [];
                          if (mapping.sourceIndex !== null && row[mapping.sourceIndex] !== undefined) {
                            values.push(row[mapping.sourceIndex]);
                          }
                          if (mapping.additionalSources && mapping.additionalSources.length > 0) {
                            mapping.additionalSources.forEach(source => {
                              if (row[source.sourceIndex] !== undefined) {
                                values.push(row[source.sourceIndex]);
                              }
                            });
                          }
                          const mergedValue = values.join(" ");
                          return (
                            <td key={colIndex} className="px-4 py-3 text-gray-600">
                              {mergedValue || "-"}
                            </td>
                          );
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {renderSaveTemplateDialog()}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={goToNextStep} className="flex items-center gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    )
  }

  const renderValidateDataStep = () => {
    if (!displayData || selectedHeaderRow === null) return null

    const dataRows = getFilteredDataRows()
    const allRowIndices = dataRows.map(({ absoluteIndex }) => absoluteIndex)
    const allSelected = allRowIndices.length > 0 && allRowIndices.every(idx => selectedRows.includes(idx))
    const hasErrors = validationIssues.some((issue) => issue.severity === "error")
    const hasWarnings = validationIssues.some((issue) => issue.severity === "warning")
    const hasAnyIssues = validationIssues.length > 0

    return (
      <>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Validate Data</h2>
        <div className="flex items-center mb-4 gap-4">
          <Switch
            id="validation-toggle"
            checked={useRealValidation}
            onCheckedChange={setUseRealValidation}
            className="mr-2"
          />
          <Label htmlFor="validation-toggle">
            {useRealValidation ? "Real Validation" : "Dummy Validation"}
          </Label>
          <Switch
            checked={showOnlyIssues}
            onCheckedChange={setShowOnlyIssues}
            id="show-only-issues"
            className="ml-4"
            disabled={!hasAnyIssues}
          />
          <Label htmlFor="show-only-issues" className={!hasAnyIssues ? "text-gray-400" : ""}>
            Show only rows with issues
          </Label>
          <Button
            variant="destructive"
            disabled={selectedRows.length === 0}
            onClick={handleDeleteRows}
            className="ml-4"
          >
            Delete Selected Rows
          </Button>
          {Object.keys(editedRows).length === 0 ? (
            <Button onClick={handleStartEditingAll} className="ml-2">
              Edit All
            </Button>
          ) : (
            <>
              <Button variant="default" onClick={handleSaveEdit} className="ml-2">
                Save All Edits
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} className="ml-2">
                Cancel Edits
              </Button>
            </>
          )}
        </div>
        <p className="text-gray-500 mb-6">Review any issues with your data before importing</p>

        {validationProgress < 100 ? (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Validating your data...</h3>
            <Progress value={validationProgress} className="mb-2" />
            <p className="text-sm text-gray-500">{validationProgress}% complete</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Validation Results</h3>
              {validationIssues.length === 0 ? (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    No issues found with your data. You're ready to import!
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className={hasErrors ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}>
                    {hasErrors ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Info className="h-4 w-4 text-yellow-600" />
                    )}
                    <AlertTitle className={hasErrors ? "text-red-800" : "text-yellow-800"}>
                      {hasErrors ? "Validation Failed" : "Validation Warnings"}
                    </AlertTitle>
                    <AlertDescription className={hasErrors ? "text-red-700" : "text-yellow-700"}>
                      {hasErrors
                        ? "There are errors that need to be fixed before importing."
                        : "There are warnings you may want to review before importing."}
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 w-10">
                            {/* Empty for alignment */}
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Row</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Column</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Issue</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationIssues.map((issue, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td />
                            <td className="px-4 py-3 text-gray-600">{issue.row === 0 ? "N/A" : issue.row}</td>
                            <td className="px-4 py-3 text-gray-600">{issue.column}</td>
                            <td className="px-4 py-3 text-gray-600">{issue.message}</td>
                            <td className="px-4 py-3">
                              <Badge variant={issue.severity === "error" ? "destructive" : "outline"}>
                                {issue.severity}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Data Table (Editable)</h3>
              <div className="border rounded-lg overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => handleSelectAll(!!checked, dataRows.map(({ row }) => row))}
                          aria-label="Select all rows"
                        />
                      </th>
                      {expectedColumns.map((col, colIndex) => (
                        <th key={col.field} className="px-4 py-3 text-left font-medium text-gray-700">
                          {col.label}
                          {col.field === "isManager" && <span className="ml-2 text-xs text-gray-500">(toggle)</span>}
                        </th>
                      ))}
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map(({ row, absoluteIndex }, i) => {
                      const isSelected = selectedRows.includes(absoluteIndex)
                      const isEditing = editedRows[absoluteIndex] !== undefined
                      const rowIssues = validationIssues.filter((issue) => issue.row === absoluteIndex)
                      const hasError = rowIssues.some((issue) => issue.severity === "error")
                      const hasWarning = rowIssues.some((issue) => issue.severity === "warning")

                      return (
                        <tr
                          key={absoluteIndex}
                          className={cn(
                            "border-b last:border-b-0",
                            isSelected ? "bg-primary/5" : hasError ? "bg-red-50" : hasWarning ? "bg-yellow-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"
                          )}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleRowSelect(absoluteIndex, !!checked)}
                              aria-label={`Select row ${i + 1}`}
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
                            const cellIssue = rowIssues.find(
                              (issue) => issue.row === absoluteIndex && issue.column === col.field,
                            );
                            const isEditing = editedRows[absoluteIndex] !== undefined;
                            const cellValue = isEditing ? editedRows[absoluteIndex][col.field] ?? "" : undefined;

                            if (isEditing) {
                              const cellValue = editedRows[absoluteIndex][col.field] ?? "";
                              // console.log(`Rendering (editing) row ${absoluteIndex}, col ${col.field}:`, cellValue);
                              if (isBooleanLike(cellValue)) {
                                return (
                                  <td key={colIndex} className="px-4 py-3">
                                    <Switch
                                      checked={cellValue === true || cellValue === "true" || cellValue === 1 || cellValue === "1"}
                                      onCheckedChange={(checked) =>
                                        handleEditFieldChange(absoluteIndex, col.field, checked ? "true" : "false")
                                      }
                                    />
                                  </td>
                                )
                              }
                              return (
                                <td key={colIndex} className="px-4 py-3">
                                  <Input
                                    value={cellValue}
                                    onChange={(e) =>
                                      handleEditFieldChange(absoluteIndex, col.field, e.target.value)
                                    }
                                    className="h-8 text-sm"
                                  />
                                </td>
                              )
                            }
                            // Not editing: merge
                            let values: string[] = []
                            if (mapping.sourceIndex !== null && row[mapping.sourceIndex] !== undefined) {
                              values.push(row[mapping.sourceIndex])
                            }
                            if (mapping.additionalSources && mapping.additionalSources.length > 0) {
                              mapping.additionalSources.forEach(source => {
                                if (row[source.sourceIndex] !== undefined) {
                                  values.push(row[source.sourceIndex])
                                }
                              })
                            }
                            const mergedValue = values.join(" ")
                            // console.log(`Rendering (not editing) row ${absoluteIndex}, col ${col.field}:`, mergedValue, values);
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
                                {mergedValue || "-"}
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
                            {/* No per-row edit, since we edit all at once */}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={goToNextStep} className="flex items-center gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    )
  }

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-md">
      <CardContent className="p-0">
        {/* Steps indicator */}
        <div className="bg-gray-50 p-6 rounded-t-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                    step.isCompleted
                      ? "bg-green-500 text-white"
                      : step.isActive
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500",
                  )}
                >
                  {step.number}
                </div>
                <span
                  className={cn(
                    "text-sm md:text-base",
                    step.isActive ? "text-gray-900 font-medium" : step.isCompleted ? "text-green-700" : "text-gray-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{renderStepContent()}</div>
      </CardContent>
    </Card>
  )
}

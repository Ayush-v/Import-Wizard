"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Info, Check, AlertCircle, ArrowDown, Wand2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ColumnMappingSection } from "./column-mapping-section"
import { DataValidationTable } from "./data-validation-table"
import { UploadStep } from "./upload-step"
import { HeaderRowStep } from "./header-row-step"
import { TemplateSection } from "./template-section"
import type { FileData, ColumnMapping, ValidationIssue, TransformationTemplate, ExpectedColumn, Step } from "./types"

export interface FileImportWizardProps {
  expectedColumns: ExpectedColumn[]
  onImportComplete?: (data: any[]) => void
}

export default function FileImportWizard({ expectedColumns, onImportComplete }: FileImportWizardProps) {
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
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editedData, setEditedData] = useState<Record<string, any>>({})

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
          additionalSources: [],
        },
        {
          sourceIndex: 1,
          targetField: "surname",
          required: true,
          transformation: { type: "capitalize" },
          additionalSources: [],
        },
        {
          sourceIndex: 2,
          targetField: "age",
          required: true,
          transformation: { type: "number", options: { decimalPlaces: 0 } },
          additionalSources: [],
        },
        {
          sourceIndex: 3,
          targetField: "team",
          required: true,
          transformation: { type: "trim" },
          additionalSources: [
            { sourceIndex: 4, label: "department" },
            { sourceIndex: 5, label: "group" },
          ],
        },
        {
          sourceIndex: 6,
          targetField: "isManager",
          required: false,
          transformation: {
            type: "boolean",
            options: {
              trueValues: ["true", "yes", "1", "y"],
              falseValues: ["false", "no", "0", "n"],
            },
          },
          additionalSources: [],
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

  // Sample data for the first step
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
        ["NAME", "SURNAME", "AGE", "TEAM", "DEPARTMENT", "GROUP", "IS_MANAGER", "FIRST_NAME", "LAST_NAME"],
        ["John", "Doe", "30", "Team A", "Sales", "Group 1", "false", "John", "Doe"],
        ["Jane", "Smith", "28", "Team B", "Marketing", "Group 2", "true", "Jane", "Smith"],
        ["Michael", "Johnson", "35", "Team A", "Sales", "Group 1", "false", "Michael", "Johnson"],
        ["Emily", "Williams", "32", "Team C", "Engineering", "Group 3", "true", "Emily", "Williams"],
        ["Robert ", " Brown", "27", "team b", "Marketing", "Group 2", "FALSE", "Robert", "Brown"],
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
        additionalSources: [],
      })),
    )
  }, [expectedColumns])

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
        // Find exact match first
        const matchIndex = headerRow.findIndex(
          (header) => header.toLowerCase().trim() === mapping.targetField.toLowerCase(),
        )

        // If no exact match, look for partial matches
        if (matchIndex === -1) {
          // Look for columns that might be related (e.g., "first_name" for "name")
          const relatedColumns = []

          if (mapping.targetField.toLowerCase() === "name") {
            const firstNameIndex = headerRow.findIndex(
              (header) => header.toLowerCase().includes("first") || header.toLowerCase().includes("fname"),
            )
            if (firstNameIndex !== -1) {
              relatedColumns.push({ sourceIndex: firstNameIndex, label: headerRow[firstNameIndex] })
            }
          }

          if (mapping.targetField.toLowerCase() === "surname") {
            const lastNameIndex = headerRow.findIndex(
              (header) => header.toLowerCase().includes("last") || header.toLowerCase().includes("lname"),
            )
            if (lastNameIndex !== -1) {
              relatedColumns.push({ sourceIndex: lastNameIndex, label: headerRow[lastNameIndex] })
            }
          }

          if (mapping.targetField.toLowerCase() === "team") {
            const departmentIndex = headerRow.findIndex((header) => header.toLowerCase().includes("department"))
            const groupIndex = headerRow.findIndex((header) => header.toLowerCase().includes("group"))

            if (departmentIndex !== -1) {
              relatedColumns.push({ sourceIndex: departmentIndex, label: headerRow[departmentIndex] })
            }
            if (groupIndex !== -1) {
              relatedColumns.push({ sourceIndex: groupIndex, label: headerRow[groupIndex] })
            }
          }

          return {
            ...mapping,
            sourceIndex: matchIndex !== -1 ? matchIndex : mapping.sourceIndex,
            additionalSources: relatedColumns,
          }
        }

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
  }, [selectedHeaderRow, displayData, expectedColumns]) // Remove columnMappings from dependencies

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

  const handleFileUpload = async (file: File) => {
    try {
      // Parse the file
      const parsedData = await parseFile(file)
      setFileData(parsedData)

      // Auto-select the first row as header by default
      if (parsedData.rows.length > 0) {
        setSelectedHeaderRow(0)
      }

      // Move to next step
      setCurrentStep(2)
    } catch (error) {
      console.error("Error parsing file:", error)
      // Handle error state here
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

  const handleAdditionalSourceAdd = (targetField: string, sourceIndex: number, label: string) => {
    setColumnMappings(
      columnMappings.map((mapping) => {
        if (mapping.targetField === targetField) {
          // Check if this source is already added
          const exists = mapping.additionalSources.some((source) => source.sourceIndex === sourceIndex)
          if (exists) return mapping

          return {
            ...mapping,
            additionalSources: [...mapping.additionalSources, { sourceIndex, label }],
          }
        }
        return mapping
      }),
    )
  }

  const handleAdditionalSourceRemove = (targetField: string, sourceIndex: number) => {
    setColumnMappings(
      columnMappings.map((mapping) => {
        if (mapping.targetField === targetField) {
          return {
            ...mapping,
            additionalSources: mapping.additionalSources.filter((source) => source.sourceIndex !== sourceIndex),
          }
        }
        return mapping
      }),
    )
  }

  const handleTransformationChange = (targetField: string, transformation: any) => {
    setColumnMappings(
      columnMappings.map((mapping) => (mapping.targetField === targetField ? { ...mapping, transformation } : mapping)),
    )
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
  const applyTemplate = (templateId: string) => {
    const template = savedTemplates.find((t) => t.id === templateId)
    if (!template) return

    // Apply the template mappings while preserving the current sourceIndex values
    const newMappings = columnMappings.map((currentMapping) => {
      const templateMapping = template.mappings.find((m) => m.targetField === currentMapping.targetField)

      if (templateMapping) {
        return {
          ...currentMapping,
          transformation: templateMapping.transformation,
          additionalSources: templateMapping.additionalSources || [],
        }
      }

      return currentMapping
    })

    setColumnMappings(newMappings)
  }

  // Delete a saved template
  const deleteTemplate = (templateId: string) => {
    setSavedTemplates(savedTemplates.filter((t) => t.id !== templateId))
  }

  // Handle row selection in validation step
  const handleRowSelection = (rowIndex: number, selected: boolean) => {
    if (selected) {
      setSelectedRows([...selectedRows, rowIndex])
    } else {
      setSelectedRows(selectedRows.filter((idx) => idx !== rowIndex))
    }
  }

  // Handle select all rows
  const handleSelectAllRows = (selected: boolean) => {
    if (!displayData || selectedHeaderRow === null) return

    if (selected) {
      const allRowIndices = Array.from(
        { length: displayData.rows.length - selectedHeaderRow - 1 },
        (_, i) => i + selectedHeaderRow + 1,
      )
      setSelectedRows(allRowIndices)
    } else {
      setSelectedRows([])
    }
  }

  // Discard selected rows
  const discardSelectedRows = () => {
    if (!displayData || selectedHeaderRow === null) return

    const newRows = displayData.rows.filter((_, index) => !selectedRows.includes(index))
    setFileData({
      ...displayData,
      rows: newRows,
    })
    setSelectedRows([])

    // Re-run validation
    validateData()
  }

  // Start editing a row
  const startEditingRow = (rowIndex: number) => {
    if (!displayData || selectedHeaderRow === null) return

    const row = displayData.rows[rowIndex]
    const rowData: Record<string, any> = {}

    columnMappings.forEach((mapping) => {
      if (mapping.sourceIndex !== null) {
        rowData[mapping.targetField] = row[mapping.sourceIndex]
      }
    })

    setEditingRow(rowIndex)
    setEditedData(rowData)
  }

  // Save edited row
  const saveEditedRow = () => {
    if (!displayData || selectedHeaderRow === null || editingRow === null) return

    const newRows = [...displayData.rows]
    const row = [...newRows[editingRow]]

    columnMappings.forEach((mapping) => {
      if (mapping.sourceIndex !== null && editedData[mapping.targetField] !== undefined) {
        row[mapping.sourceIndex] = editedData[mapping.targetField]
      }
    })

    newRows[editingRow] = row

    setFileData({
      ...displayData,
      rows: newRows,
    })

    setEditingRow(null)
    setEditedData({})

    // Re-run validation
    validateData()
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingRow(null)
    setEditedData({})
  }

  // Handle edit field change
  const handleEditFieldChange = (field: string, value: string) => {
    setEditedData({
      ...editedData,
      [field]: value,
    })
  }

  // Mock validation function
  const validateData = () => {
    if (!displayData || selectedHeaderRow === null) return

    const issues: ValidationIssue[] = []
    const dataRows = displayData.rows.slice(selectedHeaderRow + 1)

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

    // Add some random validation issues for demonstration
    if (dataRows.length > 0) {
      // Age validation
      const ageMapping = columnMappings.find((m) => m.targetField === "age")
      if (ageMapping && ageMapping.sourceIndex !== null) {
        const randomRow = Math.floor(Math.random() * dataRows.length)
        const ageValue = dataRows[randomRow][ageMapping.sourceIndex]

        if (isNaN(Number(ageValue))) {
          issues.push({
            row: randomRow + selectedHeaderRow + 2,
            column: "age",
            message: `Invalid age value: "${ageValue}"`,
            severity: "error",
          })
        }
      }

      // Team validation
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
    }

    setTimeout(() => {
      setValidationIssues(issues)
    }, 2000)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep sampleData={sampleData} expectedColumns={expectedColumns} onFileUpload={handleFileUpload} />
      case 2:
        return (
          <HeaderRowStep
            displayData={displayData}
            selectedHeaderRow={selectedHeaderRow}
            onHeaderRowSelect={setSelectedHeaderRow}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        )
      case 3:
        return renderMatchColumnsStep()
      case 4:
        return renderValidateDataStep()
      default:
        return <UploadStep sampleData={sampleData} expectedColumns={expectedColumns} onFileUpload={handleFileUpload} />
    }
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

  const renderMatchColumnsStep = () => {
    if (!displayData || selectedHeaderRow === null) return null

    const headerRow = displayData.rows[selectedHeaderRow]
    const dataPreviewRows = displayData.rows.slice(selectedHeaderRow + 1, selectedHeaderRow + 4)

    // Count active transformations
    const activeTransformations = columnMappings.filter((m) => m.transformation.type !== "none").length

    return (
      <>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Match Columns</h2>
        <p className="text-gray-500 mb-6">
          Map the columns from your file to the expected fields. You can map multiple source columns to a single target
          field.
        </p>

        {/* Templates Section */}
        <TemplateSection
          savedTemplates={savedTemplates}
          activeTransformations={activeTransformations}
          onApplyTemplate={applyTemplate}
          onDeleteTemplate={deleteTemplate}
          onSaveTemplate={() => setSaveTemplateDialogOpen(true)}
        />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-800">Will become</h3>
            </div>
          </div>

          <div className="space-y-6">
            {expectedColumns.map((expectedCol) => {
              const mapping = columnMappings.find((m) => m.targetField === expectedCol.field)
              if (!mapping) return null

              return (
                <ColumnMappingSection
                  key={expectedCol.field}
                  expectedColumn={expectedCol}
                  mapping={mapping}
                  headerRow={headerRow}
                  displayData={displayData}
                  selectedHeaderRow={selectedHeaderRow}
                  onMappingChange={handleColumnMappingChange}
                  onTransformationChange={handleTransformationChange}
                  onAdditionalSourceAdd={handleAdditionalSourceAdd}
                  onAdditionalSourceRemove={handleAdditionalSourceRemove}
                />
              )
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Data Preview with Transformations</h3>
            <div className="border rounded-lg overflow-x-auto">
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
                        {columnMappings.find((m) => m.targetField === col.field)?.additionalSources.length > 0 && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 border-blue-200 text-blue-700">
                            Multiple sources
                          </Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreviewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {expectedColumns.map((col, colIndex) => {
                        const mapping = columnMappings.find((m) => m.targetField === col.field)
                        if (!mapping)
                          return (
                            <td key={colIndex} className="px-4 py-3 text-gray-600 border-b">
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

                        return (
                          <td key={colIndex} className="px-4 py-3 text-gray-600 border-b">
                            {value}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
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
          <Button
            onClick={goToNextStep}
            className="flex items-center gap-2"
            disabled={columnMappings.some((m) => m.required && m.sourceIndex === null)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    )
  }

  const renderValidateDataStep = () => {
    if (!displayData || selectedHeaderRow === null) return null

    const dataRows = displayData.rows.slice(selectedHeaderRow + 1)
    const hasErrors = validationIssues.some((issue) => issue.severity === "error")
    const hasWarnings = validationIssues.some((issue) => issue.severity === "warning")

    // Filter rows if showing only errors
    const filteredRows = showOnlyErrors
      ? dataRows.filter((_, rowIndex) =>
        validationIssues.some((issue) => issue.row === rowIndex + selectedHeaderRow + 2),
      )
      : dataRows

    return (
      <>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Validate Data</h2>
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
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Row</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Column</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Issue</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationIssues.map((issue, index) => (
                          <tr key={index} className="border-b last:border-b-0">
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">Data Preview</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={discardSelectedRows}
                    disabled={selectedRows.length === 0}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard selected rows
                  </Button>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="show-errors-only" className="text-sm">
                      Show only rows with errors
                    </Label>
                    <Switch id="show-errors-only" checked={showOnlyErrors} onCheckedChange={setShowOnlyErrors} />
                  </div>
                </div>
              </div>

              <DataValidationTable
                expectedColumns={expectedColumns}
                columnMappings={columnMappings}
                dataRows={filteredRows}
                validationIssues={validationIssues}
                selectedHeaderRow={selectedHeaderRow}
                selectedRows={selectedRows}
                editingRow={editingRow}
                editedData={editedData}
                onRowSelect={handleRowSelection}
                onSelectAll={handleSelectAllRows}
                onStartEditing={startEditingRow}
                onSaveEdit={saveEditedRow}
                onCancelEdit={cancelEditing}
                onEditFieldChange={handleEditFieldChange}
              />
            </div>
          </>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            className="flex items-center gap-2"
            disabled={validationProgress < 100 || hasErrors}
            onClick={() => onImportComplete && onImportComplete([])}
          >
            Import Data <ArrowDown className="h-4 w-4" />
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

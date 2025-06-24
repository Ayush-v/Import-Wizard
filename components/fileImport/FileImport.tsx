import { cn } from "@/lib/utils";
import { Check, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useSteps } from "./hooks/useSteps";
import { useUpload } from "./hooks/useUpload";
import MatchColumnsStep from "./steps/MatchColumnsStep";
import SelectHeaderStep from "./steps/SelectHeaderStep";
import UploadStep from "./steps/UploadStep";
import { ColumnMapping, ExpectedColumn, FileData, TransformationConfig } from "./types";

export default function FileImport({
    expectedColumns,
}: {
    expectedColumns: ExpectedColumn[];
}) {
    const {
        steps,
        currentStep,
        goToNextStep,
        goToPreviousStep,
    } = useSteps([
        { number: 1, label: "Upload file" },
        { number: 2, label: "Select header row" },
        { number: 3, label: "Match Columns" },
        { number: 4, label: "Validate data" },
    ])
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [selectedHeaderRow, setSelectedHeaderRow] = useState<number | null>(0)
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
    const { handleUpload: handleUploadFromHook } = useUpload(setFileData)
    const [originalRows, setOriginalRows] = useState<string[][]>([])

    const handleUpload = async (file: File) => {
        const uploaded = await handleUploadFromHook(file)
        setOriginalRows(uploaded.rows)
        const header = uploaded.rows[0]

        const initialMappings: ColumnMapping[] = expectedColumns.map((col) => {
            const idx = header.findIndex((h) => h.toLowerCase().trim() === col.field.toLowerCase())
            return {
                sourceIndex: idx !== -1 ? idx : null,
                targetField: col.field,
                required: col.required,
                transformation: { type: "none" },
            }
        })

        setColumnMappings(initialMappings)
        goToNextStep()
    }

    const handleColumnMappingChange = (field: string, index: number | null) => {
        setColumnMappings((prev) =>
            prev.map((m) => (m.targetField === field ? { ...m, sourceIndex: index } : m)),
        )
    }

    const handleTransformationChange = (field: string, transformation: TransformationConfig) => {
        setColumnMappings((prev) =>
            prev.map((m) => (m.targetField === field ? { ...m, transformation } : m))
        )

        setFileData((prev) => {
            if (!prev) return prev

            const mapping = columnMappings.find((m) => m.targetField === field)
            if (!mapping || mapping.sourceIndex === null) return prev

            const newRows = originalRows.map((row, idx) => {
                if (idx === 0) return row // keep header
                const val = row[mapping.sourceIndex!]
                const transformed = transformValue(val, transformation)
                const updated = [...row]
                updated[mapping.sourceIndex!] = transformed
                return updated
            })

            return {
                ...prev,
                rows: newRows,
            }
        })
    }

    console.log({ columnMappings, fileData })

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <UploadStep expectedColumns={expectedColumns} onFileUpload={handleUpload} />
            case 2:
                if (!fileData) return null
                return (
                    <SelectHeaderStep
                        fileName={fileData.fileName}
                        rows={fileData.rows}
                        selectedHeaderRow={selectedHeaderRow}
                        onSelectRow={setSelectedHeaderRow}
                        onBack={goToPreviousStep}
                        onNext={goToNextStep}
                    />
                )
            case 3:
                if (!fileData || selectedHeaderRow === null) return null;
                return (
                    <MatchColumnsStep
                        headerRow={fileData.rows[selectedHeaderRow]}
                        mappings={columnMappings}
                        expectedColumns={expectedColumns}
                        onMappingChange={handleColumnMappingChange}
                        onTransformationChange={handleTransformationChange}
                        onBack={goToPreviousStep}
                        onNext={goToNextStep}
                        data={fileData.rows.slice(1)}
                        setFileData={setFileData}
                    />
                );
            default:
                return <div>
                    <h3>step {currentStep}</h3>
                    <p>something went wrong!</p>
                    <p>go back to previous step</p>
                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2">
                            <ChevronLeft className="h-4 w-4" /> Back
                        </Button>
                    </div>
                </div>
        }
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
                                    {step.isCompleted ? <Check size={16} strokeWidth={3.5} /> : step.number}
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



function transformValue(value: string, transformation: TransformationConfig): string {
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
                const format = transformation.options?.dateFormat
                return format
                    ? date.toLocaleDateString(undefined, { dateStyle: format as any })
                    : date.toLocaleDateString()
            } catch {
                return value
            }
        case "custom":
            return `${value} (custom)` // Extend as needed
        default:
            return value
    }
}
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Bookmark, Check, ChevronLeft, ChevronRight, Save, Wand2, X } from "lucide-react"
import { useState } from "react"
import { VirtualizedTable } from "../_components/VirtualizedTable"
import { ColumnMapping, FileData, TransformationConfig, TransformationType } from "../types"

type Props = {
    headerRow: string[]
    mappings: ColumnMapping[]
    expectedColumns: { field: string; label: string; required: boolean }[]
    onMappingChange: (field: string, index: number | null) => void
    onTransformationChange: (field: string, tx: TransformationConfig) => void
    onBack: () => void
    onNext: () => void
    data: string[][]
    setFileData: React.Dispatch<React.SetStateAction<FileData | null>>
}

export default function MatchColumnsStep({
    headerRow,
    mappings,
    expectedColumns,
    onMappingChange,
    onTransformationChange,
    onBack,
    onNext,
    data,
    setFileData,
}: Props) {
    const [multiSelectOpenFor, setMultiSelectOpenFor] = useState<string | null>(null)
    const [multiSelectSelected, setMultiSelectSelected] = useState<number[]>([])
    const [savedTemplates, setSavedTemplates] = useState<any[]>([])
    const [editedRows, setEditedRows] = useState<Record<number, Record<string, string>>>({})
    const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)

    const activeTransformations = mappings.filter((m) => m.transformation.type !== "none").length

    const handleOpenMultiSelect = (field: string, mapping: ColumnMapping) => {
        setMultiSelectOpenFor(field)
        setMultiSelectSelected(mapping.additionalSources?.map((s) => s.sourceIndex) || [])
    }

    const handleToggleMultiSelect = (idx: number) => {
        setMultiSelectSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]))
    }

    const handleApplyMultiSelect = (field: string, headerRow: string[]) => {
        // Save additional sources
        const primary = multiSelectSelected[0] ?? null
        const additional = multiSelectSelected.slice(1).map((idx) => ({
            sourceIndex: idx,
            label: headerRow[idx],
        }))
        onMappingChange(field, primary)
        const mapping = mappings.find((m) => m.targetField === field)
        if (mapping) mapping.additionalSources = additional
        setMultiSelectOpenFor(null)
    }

    const handleCancelMultiSelect = () => setMultiSelectOpenFor(null)

    const handleRemoveAdditionalSource = (field: string, index: number) => {
        const mapping = mappings.find((m) => m.targetField === field)
        if (!mapping || !mapping.additionalSources) return
        mapping.additionalSources = mapping.additionalSources.filter((s) => s.sourceIndex !== index)
    }

    const applyTemplate = (templateId: string) => {
        console.log(`Apply template ${templateId}`)
        // TODO: Apply template logic
    }

    const renderTemplateCard = (template: any) => (
        <div key={template.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <h4 className="font-medium text-sm">{template.name}</h4>
        </div>
    )

    const dataPreviewRows = data.slice(1)

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
                    <Button variant="default" size="sm" className="flex items-center gap-1" onClick={() => setSaveTemplateDialogOpen(true)}>
                        <Save className="h-4 w-4" /> Save Template
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {savedTemplates.slice(0, 3).map((template) => (
                        <Button key={template.id} variant="outline" size="sm" className="flex items-center gap-1 bg-white" onClick={() => applyTemplate(template.id)}>
                            <Bookmark className="h-3.5 w-3.5 text-primary" /> {template.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Column Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {expectedColumns.map((expectedCol) => {
                    const mapping = mappings.find((m) => m.targetField === expectedCol.field)
                    if (!mapping) return null

                    return (
                        <div key={expectedCol.field} className="flex flex-col space-y-2">
                            <div className="flex items-center">
                                <Label className="font-medium">{expectedCol.label}{expectedCol.required && <span className="text-red-500 ml-1">*</span>}</Label>
                                {mapping.sourceIndex !== null && <Badge variant="outline" className="ml-2"><Check className="h-3 w-3 mr-1" /> Mapped</Badge>}
                            </div>
                            <div className="flex items-center">
                                <Select value={mapping.sourceIndex !== null ? mapping.sourceIndex.toString() : ""} onValueChange={(value) => onMappingChange(expectedCol.field, value === "" ? null : Number(value))}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select a column" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="-1">Not mapped</SelectItem>
                                        {headerRow.map((header, index) => (<SelectItem key={index} value={index.toString()}>{header} (Column {index + 1})</SelectItem>))}
                                    </SelectContent>
                                </Select>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className={cn("ml-2", mapping.transformation.type !== "none" && "bg-primary/10 border-primary/20")}>
                                            <Wand2 className="h-3.5 w-3.5 mr-1" /> Transform
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4">
                                        <h4 className="font-medium mb-2">Transformation</h4>
                                        <Select value={mapping.transformation.type} onValueChange={(value) => onTransformationChange(expectedCol.field, { type: value as TransformationType })}>
                                            <SelectTrigger><SelectValue placeholder="Select transformation" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="trim">Trim</SelectItem>
                                                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                                                <SelectItem value="lowercase">lowercase</SelectItem>
                                                <SelectItem value="capitalize">Capitalize</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="boolean">Boolean</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </PopoverContent>
                                </Popover>

                                {mapping.sourceIndex !== null && (
                                    <Button variant="outline" size="sm" className="ml-2" onClick={() => handleOpenMultiSelect(expectedCol.field, mapping)}>Match Multiple</Button>
                                )}
                            </div>

                            {multiSelectOpenFor === expectedCol.field && (
                                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium">Match Multiple Columns to {expectedCol.label}</h4>
                                        <Button variant="ghost" size="sm" onClick={handleCancelMultiSelect}><X className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto mb-4">
                                        {headerRow.map((col, idx) => idx !== mapping.sourceIndex && (
                                            <div key={idx} className="flex items-center space-x-2 py-1.5 border-b last:border-0">
                                                <Checkbox checked={multiSelectSelected.includes(idx)} onCheckedChange={() => handleToggleMultiSelect(idx)} />
                                                <Label className="flex-1 cursor-pointer">{col}</Label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={handleCancelMultiSelect}>Cancel</Button>
                                        <Button size="sm" onClick={() => handleApplyMultiSelect(expectedCol.field, headerRow)}>Apply</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Data Preview with Transformations</h3>
                <VirtualizedTable columns={headerRow} rows={data} headerRow={headerRow} showHeader />
            </div>

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={onBack}><ChevronLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={onNext}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
        </>
    )
}
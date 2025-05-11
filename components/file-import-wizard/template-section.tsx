"use client"
import { Bookmark, BookmarkPlus, Check, Info, MoreHorizontal, Save, Trash2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { TransformationTemplate } from "./types"

interface TemplateSectionProps {
  savedTemplates: TransformationTemplate[]
  activeTransformations: number
  onApplyTemplate: (templateId: string) => void
  onDeleteTemplate: (templateId: string) => void
  onSaveTemplate: () => void
}

export function TemplateSection({
  savedTemplates,
  activeTransformations,
  onApplyTemplate,
  onDeleteTemplate,
  onSaveTemplate,
}: TemplateSectionProps) {
  const renderTemplateCard = (template: TransformationTemplate) => {
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
              <DropdownMenuItem onClick={() => onApplyTemplate(template.id)}>
                <Check className="h-4 w-4 mr-2" /> Apply
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDeleteTemplate(template.id)} className="text-red-600">
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
  }

  return (
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
                <DialogDescription>Apply a saved template to quickly set up your transformations.</DialogDescription>
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

          <Button variant="default" size="sm" className="flex items-center gap-1" onClick={onSaveTemplate}>
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
            onClick={() => onApplyTemplate(template.id)}
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
            <Button variant="outline" size="sm" className="text-xs" onClick={onSaveTemplate}>
              Save Current Setup
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExpectedColumn } from "./types"

interface UploadStepProps {
  sampleData: any[]
  expectedColumns: ExpectedColumn[]
  onFileUpload: (file: File) => void
}

export function UploadStep({ sampleData, expectedColumns, onFileUpload }: UploadStepProps) {
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload file</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-1">Data that we expect:</h3>
        <p className="text-sm text-gray-500 mb-4">(You will have a chance to rename or remove columns in next steps)</p>

        {/* Sample table */}
        <div className="overflow-x-auto mb-6 border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {expectedColumns.map((col) => (
                  <th key={col.field} className="px-4 py-3 text-left font-medium text-gray-700">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  {expectedColumns.map((col) => (
                    <td key={col.field} className="px-4 py-3 text-gray-600">
                      {row[col.field]}
                    </td>
                  ))}
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

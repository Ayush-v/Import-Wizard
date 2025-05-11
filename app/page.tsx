"use client"

import FileImportWizard from "@/components/file-import-wizard"

export default function Home() {
  // Define the expected columns for the import wizard
  const expectedColumns = [
    { field: "name", label: "NAME", required: true, dataType: "text" },
    { field: "surname", label: "SURNAME", required: true, dataType: "text" },
    { field: "age", label: "AGE", required: true, dataType: "number" },
    { field: "team", label: "TEAM", required: true, dataType: "text" },
    { field: "isManager", label: "IS MANAGER", required: false, dataType: "boolean" },
  ]

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-100 flex items-center justify-center">
      <FileImportWizard
      // expectedColumns={[
      //   { field: "name", label: "NAME", required: true, dataType: "text" },
      //   { field: "surname", label: "SURNAME", required: true, dataType: "text" },
      //   { field: "age", label: "AGE", required: true, dataType: "number" },
      //   { field: "team", label: "TEAM", required: true, dataType: "text" },
      //   { field: "isManager", label: "IS MANAGER", required: false, dataType: "boolean" },
      // ]}
      // onImportComplete={(data) => console.log("Import complete", data)}
      />
    </main>
  )
}

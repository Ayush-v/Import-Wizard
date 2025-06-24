"use client"

import FileImportWizard from "@/components/file-import-wizard"
import FileImport from "@/components/fileImport/FileImport"
import { ExpectedColumn } from "@/components/fileImport/types"

export default function Home() {
  const expectedColumnss: ExpectedColumn[] = [
    { field: "name", label: "NAME", required: true, dataType: "text" },
    { field: "surname", label: "SURNAME", required: true, dataType: "text" },
    { field: "age", label: "AGE", required: true, dataType: "number" },
    { field: "team", label: "TEAM", required: true, dataType: "text" },
    { field: "isManager", label: "IS MANAGER", required: false, dataType: "boolean" },
  ]

  const expectedColumns: ExpectedColumn[] = [
    { field: "firstName", label: "FIRST NAME", required: true, dataType: "text" },
    { field: "lastName", label: "LAST NAME", required: true, dataType: "text" },
    { field: "middleName", label: "MIDDLE NAME", required: false, dataType: "text" },
    { field: "email", label: "EMAIL", required: false, dataType: "text" },
    { field: "mobile", label: "MOBILE", required: false, dataType: "text" },
    { field: "aadharNumber", label: "AADHAR NUMBER", required: false, dataType: "text" },
    { field: "dateOfBirth", label: "DATE OF BIRTH", required: false, dataType: "date" },
    { field: "gender", label: "GENDER", required: true, dataType: "enum" },

    // Address fields (nested)
    { field: "address.addressLine1", label: "ADDRESS LINE 1", required: true, dataType: "text" },
    { field: "address.pincode", label: "PINCODE", required: true, dataType: "text" },
    { field: "address.city", label: "CITY", required: true, dataType: "text" },
    { field: "address.state", label: "STATE", required: true, dataType: "text" },
    { field: "address.country", label: "COUNTRY", required: true, dataType: "text" },

    // Medical record fields (nested)
    { field: "medicalRecord.bloodGroup", label: "BLOOD GROUP", required: false, dataType: "enum" },
    { field: "medicalRecord.conditions", label: "CONDITIONS", required: false, dataType: "text" },
    { field: "medicalRecord.emergencyMedication", label: "EMERGENCY MEDICATION", required: false, dataType: "text" },
    { field: "medicalRecord.doctorName", label: "DOCTOR NAME", required: false, dataType: "text" },
    { field: "medicalRecord.doctorContact", label: "DOCTOR CONTACT", required: false, dataType: "text" },
    { field: "medicalRecord.doctorAddress", label: "DOCTOR ADDRESS", required: false, dataType: "text" },
    { field: "medicalRecord.disability", label: "DISABILITY", required: false, dataType: "boolean" },
    { field: "medicalRecord.disabilityDescription", label: "DISABILITY DESCRIPTION", required: false, dataType: "text" },

    // Only first document entry supported for CSV import
    { field: "documents[0].documentType", label: "DOCUMENT TYPE", required: false, dataType: "text" },
    { field: "documents[0].documentUrl", label: "DOCUMENT URL", required: false, dataType: "text" },
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-100 flex flex-col gap-4 items-center justify-center">
      {/* <FileImportWizard
        expectedColumns={[
          { field: "name", label: "NAME", required: true, dataType: "text" },
          { field: "surname", label: "SURNAME", required: true, dataType: "text" },
          { field: "age", label: "AGE", required: true, dataType: "number" },
          { field: "team", label: "TEAM", required: true, dataType: "text" },
          { field: "isManager", label: "IS MANAGER", required: false, dataType: "boolean" },
        ]}
        onImportComplete={(data) => console.log("Import complete", data)}
      /> */}
      <FileImport expectedColumns={expectedColumns} />
      {/* <FileImportWizard /> */}
    </main>
  )
}

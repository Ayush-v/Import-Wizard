export type TransformationType =
  | "none"
  | "trim"
  | "uppercase"
  | "lowercase"
  | "capitalize"
  | "number"
  | "date"
  | "boolean"
  | "custom"

export type TransformationConfig = {
  type: TransformationType
  options?: {
    dateFormat?: string
    decimalPlaces?: number
    trueValues?: string[]
    falseValues?: string[]
    customFormula?: string
  }
}

export type AdditionalSource = {
  sourceIndex: number
  label: string
}

export type ColumnMapping = {
  sourceIndex: number | null
  targetField: string
  required: boolean
  transformation: TransformationConfig
  additionalSources: AdditionalSource[]
}

export type ValidationIssue = {
  row: number
  column: string
  message: string
  severity: "error" | "warning"
}

export type TransformationTemplate = {
  id: string
  name: string
  description: string
  dateCreated: string
  mappings: ColumnMapping[]
}

export type FileData = {
  rows: string[][]
  fileName: string
}

export type ExpectedColumn = {
  field: string
  label: string
  required: boolean
  dataType: "text" | "number" | "boolean" | "date"
}

export type Step = {
  number: number
  label: string
  isActive: boolean
  isCompleted: boolean
}

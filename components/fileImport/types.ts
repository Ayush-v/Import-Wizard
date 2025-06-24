export type Step = {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
};

export type FileData = {
  rows: string[][];
  fileName: string;
};

export type TransformationType =
  | "none"
  | "trim"
  | "uppercase"
  | "lowercase"
  | "capitalize"
  | "number"
  | "date"
  | "boolean"
  | "custom";

export type TransformationConfig = {
  type: TransformationType;
  options?: {
    dateFormat?: string;
    decimalPlaces?: number;
    trueValues?: string[];
    falseValues?: string[];
    customFormula?: string;
  };
};

export type ColumnMapping = {
  sourceIndex: number | null;
  targetField: string;
  required: boolean;
  transformation: TransformationConfig;
  additionalSources?: { sourceIndex: number; label: string }[];
};

export type ValidationIssue = {
  row: number;
  column: string;
  message: string;
  severity: "error" | "warning";
};

export type TransformationTemplate = {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
  mappings: ColumnMapping[];
};

export type DataType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "float"
  | "json"; // etc.

export type ExpectedColumn = {
  field: string;
  label: string;
  required: boolean;
  dataType: DataType;
};

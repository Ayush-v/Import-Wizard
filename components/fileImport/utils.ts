import { ExpectedColumn, FileData } from "./types";
import { faker } from "@faker-js/faker";

export function removeEmptyRows(
  fileData: FileData,
  expectedColumns: ExpectedColumn[],
  selectedHeaderRow: number
) {
  const header = fileData.rows[selectedHeaderRow];
  // Find indices of columns that match expected fields
  const mappedIndices = expectedColumns.map((col) =>
    header.findIndex((h) => h.toLowerCase().trim() === col.field.toLowerCase())
  );
  return {
    ...fileData,
    rows: fileData.rows.filter((row, idx) => {
      if (idx <= selectedHeaderRow) return true; // keep header and above
      return mappedIndices.some(
        (i) => i !== -1 && row[i] && row[i].trim() !== ""
      );
    }),
  };
}

export function generateSampleRows(
  expectedColumns: ExpectedColumn[],
  count = 1
) {
  return Array.from({ length: count }, () => {
    const row: Record<string, string> = {};
    for (const col of expectedColumns) {
      switch (col.dataType) {
        case "text":
          row[col.field] = faker.person.firstName();
          break;
        case "number":
          row[col.field] = faker.number.int({ min: 18, max: 65 }).toString();
          break;
        case "boolean":
          row[col.field] = faker.datatype.boolean().toString();
          break;
        case "date":
          row[col.field] = faker.date.past().toISOString();
          break;
        case "float":
          row[col.field] = faker.number.float({ min: 0, max: 100 }).toFixed(2);
          break;
        case "json":
          row[col.field] = JSON.stringify({ example: faker.word.noun() });
          break;
        default:
          row[col.field] = faker.lorem.word();
      }
    }
    return row;
  });
}

export const transformValue = (value: string, transformation: any): string => {
  if (!value) return value;

  switch (transformation.type) {
    case "none":
      return value;
    case "trim":
      return value.trim();
    case "uppercase":
      return value.toUpperCase();
    case "lowercase":
      return value.toLowerCase();
    case "capitalize":
      return value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    case "number":
      const num = Number.parseFloat(value);
      if (isNaN(num)) return value;
      const places = transformation.options?.decimalPlaces ?? 0;
      return num.toFixed(places);
    case "boolean":
      const trueValues = transformation.options?.trueValues || [
        "true",
        "yes",
        "1",
      ];
      const falseValues = transformation.options?.falseValues || [
        "false",
        "no",
        "0",
      ];

      if (trueValues.includes(value.toLowerCase())) return "true";
      if (falseValues.includes(value.toLowerCase())) return "false";
      return value;
    case "date":
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    case "custom":
      // Placeholder for custom formula
      return `${value} (custom)`;
    default:
      return value;
  }
};

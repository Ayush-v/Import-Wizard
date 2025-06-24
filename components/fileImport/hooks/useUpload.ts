import { useState, useCallback } from "react";
import type { FileData } from "../types";
// import { removeEmptyRows } from "../utils";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export function useUpload(onFileParsed: (data: FileData) => void) {
  const maxRows = 10000;

  const parseFile = useCallback((file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const ext = file.name.split(".").pop()?.toLowerCase();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result) {
          reject(new Error("File could not be read"));
          return;
        }

        let rows: string[][] = [];

        if (ext === "csv") {
          const content = result as string;
          rows = Papa.parse(content, { skipEmptyLines: "greedy" })
            .data as string[][];
        } else if (ext === "xlsx" || ext === "xls") {
          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
        } else {
          reject(new Error("Unsupported file format"));
          return;
        }

        if (rows.length > maxRows) {
          rows = rows.slice(0, maxRows);
        }

        resolve({ rows, fileName: file.name });
      };

      if (ext === "csv") {
        reader.readAsText(file);
      } else if (ext === "xlsx" || ext === "xls") {
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error("Unsupported file format"));
      }
    });
  }, []);

  const handleUpload = async (file: File) => {
    const parsed = await parseFile(file);
    onFileParsed(parsed);
    return parsed;
  };

  return {
    handleUpload,
  };
}

"use client"

import { useMemo } from "react";
import {
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import type { ExpectedColumn } from "../types";
import { generateSampleRows } from "../utils";

export default function FakerTableBody({ expectedColumns }: { expectedColumns: ExpectedColumn[] }) {
    const sampleData = useMemo(() => generateSampleRows(expectedColumns), [expectedColumns]);

    return <TableBody>
        {sampleData.map((row, index) => (
            <TableRow key={index}>
                {expectedColumns.map((col) => (
                    <TableCell key={col.field}>{row[col.field]}</TableCell>
                ))}
            </TableRow>
        ))}
    </TableBody>;
}

export function LoadingFallback({ expectedColumns }: { expectedColumns: ExpectedColumn[] }) {
    return (
        <TableBody>
            {[...Array(expectedColumns)].map((_, i) => (
                <TableRow key={i}>
                    {expectedColumns.map((col) => (
                        <TableCell key={col.field}>-</TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    )
}
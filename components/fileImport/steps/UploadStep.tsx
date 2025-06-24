"use client"

import { Button } from "@/components/ui/button";
import {
    Table,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { LoadingFallback } from "../_components/previewTable";
import type { ExpectedColumn } from "../types";

type Props = {
    onFileUpload: (file: File) => void;
    expectedColumns: ExpectedColumn[];
};

export default function UploadStep({ onFileUpload, expectedColumns }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const DynamicFakerTableBody = useMemo(() => dynamic(() => import("../_components/previewTable"), {
        ssr: false,
        loading: () => <LoadingFallback expectedColumns={expectedColumns} />
    }), [expectedColumns]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload file</h2>

            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Data that we expect:
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    (You will have a chance to rename or remove columns in next steps)
                </p>

                {/* Sample table */}
                <div className="overflow-x-auto mb-3 border rounded-lg mask-b-from-50%">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {expectedColumns.map((col) => (
                                    <TableHead key={col.field}>{col.label}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <DynamicFakerTableBody expectedColumns={expectedColumns} />
                    </Table>
                </div>

                <div
                    className="border-2 border-dashed border-primary/20 rounded-lg p-8 flex flex-col items-center justify-center h-64 bg-primary/5 cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-10 w-10 text-primary mb-4" />
                    <p className="text-gray-700 mb-6 text-center">
                        Upload .xlsx, .xls or .csv file
                    </p>
                    <Button>Select file</Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
}
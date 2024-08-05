import React, { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import { Trash2 } from "lucide-react"

import { deleteProject } from "@/api/preprocessing"
import { ColumnPreprocessing } from "@/components/editor/ColumnPreprocessing"
import { GlobalPreprocessing } from "@/components/editor/GlobalPreprocessing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePreprocessing } from "@/hooks/usePreprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"

interface CSVViewerProps {
  projectId: string
}

export function CSVViewer({ projectId }: CSVViewerProps) {
  const {
    csvData,
    headers,
    loading,
    error,
    workbookId,
    workbookName,
    workbookFileType,
    handleFileSelect,
    fetchFirstRows,
  } = useWorkbook(projectId)

  const {
    preprocessingConfig,
    handleGlobalPreprocessingChange,
    handleColumnTypeChange,
    handleColumnPreprocessingChange,
  } = usePreprocessing(headers)

  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { history } = useRouter()

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true)
      setDeleteError(null)
      try {
        await deleteProject(projectId)
        history.go(-1)
      } catch (err) {
        console.error("Error deleting project:", err)
        setDeleteError(`Failed to delete project: ${err.message}`)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const renderTableContent = () => {
    if (loading) {
      return Array.from({ length: 15 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: headers.length }).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))
    }

    return csvData.map((row, rowIndex) => (
      <TableRow key={rowIndex}>
        {headers.map((header, cellIndex) => (
          <TableCell key={cellIndex} className="px-2">
            {row[header]}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  return (
    <div className="p-4">
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-bold">Workbook Data</h3>

        {error && <div className="mb-4 text-red-500">{error}</div>}
        <Input
          type="file"
          accept=".csv,.xlsx,.xls,.xlsm"
          onChange={handleFileSelect}
          className="mb-4"
        />
        {workbookId && (
          <Button
            onClick={() => fetchFirstRows(workbookId)}
            disabled={loading}
            className="mb-4 ml-4"
          >
            Refresh Data
          </Button>
        )}
        {workbookName && (
          <div className="mb-4">
            Current Workbook: {workbookName} ({workbookFileType})
          </div>
        )}
        {loading ? (
          <div>Loading...</div>
        ) : csvData.length > 0 ? (
          <div className="mb-4 rounded-md border">
            <ScrollArea className="h-[400px]">
              <div className="min-w-full max-w-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index} className="px-2">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderTableContent()}</TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        ) : (
          <div>No data available</div>
        )}
      </div>
      <div>
        <GlobalPreprocessing
          preprocessingConfig={preprocessingConfig}
          handleGlobalPreprocessingChange={handleGlobalPreprocessingChange}
        />
        <ColumnPreprocessing
          preprocessingConfig={preprocessingConfig}
          handleColumnTypeChange={handleColumnTypeChange}
          handleColumnPreprocessingChange={handleColumnPreprocessingChange}
        />
      </div>
      <Button
        onClick={handleDelete}
        disabled={isDeleting}
        variant="destructive"
      >
        {isDeleting ? "Deleting..." : "Delete Project"}
        <Trash2 className="ml-2 h-4 w-4" />
      </Button>
      {deleteError && <div className="mb-4 text-red-500">{deleteError}</div>}
    </div>
  )
}

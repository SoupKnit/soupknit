import React, { useCallback } from "react"

import {
  DownloadIcon,
  ExpandIcon,
  FileInputIcon,
  TableIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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
import { cn } from "@/lib/utils"

export function DatasetPreview(props: {
  name: string
  loading?: boolean
  headers: string[]
  data: Record<string, any>[]
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center pb-6 pt-3 text-2xl">
        <TableIcon className="mr-2" />
        <div className="flex-grow font-bold">
          <span className="font-thin">Preview:</span> {props.name}
        </div>
        <DownloadIcon className="ml-2 cursor-pointer" />
        <TableExpand {...props} />
      </div>
      <DatasetPreviewInner {...props} />
    </div>
  )
}

function DatasetPreviewInner({
  loading,
  headers,
  data,
  vScroll = true,
}: {
  loading?: boolean
  headers: string[]
  data: Record<string, any>[]
  vScroll?: boolean
}) {
  const TableContent = useCallback(() => {
    if (loading) {
      return (
        <>
          {Array.from({ length: 15 }).map((_, rowIndex) => (
            <TableRow key={`skeleton-row-${rowIndex}`}>
              {Array.from({ length: headers.length }).map((_, cellIndex) => (
                <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </>
      )
    }

    return (
      <>
        {data.map((row, rowIndex) => (
          <TableRow key={`row-${rowIndex}`}>
            {headers.map((header, cellIndex) => (
              <TableCell key={`cell-${rowIndex}-${cellIndex}`} className="px-2">
                {row[header] ?? "N/A"}{" "}
                {/* Handles cases where data might be undefined */}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    )
  }, [loading, data, headers])
  return (
    <div className="mb-4 rounded-md border">
      <ScrollArea
        className={vScroll ? "h-[500px]" : "h-full max-h-screen-safe-offset-8"}
      >
        <div className="min-w-full max-w-lg overflow-x-auto">
          <Table>
            <TableHeader className="text-nowrap bg-gray-400">
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead
                    key={index}
                    className="px-2 text-gray-100 hover:bg-gray-500"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableContent />
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </div>
      </ScrollArea>
    </div>
  )
}

export function FileInputArea({
  fileUpload,
  className,
}: Readonly<{
  fileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}>) {
  return (
    <div
      className={cn(
        "relative h-96 w-full outline-dashed outline-gray-500",
        className,
      )}
    >
      <div className="absolute inset-0 top-[calc(50%-2rem)] m-auto w-1/3 text-gray-500">
        <FileInputIcon className="m-auto my-2 h-8 w-8" />
        <p className="text-center">Click here or drop files here to upload</p>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={fileUpload}
        className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
      />
    </div>
  )
}

function TableExpand(props: {
  name: string
  headers: string[]
  data: Record<string, any>[]
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <ExpandIcon className="ml-2 cursor-pointer" />
      </DrawerTrigger>
      <DrawerContent className="w-full">
        <div className="mx-12 max-h-screen-safe">
          <DrawerHeader>
            <DrawerTitle className="text-center font-semibold">
              Preview: {props.name}
            </DrawerTitle>
          </DrawerHeader>
          <DatasetPreviewInner {...props} vScroll={false} />
          <DrawerFooter></DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

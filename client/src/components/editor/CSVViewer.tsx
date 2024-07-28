import React, { useEffect, useState } from "react"
// import { useQuery } from "@tanstack/react-query"
import { openDB } from "idb"
import Papa from "papaparse"

import {
  ArrowUpDown,
  ChevronDown,
  EyeOff,
  Filter,
  Shuffle,
  Trash2,
  Upload,
} from "lucide-react"

import { upload } from "@/actions/uploadActions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEnv } from "@/lib/clientEnvironment"

import type { IDBPDatabase } from "idb"
import type { loadPyodide, PyodideInterface } from "pyodide"

type ColumnAction =
  | "sort"
  | "hide"
  | "filter"
  | "impute_mean"
  | "impute_median"
  | "scale_standard"
  | "scale_minmax"
  | "encode_onehot"
  | "encode_label"
  | "drop"

interface ColumnState {
  name: string
  type: string
  actions: ColumnAction[]
}

declare global {
  interface Window {
    loadPyodide: typeof loadPyodide
  }
}

export function CSVViewer() {
  const [csvData, setCSVData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnStates, setColumnStates] = useState<ColumnState[]>([])
  const [db, setDb] = useState<IDBPDatabase | null>(null)
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDb = async () => {
      const database = await openDB("CSVDatabase", 1, {
        upgrade(db) {
          db.createObjectStore("csvFiles")
        },
      })
      setDb(database)
    }
    initDb()

    const loadPyodideScript = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        script.integrity =
          "sha384-F2v7XcIqhmGFO1QaJt0TCAMrh9W9+AHLqarW3C/BwvctIZMYOwuGZmDNZfjEtyDo"
        script.crossOrigin = "anonymous"
        script.onload = () => resolve()
        script.onerror = (e) => {
          console.error("Error loading Pyodide script:", e)
          reject(new Error("Failed to load Pyodide"))
        }
        document.head.appendChild(script)
      })
    }

    const initPyodide = async () => {
      try {
        setLoading(true)
        await loadPyodideScript()
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        })
        await pyodideInstance.loadPackage(["pandas", "scikit-learn"])
        setPyodide(pyodideInstance)
        setError(null)
      } catch (err) {
        console.error("Error initializing Pyodide:", err)
        setError(
          "Failed to initialize Pyodide. Please refresh the page and try again.",
        )
      } finally {
        setLoading(false)
      }
    }
    initPyodide()
  }, [])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file && pyodide) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string

        pyodide.runPython(`
          import pandas as pd
          import io
          import json

          csv_data = io.StringIO(${JSON.stringify(text)})
          df = pd.read_csv(csv_data)
          column_types = df.dtypes.to_dict()
          column_types = {k: str(v) for k, v in column_types.items()}
          column_types_json = json.dumps(column_types)
          headers = df.columns.tolist()
          data = df.values.tolist()
        `)

        const columnTypesJson = pyodide.globals.get("column_types_json")
        const columnTypes = JSON.parse(columnTypesJson) as any
        const headers = pyodide.globals.get("headers").toJs()
        const data = pyodide.globals.get("data").toJs()

        setHeaders(headers)
        setCSVData(data.slice(0, 15))
        setColumnStates(
          headers.map((header: any) => ({
            name: header,
            type:
              columnTypes[header].includes("float") ||
              columnTypes[header].includes("int")
                ? "numeric"
                : "categorical",
            actions: [],
          })),
        )

        if (db) {
          await db.put("csvFiles", { headers, data }, "currentFile")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleColumnAction = async (header: string, action: ColumnAction) => {
    setColumnStates((prevStates) => {
      const newStates = prevStates.map((state) => {
        if (state.name === header) {
          const newActions = state.actions.includes(action)
            ? state.actions.filter((a) => a !== action)
            : [...state.actions, action]
          return { ...state, actions: newActions }
        }
        return state
      })
      return newStates
    })

    await applyPreprocessing()
  }

  const applyPreprocessing = async () => {
    if (!db || !pyodide) return

    const { headers, data } = (await db.get("csvFiles", "currentFile")) as {
      headers: string[]
      data: any[][]
    }

    pyodide.runPython(`
      import pandas as pd
      import numpy as np
      from sklearn.impute import SimpleImputer
      from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder, LabelEncoder

      df = pd.DataFrame(${JSON.stringify(data)}, columns=${JSON.stringify(headers)})
      column_states = ${JSON.stringify(columnStates)}

      for column in column_states:
        col_name = column['name']
        actions = column['actions']
        
        if 'drop' in actions:
          df = df.drop(columns=[col_name])
          continue

        if 'impute_mean' in actions:
          imputer = SimpleImputer(strategy='mean')
          df[col_name] = imputer.fit_transform(df[[col_name]])
        elif 'impute_median' in actions:
          imputer = SimpleImputer(strategy='median')
          df[col_name] = imputer.fit_transform(df[[col_name]])
        
        if 'scale_standard' in actions:
          scaler = StandardScaler()
          df[col_name] = scaler.fit_transform(df[[col_name]])
        elif 'scale_minmax' in actions:
          scaler = MinMaxScaler()
          df[col_name] = scaler.fit_transform(df[[col_name]])
        
        if 'encode_onehot' in actions:
          encoder = OneHotEncoder(sparse=False, drop='first')
          encoded = encoder.fit_transform(df[[col_name]])
          encoded_df = pd.DataFrame(encoded, columns=[f"{col_name}_{cat}" for cat in encoder.categories_[0][1:]])
          df = pd.concat([df.drop(col_name, axis=1), encoded_df], axis=1)
        elif 'encode_label' in actions:
          encoder = LabelEncoder()
          df[col_name] = encoder.fit_transform(df[col_name])

      preprocessed_data = df.values.tolist()
      preprocessed_headers = df.columns.tolist()
    `)

    const preprocessedData = pyodide.globals.get("preprocessed_data").toJs()
    const preprocessedHeaders = pyodide.globals
      .get("preprocessed_headers")
      .toJs()

    await db.put(
      "csvFiles",
      { headers: preprocessedHeaders, data: preprocessedData },
      "currentFile",
    )

    setHeaders(preprocessedHeaders)
    setCSVData(preprocessedData.slice(0, 15))
    setColumnStates((prevStates) =>
      prevStates.filter((state) => preprocessedHeaders.includes(state.name)),
    )
  }

  const env = useEnv(import.meta.env.DEV ? "dev" : "prod")

  const uploadToServer = async () => {
    if (!db) return

    const { headers, data } = (await db.get("csvFiles", "currentFile")) as {
      headers: string[]
      data: any[][]
    }

    const csvString = Papa.unparse({ fields: headers, data })
    const blob = new Blob([csvString], { type: "text/csv" })
    const file = new File([blob], "preprocessed.csv", { type: "text/csv" })

    const formData = new FormData()
    formData.append("file", file)

    try {
      await upload(env, formData)
    } catch (error) {
      console.error("Error uploading preprocessed file:", error)
    }
  }

  if (loading) {
    return (
      <div>Loading Pyodide and dependencies... This may take a moment.</div>
    )
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="p-4">
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="mb-4"
      />
      {csvData.length > 0 && (
        <>
          <div className="rounded-md border">
            <ScrollArea className="h-[400px]">
              <div className="w-max min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index} className="px-2">
                          <div className="flex items-center justify-between">
                            {header}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleColumnAction(header, "sort")
                                  }
                                >
                                  <ArrowUpDown className="mr-2 h-4 w-4" />
                                  Sort
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleColumnAction(header, "hide")
                                  }
                                >
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Hide
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleColumnAction(header, "filter")
                                  }
                                >
                                  <Filter className="mr-2 h-4 w-4" />
                                  Filter
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleColumnAction(header, "drop")
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Drop Column
                                </DropdownMenuItem>
                                {columnStates.find(
                                  (state) => state.name === header,
                                )?.type === "numeric" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleColumnAction(
                                          header,
                                          "impute_mean",
                                        )
                                      }
                                    >
                                      <Shuffle className="mr-2 h-4 w-4" />
                                      Impute Mean
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleColumnAction(
                                          header,
                                          "impute_median",
                                        )
                                      }
                                    >
                                      <Shuffle className="mr-2 h-4 w-4" />
                                      Impute Median
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleColumnAction(
                                          header,
                                          "scale_standard",
                                        )
                                      }
                                    >
                                      <Shuffle className="mr-2 h-4 w-4" />
                                      Standard Scaling
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleColumnAction(
                                          header,
                                          "scale_minmax",
                                        )
                                      }
                                    >
                                      <Shuffle className="mr-2 h-4 w-4" />
                                      Min-Max Scaling
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {columnStates.find(
                                  (state) => state.name === header,
                                )?.type === "categorical" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleColumnAction(
                                          header,
                                          "encode_onehot",
                                        )
                                      }
                                    >
                                      <Shuffle className="mr-2 h-4 w-4" />
                                      One-Hot Encoding
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleColumnAction(
                                          header,
                                          "encode_label",
                                        )
                                      }
                                    >
                                      <Shuffle className="mr-2 h-4 w-4" />
                                      Label Encoding
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="px-2">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="mt-4 space-x-2">
            <Button onClick={uploadToServer}>
              <Upload className="mr-2 h-4 w-4" />
              Upload to Server
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ArrowUpDown, EyeOff, Filter, Shuffle, Upload } from 'lucide-react'
import Papa from 'papaparse';
import { openDB, IDBPDatabase } from 'idb';
import { loadPyodide, PyodideInterface } from 'pyodide';

type ColumnAction = 'sort' | 'hide' | 'filter' | 'impute_mean' | 'impute_median' | 'scale_standard' | 'scale_minmax' | 'encode_onehot' | 'encode_label';

interface ColumnState {
  name: string;
  type: string;
  actions: ColumnAction[];
}

declare global {
    interface Window {
      loadPyodide: (config: any) => Promise<any>;
    }
  }
  
type PyodideInterface = any;

export function CSVViewer() {
  const [csvData, setCSVData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnStates, setColumnStates] = useState<ColumnState[]>([]);
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      const database = await openDB('CSVDatabase', 1, {
        upgrade(db) {
          db.createObjectStore('csvFiles');
        },
      });
      setDb(database);
    };
    initDb();

    const loadPyodideScript = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
        script.integrity = "sha384-F2v7XcIqhmGFO1QaJt0TCAMrh9W9+AHLqarW3C/BwvctIZMYOwuGZmDNZfjEtyDo";
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = (e) => {
          console.error('Error loading Pyodide script:', e);
          reject(new Error("Failed to load Pyodide"));
        };
        document.head.appendChild(script);
      });
    };

    const initPyodide = async () => {
      try {
        setLoading(true);
        await loadPyodideScript();
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        await pyodideInstance.loadPackage(['pandas', 'scikit-learn']);
        setPyodide(pyodideInstance);
        setError(null);
      } catch (err) {
        console.error('Error initializing Pyodide:', err);
        setError('Failed to initialize Pyodide. Please refresh the page and try again.');
      } finally {
        setLoading(false);
      }
    };
    initPyodide();
  }, []);

  console.log('Headers:', headers);
  console.log('CSV Data:', csvData);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && pyodide) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        console.log('CSV text:', text.substring(0, 200) + '...'); // Log the first 200 characters of the CSV

        // Use pandas to read the CSV and infer column types
        pyodide.runPython(`
          import pandas as pd
          import io
          import json

          csv_data = io.StringIO(${JSON.stringify(text)})
          df = pd.read_csv(csv_data)
          print("DataFrame info:")
          df.info()
          column_types = df.dtypes.to_dict()
          column_types = {k: str(v) for k, v in column_types.items()}
          print("Column types (Python):", column_types)
          column_types_json = json.dumps(column_types)
          print("Column types JSON:", column_types_json)
        `);

        const columnTypesJson = pyodide.globals.get('column_types_json');
        console.log('Column types JSON (JavaScript):', columnTypesJson);
        
        const columnTypes = JSON.parse(columnTypesJson);
        console.log('Column types parsed:', columnTypes);
        console.log('Column types constructor:', Object.prototype.toString.call(columnTypes));
        
        const headers = Object.keys(columnTypes);
        console.log('Headers:', headers);

        const data = pyodide.runPython('df.values.tolist()').toJs();
        console.log('First row of data:', data[0]);

        setHeaders(headers);
        setCSVData(data.slice(0, 15));
        setColumnStates(headers.map(header => ({
          name: header,
          type: columnTypes[header].includes('float') || columnTypes[header].includes('int') ? 'numeric' : 'categorical',
          actions: []
        })));

        if (db) {
          await db.put('csvFiles', { headers, data }, 'currentFile');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleColumnAction = (header: string, action: ColumnAction) => {
    setColumnStates(prevStates => {
      const newStates = prevStates.map(state => {
        if (state.name === header) {
          const newActions = state.actions.includes(action)
            ? state.actions.filter(a => a !== action)
            : [...state.actions, action];
          return { ...state, actions: newActions };
        }
        return state;
      });
      return newStates;
    });
  };

  const applyPreprocessing = async () => {
    if (!db || !pyodide) return;

    const { headers, data } = await db.get('csvFiles', 'currentFile') as { headers: string[], data: any[][] };
    
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
    `);

    const preprocessedData = pyodide.globals.get('preprocessed_data').toJs();
    const preprocessedHeaders = pyodide.globals.get('preprocessed_headers').toJs();

    await db.put('csvFiles', { headers: preprocessedHeaders, data: preprocessedData }, 'preprocessedFile');
    
    setHeaders(preprocessedHeaders);
    setCSVData(preprocessedData.slice(0, 15));
  };

  const uploadToServer = async () => {
    if (!db) return;

    const { headers, data } = await db.get('csvFiles', 'preprocessedFile') as { headers: string[], data: any[][] };
    
    const csvString = Papa.unparse({ fields: headers, data });
    const blob = new Blob([csvString], { type: 'text/csv' });
    const file = new File([blob], 'preprocessed.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Server response:', response.data);
    } catch (error) {
      console.error('Error uploading preprocessed file:', error);
    }
  };

  if (loading) {
    return <div>Loading Pyodide and dependencies... This may take a moment.</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <Input type="file" accept=".csv" onChange={handleFileSelect} className="mb-4" />
      {csvData.length > 0 && (
        <>
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index}>
                      <div className="flex items-center justify-between">
                        {header}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleColumnAction(header, 'sort')}>
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Sort
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleColumnAction(header, 'hide')}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleColumnAction(header, 'filter')}>
                              <Filter className="mr-2 h-4 w-4" />
                              Filter
                            </DropdownMenuItem>
                            {columnStates.find(state => state.name === header)?.type === 'numeric' && (
                              <>
                                <DropdownMenuItem onClick={() => handleColumnAction(header, 'impute_mean')}>
                                  <Shuffle className="mr-2 h-4 w-4" />
                                  Impute Mean
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleColumnAction(header, 'impute_median')}>
                                  <Shuffle className="mr-2 h-4 w-4" />
                                  Impute Median
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleColumnAction(header, 'scale_standard')}>
                                  <Shuffle className="mr-2 h-4 w-4" />
                                  Standard Scaling
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleColumnAction(header, 'scale_minmax')}>
                                  <Shuffle className="mr-2 h-4 w-4" />
                                  Min-Max Scaling
                                </DropdownMenuItem>
                              </>
                            )}
                            {columnStates.find(state => state.name === header)?.type === 'categorical' && (
                              <>
                                <DropdownMenuItem onClick={() => handleColumnAction(header, 'encode_onehot')}>
                                  <Shuffle className="mr-2 h-4 w-4" />
                                  One-Hot Encoding
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleColumnAction(header, 'encode_label')}>
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
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-4 space-x-2">
            <Button onClick={applyPreprocessing}>Apply Preprocessing</Button>
            <Button onClick={uploadToServer}>
              <Upload className="mr-2 h-4 w-4" />
              Upload to Server
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
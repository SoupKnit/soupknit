import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import { Trash2 } from "lucide-react"

import { fetchPreprocessingConfig } from "@/api/preprocessing"
import { ColumnPreprocessing } from "@/components/editor/ColumnPreprocessing"
import { GlobalPreprocessing } from "@/components/editor/GlobalPreprocessing"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePreprocessing } from "@/hooks/usePreprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useSupa } from "@/lib/supabaseClient"

interface CSVViewerProps {
  projectId: string
}

export function CSVViewer({ projectId }: CSVViewerProps) {
  const supa = useSupa()

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
    deleteProject,
  } = useWorkbook(projectId)

  const { data: fetchedPreprocessingConfig, isLoading: isConfigLoading } =
    useQuery({
      queryKey: ["preprocessingConfig"],
      queryFn: fetchPreprocessingConfig(supa),
    })

  const {
    preprocessingConfig,
    handleGlobalPreprocessingChange,
    handleColumnTypeChange,
    handleColumnPreprocessingChange,
  } = usePreprocessing(headers, fetchedPreprocessingConfig)

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
        await deleteProject(supa, projectId)
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

  if (isConfigLoading) {
    return <div>Loading preprocessing config...</div>
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="Preprocessing" className="w-auto">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Preprocessing">Preprocessing</TabsTrigger>
          <TabsTrigger value="Model Results">Model Results</TabsTrigger>
          <TabsTrigger value="Deploy">Deploy</TabsTrigger>
          <TabsTrigger value="Other">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="Preprocessing">
          <Card>
            <CardHeader>
              <CardTitle>Workbook Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
            <CardFooter>
              <div>
                <GlobalPreprocessing
                  preprocessingConfig={preprocessingConfig}
                  handleGlobalPreprocessingChange={
                    handleGlobalPreprocessingChange
                  }
                />
                <ColumnPreprocessing
                  preprocessingConfig={preprocessingConfig}
                  handleColumnTypeChange={handleColumnTypeChange}
                  handleColumnPreprocessingChange={
                    handleColumnPreprocessingChange
                  }
                />
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="Model Results">
          <Model />
        </TabsContent>
        <TabsContent value="Deploy">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Make changes to your account here. Click save when you're done.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Pedro Duarte" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="@peduarte" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="Other">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Make changes to your account here. Click save when you're done.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Pedro Duarte" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="@peduarte" />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="destructive"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
                <Trash2 className="ml-2 h-4 w-4" />
              </Button>
              {deleteError && (
                <div className="mb-4 text-red-500">{deleteError}</div>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function Model() {
  const [isAutomated, setIsAutomated] = useState(false)
  const [selectedTask, setSelectedTask] = useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>ML Project Setup</CardTitle>
        <CardDescription>
          Configure your machine learning project settings here. Click save when
          you're done.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="task">Select Task</Label>
          <Select onValueChange={(value) => setSelectedTask(value)}>
            <SelectTrigger id="task">
              <SelectValue placeholder="Select task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classification">Classification</SelectItem>
              <SelectItem value="regression">Regression</SelectItem>
              <SelectItem value="clustering">Clustering</SelectItem>
              <SelectItem value="time-series">
                Time Series Prediction
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedTask !== "clustering" && (
          <div className="space-y-1">
            <Label htmlFor="target-column">Target Column</Label>
            <Select>
              <SelectTrigger id="target-column">
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="column1">Column 1</SelectItem>
                <SelectItem value="column2">Column 2</SelectItem>
                <SelectItem value="column3">Column 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Switch
            id="automated"
            checked={isAutomated}
            onCheckedChange={setIsAutomated}
          />
          <Label htmlFor="automated">Automated</Label>
        </div>
        {!isAutomated && (
          <div className="space-y-1">
            <Label htmlFor="model">Select Model</Label>
            <Select>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="model1">Model 1</SelectItem>
                <SelectItem value="model2">Model 2</SelectItem>
                <SelectItem value="model3">Model 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

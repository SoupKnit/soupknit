import { Download, ListFilter } from "lucide-react"

import { Skeleton } from "../ui/skeleton"
import { CellActions } from "./CellActions"
import { DataViewer } from "./DataViewer"
import JupyterEmbedded from "./JupyterEmbedded"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ActionsContainer({
  editorRef,
  editorLoaded,
}: {
  editorLoaded: boolean
  editorRef: React.RefObject<HTMLIFrameElement | null>
}) {
  return (
    <Tabs defaultValue="add_cell">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="add_cell">Blocks</TabsTrigger>
          {/* <TabsTrigger value="year">Yet Another View</TabsTrigger> */}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Fulfilled
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Declined</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Refunded</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Download</span>
          </Button>
        </div>
      </div>
      <TabsContent value="data">
        <DataViewer />
      </TabsContent>
      <TabsContent value="add_cell">
        {editorLoaded ? (
          <CellActions editorRef={editorRef} />
        ) : (
          <Skeleton className="h-96" />
        )}
      </TabsContent>
    </Tabs>
  )
}

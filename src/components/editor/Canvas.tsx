import { createRef, useEffect, useState } from "react"

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreVertical,
  PlayIcon,
} from "lucide-react"

import { ActionContainer } from "./ActionsCallout"
import { Sidebar } from "./EditorSidebar"
import { LeftPanel } from "./LeftPanel"
import JupyterEmbedded from "@/components/editor/JupyterEmbedded"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Editor() {
  const [theme, setTheme] = useState("light")
  const jupyterRef = createRef<HTMLIFrameElement>()
  // Effect to listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: {
      data: { type: string; theme: React.SetStateAction<string> }
    }) => {
      if (event.data.type === "from-iframe-to-host") {
        setTheme(event.data.theme)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-8">
          <div className="col-span-3">
            <div className="mb-4">
              <ActionContainer />
            </div>
            <LeftPanel />
          </div>
          <div className="col-span-5">
            <Tabs defaultValue="jupyter">
              <TabsList>
                <TabsTrigger value="native">Native</TabsTrigger>
                <TabsTrigger value="jupyter">Jupyter</TabsTrigger>
                {/* <TabsTrigger value="year">Yet Another View</TabsTrigger> */}
              </TabsList>
              <div>
                <TabsContent value="native" className="h-full">
                  <SourceContainer />
                </TabsContent>
                <TabsContent value="jupyter" className="">
                  <Card>
                    <CardContent className="flex h-full min-h-[85vh] flex-col items-center justify-center p-2">
                      <JupyterEmbedded
                        ref={jupyterRef}
                        className="padding-none margin-none w-full flex-grow border-none"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

function SourceContainer() {
  const cells = [
    {
      id: "1",
      content: {
        type: "code",
        value: `import pandas as pd
import numpy as np
import scikit-learn as sk
`,
      },
    },
    {
      id: "2",
      content: {
        type: "code",
        value: `data = pd.read_csv("data.csv")
data.head()
`,
      },
    },
    {
      id: "3",
      content: {
        type: "code",
        value: `model = sk.LinearRegression()
model.fit(data)
`,
      },
    },
  ]
  return (
    <Card
      className="flex h-full flex-col overflow-hidden"
      x-chunk="dashboard-05-chunk-4"
    >
      <CardHeader className="flex flex-row items-center bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            Source Code
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy Order ID</span>
            </Button>
          </CardTitle>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-6 gap-1">
            <PlayIcon className="h-4 w-4" />
            <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
              Run Cells
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="m-t-0 h-6 w-6">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Trash</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 text-sm">
        {cells.map((c) => (
          <div className="mb-4" key={c.id}>
            <RenderCell code={c.content.value} />
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          3 cells, saved 2 minutes ago
        </div>
        <Pagination className="ml-auto mr-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button size="icon" variant="outline" className="h-6 w-6">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="sr-only">Previous Order</span>
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="outline" className="h-6 w-6">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="sr-only">Next Order</span>
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  )
}

function RenderCell({ code }: Readonly<{ code: string }>) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-background p-4 text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

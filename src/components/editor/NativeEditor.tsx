import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreVertical,
  PlayIcon,
} from "lucide-react"

import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
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

export function NativeEditor() {
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

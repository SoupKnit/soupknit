import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useAtomValue } from "jotai"

import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { userSettingsStore } from "@/store/userSettingsStore"

import type { Project } from "@soupknit/model/src/workbookSchemas"

export function DevMode({ activeProject }: { activeProject: any }) {
  const userSettings = useAtomValue(userSettingsStore)
  const qcData = useQueryClient()
    .getQueryCache()
    .getAll()
    .map((q) => q.state.data)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-slate-800 p-1 px-2 text-green-300 ring-2 ring-green-400 hover:bg-cyan-900">
            <Dialog>
              <DialogTrigger>Dev Mode</DialogTrigger>
              <DialogContent
                size="large"
                className="bg-gradient-to-b from-slate-100 to-stone-200"
              >
                <DialogHeader>
                  {/* create a cool tailwind animation for a fun welcome message */}
                  <DialogTitle className="w-80 pb-2 pt-4 text-green-500 transition-colors duration-1000 ease-in-out hover:bg-cyan-400 hover:text-red-600 hover:shadow-md">
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse text-3xl font-bold">
                        <span className="inline-block animate-bounce">D</span>
                        <span className="inline-block animate-bounce delay-100">
                          E
                        </span>
                        <span className="inline-block animate-bounce delay-200">
                          V
                        </span>
                        <span className="mx-2 inline-block animate-bounce delay-300">
                          M
                        </span>
                        <span className="delay-400 inline-block animate-bounce">
                          O
                        </span>
                        <span className="inline-block animate-bounce delay-500">
                          D
                        </span>
                        <span className="delay-600 inline-block animate-bounce">
                          E
                        </span>
                      </div>
                    </div>
                  </DialogTitle>
                  <DialogDescription>
                    Use this page to view all the data in the project.
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <h3>User Settings</h3>
                  <pre className="max-h-[500px] overflow-scroll">
                    {JSON.stringify(userSettings, null, 2)}
                  </pre>
                  <h3>Query Client: Cache</h3>
                  <pre className="max-h-[500px] overflow-scroll">
                    {JSON.stringify(qcData, null, 2)}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    className="w-32"
                    onClick={() => {
                      console.log({ userSettings, queryCache: qcData })
                    }}
                  >
                    Log
                  </Button>
                  <Link to="/app/internal">
                    <Button className="w-48">UI Playground</Button>
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="ml-8 rounded-lg px-4">
          <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
            <p>ProjectID: {activeProject?.id}</p>
            <p>WorkbookId: {activeProject?.workbook_data[0]?.id}</p>
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

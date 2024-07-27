import { useState } from "react"
import { set } from "zod"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { hiServer } from "@/actions/hiServer"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEnv } from "@/lib/clientEnvironment"

export function ActionCallout() {
  const env = useEnv(import.meta.env.DEV ? "dev" : "prod")
  const [reply, setReply] = useState<string | null>(null)
  return (
    <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
      <CardHeader className="pb-3">
        <CardTitle>Hi Server!</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          Here&apos; a space to recommend the next action for the user. This
          could be a block to use, a feature to try, or a setting to adjust.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger
            className="rounded bg-red-600 px-4 py-1 text-white"
            onClick={async () => {
              // wait 1 second for the server to respond before setting the reply
              await new Promise((resolve) => setTimeout(resolve, 1000))
              const resp = await hiServer(env)
              setReply(resp)
            }}
          >
            Test
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test Server Response</AlertDialogTitle>
              <AlertDialogDescription>
                <a href="/api/your_mom">baseUrl/api/your_mom</a>
                <p>{reply ? reply : "No response yet..."}</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setReply(null)}>
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}

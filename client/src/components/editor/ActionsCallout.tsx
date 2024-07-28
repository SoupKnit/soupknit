import { useState } from "react"
import { set } from "zod"

import { Upload } from "lucide-react"

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
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { hiServer } from "@/actions/hiServerActions"
import { createOrg } from "@/actions/orgSetupActions"
import { uploadFile } from "@/actions/uploadActions"
// import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEnv } from "@/lib/clientEnvironment"
import supa from "@/lib/supabaseClient"

export function ActionCallout() {
  const env = useEnv()
  const [reply, setReply] = useState<string | null>(null)
  return (
    <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
      <CardHeader className="pb-3">
        <CardTitle>Hi Server!</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          <Button
            className="mr-2"
            onClick={async () => {
              const session = await supa.auth.getSession()
              const user = session?.data?.session?.user
              const name = user?.email
              const userId = user?.id

              console.log("userId", userId)

              if (!userId) {
                return
              }
              const orgSetupRequest = {
                orgId: userId,
                orgName: `${name}'s Team`,
              }
              await createOrg(env, orgSetupRequest)
            }}
          >
            Setup my org
          </Button>
          <Input
            type="file"
            accept=".csv"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              console.log(file)
              if (file) {
                const response = await uploadFile(
                  env,
                  "org/data/fileName",
                  file,
                )
                console.log(response)
              }
            }}
            className="mb-4"
          />
          <Upload className="mr-2 h-4 w-4" />
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

import { useEffect } from "react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useAtom } from "jotai"

import { EditorHeaderAndSidebar } from "@/components/editor/Controls"
import { Sidebar } from "@/components/editor/EditorSidebar"
import { StatusBar } from "@/components/editor/StatusBar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isAuthenticated } from "@/lib/auth"
import { useSupa } from "@/lib/supabaseClient"
import { userSettingsStore } from "@/store/userSettingsStore"

export const Route = createFileRoute("/app/_editor")({
  component: BaseLayout,
  beforeLoad: async () => {
    if (!(await isAuthenticated())) {
      throw redirect({
        to: "/signin",
        search: {
          redirect: "/app",
        },
      })
    }
  },
})

function BaseLayout() {
  const [userSettings, setUserSettings] = useAtom(userSettingsStore)
  const supa = useSupa()

  const setUser = async () => {
    const {
      data: { user },
    } = await supa.auth.getUser()
    setUserSettings({ ...userSettings, userId: user?.id || null })
  }

  useEffect(() => {
    setUser()
  }, [])
  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <EditorHeaderAndSidebar />
        <Toaster />
        <ScrollArea
          className="flex h-full w-full flex-col [&>[data-orientation=vertical]]:!top-14 [&>[data-orientation=vertical]]:!h-auto"
          type="scroll"
        >
          <main className="flex flex-1 overflow-x-hidden">
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
              <Sidebar />
              <div className="sm:ml-12">
                <Outlet />
              </div>
            </div>
          </main>
        </ScrollArea>
        {/* <StatusBar /> */}
      </div>
    </TooltipProvider>
  )
}

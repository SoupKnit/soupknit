import { Link } from "@tanstack/react-router"
import { useAtom, useAtomValue } from "jotai"

import { ScanFace, Search, Sidebar } from "lucide-react"

import ThemeSwitcher from "../DarkModeSwitcher"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { projectDetailsStore } from "@/store/workbookStore"

export function EditorHeader() {
  // TODO: get the project name from here and display it in the breadcrumb
  const currentProject = useAtomValue(projectDetailsStore)
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-muted/40 px-4 dark:bg-green-200/15 sm:static sm:ml-14 sm:h-auto sm:border-0 sm:py-2">
      <Sidebar />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/app">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentProject?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto md:grow-0">
        <ThemeSwitcher />
      </div>
      {/* <div className="relative flex-1 md:grow-0"> */}
      {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> */}
      {/* <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg border border-slate-300 bg-transparent pl-8 md:w-[200px] lg:w-[336px]"
        /> */}
      {/* </div> */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <ScanFace className="h-6 w-6 border-none" />
            {/* <img
              src="/placeholder-user.jpg"
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
            /> */}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

import { useEffect, useState } from "react"
import { useAtom } from "jotai"

import { MoonIcon, SunIcon } from "lucide-react"

import { userSettingsStore } from "@/store/userSettingsStore"

const ThemeSwitcher = () => {
  const [userSettings, setUserSettings] = useAtom(userSettingsStore)

  useEffect(() => {
    const root = window.document.documentElement
    if (userSettings.theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", userSettings.theme) // Persist to localStorage
  }, [userSettings.theme])

  const toggleTheme = () => {
    setUserSettings({
      ...userSettings,
      theme: userSettings.theme === "dark" ? "light" : "dark",
    })
  }

  return (
    <button onClick={toggleTheme} className="rounded p-2">
      {userSettings.theme ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export default ThemeSwitcher

import { atom } from "jotai"

type UserSettings = {
  userId: string | null
  theme: "light" | "dark"
}

const getInitialUserSettings = (): UserSettings => {
  const storedTheme = (localStorage.getItem("theme") || "light") as
    | "light"
    | "dark"
  return {
    userId: null,
    theme: storedTheme,
  }
}

export const userSettingsStore = atom<UserSettings>(getInitialUserSettings())

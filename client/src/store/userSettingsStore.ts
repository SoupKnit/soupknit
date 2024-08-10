import { atom } from "jotai"

type UserSettings = {
  userId: string | null
}

export const userSettingsStore = atom<UserSettings>({
  userId: null,
})

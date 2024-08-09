import { atom } from "jotai"

// import { appCalloutStore } from "./appCalloutStore"
import { editorSettingsStore } from "./editorSettingsStore"
import { userSettingsStore } from "./userSettingsStore"

// create an atom to store the entire app state
// this includes sub-states for the user settings, editor settings
// and appCallout state
// assume other atoms are defined elsewhere (like ./userSettingsStore.ts)

export const appState = atom({
  userSettingsStore: userSettingsStore,
  editorSettingsState: editorSettingsStore,
  // appCalloutState: appCalloutStore,
})

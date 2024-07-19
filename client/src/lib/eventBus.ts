import type { CodeActionEvent } from "@soupknit/model"

export function sendCodeActionEvent(
  ref: React.RefObject<HTMLIFrameElement | null>,
  event: CodeActionEvent,
) {
  const iframe = ref.current
  if (!iframe) {
    throw new Error("Iframe not found")
  }
  console.log("Sending code action event to iframe", event)
  iframe.contentWindow?.postMessage(event, "*")
}

import { cn } from "@/lib/utils"

interface MultiLineTextInputProps {
  className?: string
  value: string
  onChange: (value: string) => void
}

const placeHolder = "Add description"

export const MultiLineTextInput = (props: MultiLineTextInputProps) => {
  const handleInput = (event: any) => {
    if (props.onChange) {
      props.onChange(event.target.innerText)
    }
  }

  return (
    <div
      contentEditable
      role="textbox"
      onBlur={handleInput}
      className={props.className || ""}
      dangerouslySetInnerHTML={{
        __html: withLineBreaks(props.value || placeHolder),
      }}
    />
  )
}

export function withLineBreaks(text: string) {
  return text?.replace(/(?:\r\n|\r|\n)/g, "<br>") || ""
}

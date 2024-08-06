interface MultiLineTextInputProps {
  className?: string
  value: string
  onChange: (value: string) => void
}

export const MultiLineTextInput = (props: MultiLineTextInputProps) => {
  const handleInput = (event: any) => {
    if (props.onChange) {
      props.onChange(event.target.innerText)
    }
  }

  return (
    <div
      contentEditable
      onBlur={handleInput}
      className="custom-textarea"
      dangerouslySetInnerHTML={{ __html: addLineBreaks(props.value) }}
    />
  )
}

function addLineBreaks(text: string) {
  return text?.replace(/(?:\r\n|\r|\n)/g, "<br>") || ""
}

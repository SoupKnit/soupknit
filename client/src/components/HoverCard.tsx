import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { CardProps } from "@/components/ui/card"

export function HoverCard(props: CardProps) {
  return (
    <Card
      hoverable
      className={cn(
        "rounded-md p-6 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800",
        props.className,
      )}
    >
      {props.children}
    </Card>
  )
}

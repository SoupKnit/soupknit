import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ActionContainer() {
  return (
    <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
      <CardHeader className="pb-3">
        <CardTitle>Next Action</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          Here&apos; a space to recommend the next action for the user. This
          could be a block to use, a feature to try, or a setting to adjust.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button>Upload New File</Button>
      </CardFooter>
    </Card>
  )
}

import { useMemo } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"

import { AlertCircle, HashIcon } from "lucide-react"

import { DatasetPreview } from "@/components/editor/DatasetPreview"
import { HoverCard } from "@/components/HoverCard"
import SelectCards from "@/components/SelectCards"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

export const Route = createFileRoute("/app/internal/")({
  component: Internal,
})

function Internal() {
  const sections = useMemo(() => {
    return [
      {
        title: "Table",
        component: <TableDemo />,
      },
      {
        title: "Tiled Cards",
        component: <TiledCards />,
      },
      {
        title: "Cards",
        component: <Cards />,
      },
    ]
  }, [])

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="h-screen w-96 border-r text-slate-500">
        <div className="fixed top-0 h-full px-12 pt-32">
          <h3 className="m-2 text-lg">Components</h3>
          <ul>
            {sections.map((section) => (
              <li key={section.title} className="px-4 py-1">
                <Link to="." hash={idify(section.title)}>
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Components */}
      <div className="container mb-48 mt-20 text-gray-700">
        <h1 className="text-4xl font-semibold">
          Internal Components Playground
        </h1>
        <Alert variant="default" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {/* <p className="mt-4 text-xl"> */}
            This is an internal playground to test component states, and design.
            <br />
            This is not mean to be a public page.
            {/* </p> */}
          </AlertDescription>
        </Alert>
        <blockquote className="mt-6 border-l-2 pl-6 italic">
          Have no fear of perfection -- you&apos;ll never reach it.
          <br />
          -- Salvador Dali, artist
        </blockquote>

        {sections.map((section) => (
          <div id={idify(section.title)} key={idify(section.title)}>
            <h1 className="pt-12 text-3xl font-semibold">
              <HashIcon className="mx-2 mt-1 inline-block h-7 w-7 align-top text-gray-300" />
              {section.title}
            </h1>
            <div className="mt-10">{section.component}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function idify(str: string) {
  return str.toLowerCase().replace(/\s/g, "-")
}

function TableDemo() {
  const tableProps = {
    name: "Demo",
    loading: false,
    headers: ["Name", "Age", "Location", "Something", "Type", "Something Else"],
    data: Array(100).fill({
      Name: "John Doe",
      Age: 25,
      Location: "New York",
      Something: "Something",
      Type: "Column",
      "Something Else": "Something Else",
    }),
  }
  return (
    <>
      <Variant title="Default" />
      {/* <DatasetPreview {...tableProps} /> */}
      <Variant title="Loading" />
      {/* <DatasetPreview {...tableProps} name="Loading Demo" loading /> */}
    </>
  )
}

function TiledCards() {
  const options = [
    {
      title: "Clustering",
      image: "/images/Clustering.png",
      value: "Clustering",
      summary:
        "Groups data points based on similarity; useful for customer segmentation and anomaly detection.",
    },
    {
      title: "Classification",
      image: "/images/Classification.png",
      value: "Classification",
      summary:
        "Assigns data points to predefined categories; used in tasks like spam detection and medical diagnosis.",
    },
    {
      title: "Time Series Prediction",
      image: "/images/TimeSeries.png",
      value: "TimeSeries",
      summary:
        "Forecasts future values based on past data; ideal for predicting trends like sales or stock prices.",
    },
  ]
  return (
    <>
      <Variant title="Horizontal Stack" />
      <SelectCards options={options} onSelectValue={() => {}} />
      <Variant title="Vertical Stack" />
      <SelectCards
        options={options}
        onSelectValue={() => {}}
        stacking="vertical"
      />
    </>
  )
}

function Cards() {
  return (
    <>
      <Variant title="Hover" />
      <div className="flex">
        <HoverCard>
          <div className="p-4">
            <h3 className="text-xl font-semibold">Hover Card</h3>
            <p className="mt-2 text-gray-600">
              This is a hover card with a shadow and padding.
            </p>
          </div>
        </HoverCard>
      </div>
      <Variant title="Default" />
      <div className="flex">
        <Card>
          <div className="p-4">
            <h3 className="text-xl font-semibold">Card</h3>
            <p className="mt-2 text-gray-600">
              This is a card with a shadow and padding.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
// ------------------------------------------------------------------

const Variant = ({ title }: { title: string }) => (
  <h3 className="mb-6 mt-12 w-full border-b pb-4 text-xl font-thin text-slate-600">
    Variant // <span className="font-semibold text-slate-800">{title}</span>
  </h3>
)

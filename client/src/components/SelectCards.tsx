import React, { useState } from "react"

import { HoverCard } from "./HoverCard"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

interface Option<T> {
  value: T
  image: string
  title: string
  summary: string
}

interface CardOptionProps<T> {
  stacking: "vertical" | "horizontal"
  image: string
  title: string
  summary: string
  value: T
  selectedValue: T | null
  onSelect: () => void
}

function CardOption<T>(props: CardOptionProps<T>) {
  const isSelected = props.value === props.selectedValue

  return (
    <div
      onClick={props.onSelect}
      className={props.stacking === "horizontal" ? "max-w-1/2" : "w-full"}
    >
      <HoverCard
        className={cn(
          "block h-full cursor-pointer select-none rounded-xl border-2 bg-white p-2 shadow-none shadow-slate-500 hover:translate-x-0 hover:translate-y-0 hover:border-slate-800",
          isSelected
            ? "border-slate-800 ring-2 ring-slate-700"
            : "border-gray-200",
        )}
      >
        <div
          className={
            props.stacking === "vertical"
              ? "flex max-h-64 w-full space-x-4"
              : "flex min-h-80 flex-col space-y-2"
          }
        >
          {/* Image should be full width, but fixed height */}
          {props.stacking === "horizontal" ? (
            <div className="h-48 w-full bg-[#cce1e2]">
              <img
                src={props.image}
                alt={props.title}
                className="h-full w-full rounded object-cover mix-blend-darken"
              />
            </div>
          ) : (
            <div className="flex w-1/3 flex-col overflow-hidden bg-red-600">
              <img
                src={props.image}
                alt={props.title}
                className="h-full rounded object-cover mix-blend-multiply"
              />
            </div>
          )}
          <div
            className={
              props.stacking === "horizontal" ? "pt-2" : "flex w-2/3 flex-col"
            }
          >
            <h3 className="text-left text-xl font-semibold">{props.title}</h3>
            <p className="overflow-hidden text-lg text-gray-600">
              {props.summary}
            </p>
          </div>
        </div>
      </HoverCard>
    </div>
  )
}

function SelectCards<T extends React.Key>(props: {
  /**
   * Horizontal : [ ] [ ] [ ]
   * Vertical stacking means one on top of another
   * Horizontal stacking means side by side
   */
  stacking?: "vertical" | "horizontal"
  options: Option<T>[]
  selectedValue?: T
  onSelectValue: (arg0: T) => void
}) {
  const { selectedValue, onSelectValue } = props

  return (
    <div
      className={
        props.stacking === "vertical"
          ? "space-y-4"
          : "space-between flex justify-center gap-4"
      }
    >
      {props.options.map((option) => (
        <CardOption
          stacking={props.stacking ?? "vertical"}
          key={option.value}
          image={option.image}
          title={option.title}
          summary={option.summary}
          value={option.value}
          selectedValue={selectedValue ?? null}
          onSelect={() => {
            console.log(option.value)
            onSelectValue(option.value)
          }}
        />
      ))}
    </div>
  )
}

export default SelectCards

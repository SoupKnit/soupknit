/**
 * v0 by Vercel.
 * @see https://v0.dev/t/PW9Ozbp76Bk
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function OnboardingForm() {
    const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [profession, setProfession] = useState("")
  const [goal, setGoal] = useState("")
  const [referral, setReferral] = useState("")
  const [scope, setScope] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [industry, setIndustry] = useState("")
  const [pythonLevel, setPythonLevel] = useState("")
  const handleNext = () => {
    if (step === 1 && (!profession)) {
      return
    }
    if (
      step === 2 &&
      (!scope || (scope === "professional" && (!companySize || !industry)))
    ) {
      return
    }
    if (step === 3 && !pythonLevel) {
      return
    }
    setStep(step + 1)
  }
  const handlePrevious = () => {
    setStep(step - 1)
  }
  const handleSubmit = () => {
    console.log({
      profession,
      goal,
      referral,
      scope,
      companySize,
      industry,
      pythonLevel,
    })
    setOpen(false)
  }
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant={"brutal"}>ONBOARDING</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex p-0 gap-0">
        <div className="w-1/3 bg-purple-300"></div>
        <div className="flex-grow p-6">
            <DialogHeader>
              <DialogTitle>Welcome to Soupknit</DialogTitle>
              <DialogDescription>
                Let&apos;s get to know you better and help you get started.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profession">What is your profession?</Label>
                    <Select
                      data-id="profession"
                      value={profession}
                      onValueChange={setProfession}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your profession" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="product-manager">
                          Product Manager
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="goal">
                      What do you want to accomplish with Soupknit?
                    </Label>
                    <Textarea
                      data-id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Enter your goals"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="referral">
                      How did you hear about Soupknit?
                    </Label>
                    <Input
                      data-id="referral"
                      value={referral}
                      onChange={(e) => setReferral(e.target.value)}
                      placeholder="Enter how you heard about us"
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Is your scope of work professional or personal?</Label>
                    <div className="flex gap-4">
                      <RadioGroup
                        value={scope}
                        onValueChange={setScope}
                        className="flex flex-col gap-2"
                      >
                        <Label
                          htmlFor="professional"
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <RadioGroupItem id="professional" value="professional" />
                          Professional
                        </Label>
                        <Label
                          htmlFor="personal"
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <RadioGroupItem id="personal" value="personal" />
                          Personal
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                  {scope === "professional" && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company-size">
                          What is your company size?
                        </Label>
                        <Select
                          data-id="company-size"
                          value={companySize}
                          onValueChange={setCompanySize}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">
                              201-500 employees
                            </SelectItem>
                            <SelectItem value="500+">500+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="industry">What is your industry?</Label>
                        <Select
                          data-id="industry"
                          value={industry}
                          onValueChange={setIndustry}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>What is your Python proficiency level?</Label>
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="beginner"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <RadioGroup>
                          <RadioGroupItem id="beginner" value="beginner" />
                          Beginner
                        </RadioGroup>
                      </Label>
                      <Label
                        htmlFor="intermediate"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <RadioGroup>
                          <RadioGroupItem id="intermediate" value="intermediate" />
                          Intermediate
                        </RadioGroup>
                      </Label>
                      <Label
                        htmlFor="advanced"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <RadioGroup>
                          <RadioGroupItem id="advanced" value="advanced" />
                          Advanced
                        </RadioGroup>
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {step > 1 && (
                <Button variant="brutal" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button variant={"brutal"} onClick={handleNext}>
                  {step === 1 && !profession
                    ? "Complete Step 1"
                    : step === 2 &&
                        (!scope ||
                          (scope === "professional" && (!companySize || !industry)))
                      ? "Complete Step 2"
                      : "Next"}
                </Button>
              ) : (
                <Button variant={"brutal"} onClick={handleSubmit}>Submit</Button>
              )}
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

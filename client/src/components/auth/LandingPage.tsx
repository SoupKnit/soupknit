import React, { useRef } from "react"
import { Link } from "@tanstack/react-router"
import { motion, useInView } from "framer-motion"

import { ArrowRight } from "lucide-react"

import HowItWorks from "./HowItWorks"
import aiAnimation from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/AI.gif"
import lookingForInsights from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/lookingForInsights.gif"
import soupKnitArt from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/soupKnit_Art.gif"
import aiTools from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/tools.gif"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef2f225] to-[#fef3c720]">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: "#422c75" }}>
            Soupknit
          </div>
          <div className="space-x-4">
            <Link to="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-16 py-16">
        <section className="flex text-left">
          <div className="mr-8 flex-grow gap-y-2">
            <h1 className="mb-6 font-headline text-6xl font-semibold leading-none text-gray-700 dark:text-blue-100">
              <span>No-Code</span>
              <br />
              <span>Machine Learning</span>
              <br />
              <span className="">for Everyone</span>
            </h1>
            <p className="mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
              <span>Build, train, and deploy machine learning models</span>
              <br />
              <span>without writing a single line of code.</span>
            </p>
          </div>
          <img
            src={soupKnitArt}
            alt="soupKnit Art"
            className="h-auto w-full sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl"
            style={{ filter: "grayscale(50%)" }}
          />
        </section>
        <section className="mb-20">
          <Link to="/signup">
            <Button size="lg" className="px-8 py-6 text-lg">
              Get Started. It's free <ArrowRight className="ml-2" />
            </Button>
          </Link>
          <p className="mt-4 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Built for Data Scientists, Enthusiasts, and noobs!
          </p>
        </section>

        <div className="flex w-full flex-col items-center bg-[#FFFFFF] p-4">
          <h1 className="my-6 text-center font-headline text-4xl font-semibold text-gray-700 dark:text-blue-100">
            <span>Need data insights, </span>
            <br />
            <span>but don’t have the tools or the team?</span>
            <br />
          </h1>
          <section className="mb-16 mt-4 flex gap-8">
            {[
              {
                gif: lookingForInsights,
                description:
                  "Looking to find insights from data, but can’t afford a data scientist ?",
              },
              {
                gif: aiAnimation,
                description:
                  "AI is a priority for you, but don’t know where to start ?",
              },
              {
                gif: aiTools,
                description:
                  "Want to impress your clients using AI, but don’t have the tools ?",
              },
            ].map((feature, index) => (
              <FeatureCard index={index} description={feature.description}>
                <img
                  src={feature.gif}
                  alt="GIF"
                  className="mb-4 h-12 w-12"
                  style={{
                    height: "200px",
                    width: "auto",
                    filter: "grayscale(40%)",
                  }}
                />{" "}
              </FeatureCard>
            ))}
          </section>

          <h2 className="pb-6 text-xl font-semibold">
            Soupknit is the no code AI solution you are looking for.
          </h2>

          <Link to="/signup">
            <Button size="sm" className="mb-5 px-8 py-6 text-sm">
              Get Started. It's free <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
        <div className="soupknit-steps-container">
          <h2
            className="mt-8 text-center font-headline text-4xl font-semibold text-gray-700 dark:text-blue-100"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            How SoupKnit works
          </h2>
          {<HowItWorks />}
        </div>
      </main>

      <footer className="mt-16 bg-gray-800 py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Soupknit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  children,
  className,
  index,
}: {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <div ref={ref} className="flex flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ opacity: 0, y: 0, scale: 0 }}
        animate={
          isInView
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 300, scale: 0.7 }
        }
        transition={{
          duration: 1.1,
          delay: index * 1.5,
          ease: "easeIn",
          type: "spring",
          stiffness: 35,
          damping: 10,
        }}
      >
        {children}
      </motion.div>

      <motion.p
        className="max-w-xs text-center text-gray-600 dark:text-gray-200"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0, y: 60 }}
        transition={{
          duration: 1.1,
          delay: index * 1.5,
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
      >
        {description}
      </motion.p>
    </div>
  )
}

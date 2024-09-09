import React, { useRef } from "react"
import { Link } from "@tanstack/react-router"
import { motion, useInView } from "framer-motion"

import HowItWorks from "./HowItWorks"
import aiAnimation from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/AI.gif"
import lookingForInsights from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/lookingForInsights.gif"
import soupKnitArt from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/soupKnit_Art.gif"
import aiTools from "/Users/vikram/Documents/CODE/soupknit/client/src/assets/landing-page/tools.gif"
import { Button } from "@/components/ui/button"

const textRaiseAttributes = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

const buttonRaiseAttributes = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef2f225] to-[#fef3c720]">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: "#46278d" }}>
            SoupKnit
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
        <motion.div
          className="pl-20"
          initial={{ y: 20, opacity: 0.2 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <section className="flex text-left">
            <div>
              <h1 className="mb-6 font-headline text-6xl font-semibold leading-none text-gray-700 dark:text-blue-100">
                <span>No-Code</span>
                <br />
                <span>Machine Learning</span>
                <br />
                <span>for </span>
                <span className="text-[#46278d]">Everyone</span>
              </h1>
              <p className="mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
                <span>Build, train, and deploy machine learning models</span>
                <br />
                <span>without writing a single line of code.</span>
              </p>
            </div>
            <div className="hero-image-container pl-40">
              <img
                src={soupKnitArt}
                alt="soupKnit Art"
                className="h-auto w-full sm:max-w-xs md:max-w-md lg:max-w-md xl:max-w-md"
                style={{ filter: "grayscale(50%)" }}
              />
            </div>
          </section>
          <section className="mb-20">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-8 text-lg">
                Get Started. It's free<span>→</span>
              </Button>
            </Link>
            <p className="mt-4 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Built for Data Scientists, Enthusiasts, and noobs.
            </p>
          </section>
        </motion.div>

        <div className="flex w-full flex-col items-center rounded-2xl bg-[#FFFFFF] p-4">
          <h1 className="my-6 text-center font-headline text-4xl font-semibold text-gray-700 dark:text-blue-100">
            <span>Need data insights? </span>
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
              <FeatureCard
                index={index}
                description={feature.description}
                gif={feature.gif}
              />
            ))}
          </section>

          <motion.h2
            className="pb-6 text-xl font-semibold"
            variants={textRaiseAttributes}
            initial="hidden"
            animate="visible"
            transition={{ delay: 4.5, duration: 0.5, ease: "easeOut" }}
          >
            Soupknit is the no code AI solution you are looking for !
          </motion.h2>

          <motion.div
            variants={buttonRaiseAttributes}
            initial="hidden"
            animate="visible"
            transition={{ delay: 5.5, duration: 0.5, ease: "easeOut" }}
          >
            <Link to="/signup">
              <Button size="sm" className="mb-5 gap-2 px-8 py-6 text-sm">
                Get Started. It's free<span>→</span>
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className="soupknit-steps-container">
          <h2
            className="mt-8 text-center font-headline text-4xl font-semibold text-gray-700 dark:text-blue-100"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            How SoupKnit works?
          </h2>
          {<HowItWorks />}
        </div>
      </main>

      <footer className="mt-8 bg-black py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Soupknit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  gif,
  description,
  index,
}: {
  title?: string
  description?: string
  gif?: String
  className?: string
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0 })

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center justify-center gap-4"
      initial={{ opacity: 0, y: 200, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : null}
      transition={{
        duration: 1.1,
        ease: "easeIn",
        type: "spring",
        stiffness: 35,
        damping: 10,
      }}
    >
      <img
        className="feature-gif w-60"
        src={gif}
        alt="feature gif"
        style={{ filter: "grayscale(20%)" }}
      ></img>
      <p className="max-w-xs text-center text-gray-600 dark:text-gray-200">
        {description}
      </p>
    </motion.div>
  )
}

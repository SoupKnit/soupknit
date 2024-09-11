import React, { useRef } from "react"
import { Link } from "@tanstack/react-router"
import { motion, useInView } from "framer-motion"

import { EarthLock, LockKeyhole, ShieldCheck } from "lucide-react"

import aiAnimation from "../../assets/landing-page/AI.gif"
import lookingForInsights from "../../assets/landing-page/lookingForInsights.gif"
import soupKnitArt from "../../assets/landing-page/soupKnit_Art.gif"
import aiTools from "../../assets/landing-page/tools.gif"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import HowItWorks from "./HowItWorks"
import { Button } from "@/components/ui/button"

const riseAttributes = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

const useCases = [
  {
    title: "Retail Demand Forecasting",
    description:
      "Predict demand for products using historical sales data and trends.",
  },
  {
    title: "Fraud Detection in Finance",
    description:
      "Detect fraudulent transactions in real-time by analyzing customer data.",
  },
  {
    title: "Personalized Marketing Campaigns",
    description: "Build recommendation engines based on customer behavior.",
  },
  {
    title: "Energy Consumption Optimization",
    description:
      "Predict and optimize energy usage using historical data and weather patterns.",
  },
  {
    title: "Customer Churn Prediction",
    description: "Identify at-risk customers to proactively reduce churn.",
  },
  {
    title: "Agriculture Yield Forecasting",
    description:
      "Predict crop yields based on soil quality, weather patterns, and historical data.",
  },
]

export function LandingPage() {
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const ref3 = useRef(null)
  const isDataInsightsInView = useInView(ref1, { once: true, amount: 0 })
  const isUsecaseInView = useInView(ref2, { once: true, amount: 0 })
  const isCallToActionInView = useInView(ref3, { once: true, amount: 0 })

  return (
    <div className="min-h-screen dark:bg-black">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: "#46278d" }}>
            SoupKnit
          </div>
          <div className="space-x-4">
            <Link to="/signin">
              <Button className="text-white">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-10 py-4 text-center transition-all duration-500 ease-in-out md:px-32">
        <motion.div
          initial={{ y: 40, opacity: 0.2 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <section className="flex md:flex-row md:text-left">
            <div>
              <h1 className="mb-6 font-headline text-6xl font-semibold leading-none text-gray-700 dark:text-blue-100">
                <span>No-Code</span>
                <br />
                <span>Machine Learning</span>
                <br />
                <span>for </span>
                <span className="text-glow-xl text-[#46278d]">Everyone</span>
              </h1>
              <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
                <span>Build, train, and deploy ML models</span>
                <br />
                <span>without writing a single line of code.</span>
              </p>
            </div>
            <div className="hero-image-container hidden pl-40 md:block">
              <img
                src={soupKnitArt}
                alt="soupKnit Art"
                className="h-auto md:w-full"
                style={{ filter: "grayscale(50%)" }}
              />
            </div>
          </section>
          <section className="mb-10 text-center md:mb-20 md:text-left">
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
          <section className="mb-16 flex flex-col gap-8 md:mt-4 md:flex-row">
            {[
              {
                gif: lookingForInsights,
                description:
                  "Looking to find insights from your data, but can’t afford a data scientist ?",
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
          <motion.section
            ref={ref1}
            initial={{ opacity: 0, y: 100 }}
            animate={isDataInsightsInView ? { opacity: 1, y: 0 } : null}
            transition={{
              duration: 1.1,
              ease: "easeIn",
              type: "spring",
              stiffness: 45,
              damping: 15,
            }}
          >
            <h2 className="px-4 pb-6 text-center text-xl font-semibold">
              SoupKnit is the no code AI solution you are looking for !
            </h2>

            <div>
              <Link to="/signup">
                <Button size="sm" className="mb-5 gap-2 py-6 text-sm">
                  Get Started. It's free<span>→</span>
                </Button>
              </Link>
            </div>
          </motion.section>
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
        <motion.div
          ref={ref2}
          initial={{ opacity: 0, y: 100 }}
          animate={isUsecaseInView ? { opacity: 1, y: 0 } : null}
          transition={{
            duration: 1.1,
            ease: "easeIn",
            type: "spring",
            stiffness: 45,
            damping: 15,
          }}
          className="usecases-container mx-auto flex flex-col justify-center pb-16"
        >
          <h2 className="my-16 text-center font-headline text-4xl font-semibold text-gray-700 dark:text-blue-100">
            Discover how SoupKnit empowers diverse industries
            <p className="md:pt-2">
              with end-to-end Machine Learning solutions
            </p>
          </h2>

          <div className="mx-auto grid grid-cols-1 gap-4 md:w-[80%] md:grid-cols-2">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="shadow-xs rounded-lg border border-slate-200 transition-transform hover:scale-105"
              >
                <CardContent className="p-6">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {useCase.title}
                  </CardTitle>
                  <CardDescription className="mt-4 text-gray-600">
                    {useCase.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
        <motion.div
          ref={ref3}
          initial={{ opacity: 1, y: 150 }}
          animate={isCallToActionInView ? { opacity: 1, y: 0 } : null}
          transition={{
            duration: 1.1,
            ease: "easeIn",
            type: "spring",
            stiffness: 45,
            damping: 15,
          }}
          className="flex flex-col pb-8 text-center text-gray-800 md:px-32 md:pb-24 md:pt-12 md:text-left"
        >
          <h2 className="font-headline text-4xl font-semibold md:text-8xl">
            Get started.
          </h2>
          <p className="mb-14 mt-4 md:text-2xl">
            See how SoupKnit can transform your business and change how you make
            decisions.
          </p>
          <Link to="/signup">
            <Button size="lg" className="gap-2 md:text-2xl">
              Let's go, <span>create an account</span>
              <span>→</span>
            </Button>
          </Link>
        </motion.div>
      </main>

      <footer className="bg-black py-1 text-white md:mt-40">
        <div className="md:text-md container mx-auto px-4 text-center text-sm">
          <span className="inline-flex items-center gap-2 pb-1">
            Your data is secure with us
            <LockKeyhole size={15} />
          </span>
          <p>&copy; 2024 SoupKnit. All rights reserved.</p>
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

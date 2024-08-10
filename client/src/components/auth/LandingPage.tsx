import React from "react"
import { Link } from "@tanstack/react-router"

import { ArrowRight, BarChart, Code, Users, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef2f225] to-[#fef3c720]">
      <header className="container mx-auto max-w-screen-lg px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">Soupknit</div>
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

      <main className="container mx-auto max-w-screen-lg px-4 py-16">
        <section className="mb-16 text-left">
          <h1 className="mb-6 font-headline text-8xl font-semibold leading-none text-gray-700 dark:text-blue-100">
            <span>No-Code</span>
            <br />
            <span>Machine Learning</span>
            <br />
            <span className="">for Everyone</span>
          </h1>
          <p className="mb-8 max-w-2xl text-3xl text-gray-600 dark:text-gray-400">
            Build, train, and deploy machine learning models without writing a
            single line of code.
          </p>
          <Link to="/signup">
            <Button size="lg" className="px-8 py-6 text-lg">
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </section>

        <section className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Code,
              title: "No Coding Required",
              description:
                "Build complex ML models using our intuitive drag-and-drop interface.",
            },
            {
              icon: Zap,
              title: "Rapid Prototyping",
              description:
                "Go from idea to working model in minutes, not weeks.",
            },
            {
              icon: BarChart,
              title: "Powerful Analytics",
              description:
                "Gain insights with our built-in data visualization tools.",
            },
            {
              icon: Users,
              title: "Collaboration",
              description:
                "Work together seamlessly with your team on ML projects.",
            },
          ].map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
            >
              <feature.icon className="mb-4 h-12 w-12 text-indigo-500" />
            </FeatureCard>
          ))}
        </section>

        <FeatureCard className="text-lg text-gray-700 dark:text-gray-200">
          <h2 className="mb-6 text-3xl font-bold">How It Works</h2>
          <ol className="list-inside list-decimal space-y-4">
            <li>Upload your data or connect to your data source</li>
            <li>
              Choose your machine learning task (classification, regression,
              clustering, etc.)
            </li>
            <li>Select and configure your model using our visual interface</li>
            <li>Train and evaluate your model with just a few clicks</li>
            <li>
              Deploy your model to production or export it for use in your
              applications
            </li>
          </ol>
        </FeatureCard>

        <section className="mt-20">
          <h2 className="mb-6 text-3xl font-bold">
            Ready to Transform Your Data?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Join thousands of data scientists, analysts, and business
            professionals who are already using Soupknit to unlock the power of
            machine learning.
          </p>
          <Link to="/signup">
            <Button size="lg" className="px-8 py-6 text-lg">
              Start Your Free Trial <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </section>
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
}: {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-black bg-[#e8ece528] p-6 shadow-[8px_8px_1px] shadow-zinc-500",
        className,
      )}
    >
      {children}
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-200">{description}</p>
    </div>
  )
}

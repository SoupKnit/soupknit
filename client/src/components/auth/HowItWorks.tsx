import React, { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import "./styles.css"

function HowItWorks() {
  const steps = [
    {
      title: "Upload your Data",
      description:
        "Upload your dataset, which will be automatically preprocessed to prepare it for analysis.",
    },
    {
      title: "Choose Task",
      description:
        "Identify your specific machine learning task, such as forecasting, classification, or anomaly detection.",
    },
    {
      title: "Select a Model",
      description:
        "Select a suitable machine learning model for your task, such as linear regression, decision trees, or neural networks.",
    },
    {
      title: "Optimize",
      description:
        "Tune and optimize your chosen model to improve its performance and accuracy.",
    },
    {
      title: "Deploy",
      description:
        "Deploy your trained model, making it available for real-time predictions.",
    },
  ]

  useEffect(() => {
    const svg = document.querySelector(".steps-svg")
    const path = svg?.querySelector("path")
    const container = document.querySelector(".how-it-works-container")

    if (path && container) {
      const pathLength = path.getTotalLength()

      path.style.strokeDasharray = `${pathLength}`
      path.style.strokeDashoffset = `${pathLength}`

      const handleScroll = () => {
        const containerRect = container.getBoundingClientRect()
        const containerTop = containerRect.top
        const containerHeight = containerRect.height + 200
        const windowHeight = window.innerHeight

        const scrolledPast = windowHeight - containerTop
        const scrollPercentage = Math.min(
          Math.max(scrolledPast / containerHeight, 0),
          1,
        )

        const dashOffset = pathLength - pathLength * scrollPercentage
        path.style.strokeDashoffset = `${dashOffset}`
      }

      window.addEventListener("scroll", handleScroll)
      handleScroll()

      return () => {
        window.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])
  return (
    <div className="how-it-works-container">
      <div className="steps-grid">
        {steps.map((step, index) => (
          <Card key={index} className={`grid-item grid-area-${index + 1} rounded-md border border-slate-200 shadow-2xl`}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{step.description}</p>
            </CardContent>
          </Card>
        ))}
        <svg
          className="steps-svg"
          width="1054"
          height="1289"
          viewBox="0 0 1054 1289"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M662.461 1.11462C726.705 69.5747 731.618 118.633 683.076 200.061V200.061C624.147 275.627 521.572 301.776 433.659 263.643L366.951 234.709L298.177 215.129L279.562 212.324C234.198 205.49 187.826 212.264 146.312 231.79L133.951 237.604C107.73 249.937 84.9349 268.517 67.5668 291.712V291.712C44.6297 322.346 32.233 359.585 32.233 397.855V407.176C32.233 438.379 47.6802 467.558 73.4851 485.1L83.4951 491.904C90.4893 496.659 98.0765 500.681 105.929 503.822V503.822C180.343 533.592 264.961 530.193 336.38 493.817L403.645 459.555C426.468 447.931 450.59 439.058 475.505 433.123L478.424 432.427C504.262 426.273 531.324 427.682 556.383 436.487L570.236 441.354C598.665 451.344 621.477 472.997 632.933 500.867V500.867C637.325 511.55 640.116 522.886 640.116 534.436C640.123 714.528 461.951 829.92 298.177 785C-13.1976 699.596 -48 971 51 1021V1021C156.265 1062.38 276.013 1038.09 356.846 958.981L399.514 917.22C466.596 851.566 560.539 821.093 653.387 834.87L659.427 835.767C757.408 850.306 841.897 912.273 885.203 1001.36L886 1003L895.128 1029.62C904.866 1058.02 906.845 1088.51 900.861 1117.94V1117.94C891.396 1164.47 862.75 1204.86 821.962 1229.18L807.083 1238.06C754.982 1269.12 691.91 1275.88 634.413 1256.55L614.925 1250L580.796 1235.69C574.961 1233.24 569.504 1229.98 564.588 1226L561.852 1223.78C550.896 1214.9 543.582 1202.31 541.299 1188.4L540.76 1185.11C537.281 1163.9 547.056 1142.71 565.45 1131.59V1131.59C573.66 1126.62 583.071 1124 592.665 1124H597.515C608.806 1124 619.781 1127.72 628.742 1134.59V1134.59C641.413 1144.3 648.843 1159.36 648.843 1175.33V1179.51C648.843 1192.79 644.422 1205.69 636.278 1216.18L631.368 1222.51C626.481 1228.8 620.715 1234.36 614.245 1239.02L601.423 1248.24C576.083 1266.47 546.69 1278.27 515.777 1282.61L501.447 1284.62C431.71 1294.42 361.064 1274.49 306.736 1229.68L295 1220"
            stroke="#2147DB"
            stroke-width="2"
          />
        </svg>
      </div>
    </div>
  )
}

export default HowItWorks

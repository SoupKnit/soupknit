import { toast } from "sonner"

import SelectCards from "../SelectCards"
import { CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useCreateWorkbook, useUpdateWorkbook } from "@/actions/workbookActions"
import { updateObject } from "@/lib/utils"

import type { Option } from "../SelectCards"
import type { WorkbookData } from "@soupknit/model/src/workbookSchemas"

const options = [
  {
    value: "Regression",
    // image: "https://via.placeholder.com/64",
    image: "/images/Regression.png",
    title: "Regression",
    summary:
      "Predicts continuous values based on input features; ideal for numerical forecasting like prices.",
    description: `
      Regression is a technique used to predict a continuous outcome variable (dependent variable) based on one or more predictor variables (independent variables).
      It's best suited for scenarios where you need to forecast numerical values, such as predicting a person's weight based on their height and age, or estimating house prices based on various features like square footage, location, and number of rooms.

      Example: Imagine you have a dataset of houses with features such as the number of bedrooms, square footage, and location. Regression can help predict the price of a house given these features.

      Type of Data: Regression works best with numerical data, where the relationship between the variables is typically linear, though there are methods for handling non-linear relationships as well.
    `,
  },
  {
    value: "Clustering",
    image: "/images/Clustering.png",
    title: "Clustering",
    summary:
      "Groups similar data points without predefined labels; useful for exploring data and finding patterns.",
    description: `
      Clustering is an unsupervised learning technique used to group similar data points together. It identifies patterns and structures in data without requiring labels. Clustering is ideal when you want to explore data and find natural groupings without predefined categories.

      Example: A retail store might use clustering to group customers based on purchasing behavior, allowing them to identify different customer segments such as frequent buyers, occasional buyers, and one-time shoppers.

      Type of Data: Clustering works well with mixed types of data, including numerical, categorical, and even text data. It's particularly useful when you have a large dataset and want to uncover hidden patterns or groupings.
    `,
  },
  {
    value: "Classification",
    image: "/images/Classification.png",
    title: "Classification",
    summary:
      "Assigns data points to predefined categories; used in tasks like spam detection and medical diagnosis.",
    description: `
      Classification is a supervised learning technique used to assign data points to predefined categories or classes. It's commonly used for problems where the outcome is a discrete label, such as spam detection in emails, medical diagnosis, or sentiment analysis.

      Example: In a medical context, classification could be used to determine whether a tumor is benign or malignant based on features such as size, shape, and cell type.

      Type of Data: Classification models work with categorical data, where the goal is to predict which category (or class) a new data point belongs to. This could be binary (e.g., yes/no, spam/not spam) or multi-class (e.g., types of animals, different genres of movies).
    `,
  },
  {
    value: "TimeSeries",
    image: "/images/TimeSeries.png",
    title: "Time Series Prediction",
    summary:
      "Forecasts future values based on past data; ideal for predicting trends like sales or stock prices.",
    description: `
      Time Series Prediction is used to predict future values based on previously observed data points that are sequentially ordered in time. This method is ideal for forecasting trends, detecting seasonal patterns, and analyzing temporal dependencies.

      Example: A company might use time series prediction to forecast its monthly sales revenue based on historical sales data. Similarly, it can be used to predict stock prices, weather conditions, or energy consumption over time.

      Type of Data: Time series data consists of observations collected at regular intervals over time (e.g., daily stock prices, hourly weather readings). The data's temporal order is crucial, as patterns over time (like trends and seasonality) are key to making accurate predictions.
    `,
  },
] satisfies Array<
  { description: string } & Option<
    "Regression" | "Clustering" | "Classification" | "TimeSeries"
  >
>

export function SelectTaskTypeSection({
  projectId,
  workbookData,
}: {
  projectId: string
  workbookData: WorkbookData
}) {
  const createWorkbookMutation = useCreateWorkbook(projectId, {
    onSuccess: (_data) => {
      toast.success("Workbook created successfully")
    },
  })
  const { updateWorkbookConfigMutation } = useUpdateWorkbook({
    projectId,
    updateConfigOptions: {
      onSuccess: (_data) => {
        toast.success("Workbook config updated successfully")
      },
      onError: (error) => {
        console.error("Error updating workbook config:", error)
        toast.error("Error updating workbook config")
      },
    },
  })
  return (
    <>
      <SelectCards<
        "Regression" | "Clustering" | "Classification" | "TimeSeries"
      >
        stacking="horizontal"
        options={options}
        selectedValue={workbookData?.config?.taskType ?? undefined}
        onSelectValue={(v) => {
          console.log(v)
          if (workbookData?.config) {
            updateWorkbookConfigMutation.mutate({
              projectId,
              workbookId: workbookData.id,
              updatedConfig: updateObject(workbookData.config, "taskType", v),
            })
          } else {
            // create new workbook
            createWorkbookMutation.mutate({
              config: {
                taskType: v,
              },
            })
          }
        }}
      />
    </>
  )
}

export function SelectTaskTypeSectionHeader() {
  return (
    <CardHeader>
      <CardTitle>Project Overview</CardTitle>
      <CardDescription>Select a task type to get started</CardDescription>
    </CardHeader>
  )
}

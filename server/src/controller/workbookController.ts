import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  CodeGenerationRequestConfig,
  CodeGenerationConfigSchema,
} from "@soupknit/model/src/codeGeneratorSchemas";
// import { WorkbookSchema } from "@soupknit/model/src/workbookSchemas";
import {
  BaseGenerator,
  GeneratedCode,
} from "../core/codeGeneration/baseGenerator";
import {
  SklearnGenerator,
  PyTorchGenerator,
  TensorFlowGenerator,
} from "../core/codeGeneration/modelGenerator";
import { runInPythonSandbox } from "../core/pythonSandbox/run";
import { getSupabaseClient } from "../lib/supabase";

import fs from "fs";
import path from "path";
import os from "os";
import Papa from "papaparse";

export default async function workbookController(fastify: FastifyInstance) {
  const supa = getSupabaseClient();
  // POST /
  fastify.post(
    "/code_gen",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      // validate the request
      const request = CodeGenerationConfigSchema.parse(_request.body);

      const generator = getGenerator(request.framework, request.payload);
      const response: GeneratedCode = generator.generateCode();

      reply
        .header("Content-Type", "application/json; charset=utf-8")
        .send(response);
    },
  );

  // POST /analyze_file
  // TODO refactor this function into smaller components
  fastify.post(
    "/analyze_file",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { taskType, targetColumn, fileUrl, projectId } = _request.body as {
        taskType: string;
        targetColumn: string;
        fileUrl: string;
        projectId: string;
      };

      try {
        console.log("1. Received projectId:", projectId);

        // Fetch the workbook_id and user_id based on the project_id
        let workbookId, userId;
        try {
          const { data: workbookData, error: workbookError } = await supa
            .from("workbook_data")
            .select("id, created_by")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (workbookError) {
            console.error(
              "2. Error fetching workbook_id and user_id:",
              workbookError,
            );
            throw workbookError;
          }

          if (!workbookData) {
            console.error("3. No workbook found for the given project_id");
            throw new Error("No workbook found for the given project_id");
          }

          workbookId = workbookData.id;
          userId = workbookData.created_by;
          console.log(
            "4. Fetched workbookId:",
            workbookId,
            "and userId:",
            userId,
          );
        } catch (error) {
          console.error("5. Error in fetching workbook_id and user_id:", error);
          throw error;
        }

        // Extract the path from the fileUrl
        const urlParts = new URL(fileUrl);
        let filePath = urlParts.pathname;

        // Remove the '/storage/v1/object/public/' prefix if it exists
        const prefixToRemove = "/storage/v1/object/public/";
        if (filePath.startsWith(prefixToRemove)) {
          filePath = filePath.slice(prefixToRemove.length);
        }

        // Split the remaining path and remove the bucket name
        const pathParts = filePath.split("/");
        const bucketName = pathParts.shift(); // This removes and returns the bucket name
        filePath = pathParts.join("/");

        console.log("6. Extracted bucket name:", bucketName);
        console.log("7. Extracted file path:", filePath);

        // Fetch the file content from Supabase storage
        let fileContent;
        try {
          const { data, error } = await supa.storage
            .from(bucketName!)
            .download(filePath);

          if (error) {
            console.error("8. Supabase storage error:", error);
            throw error;
          }

          if (!data) {
            console.error("9. No data received from Supabase storage");
            throw new Error("No data received from Supabase storage");
          }

          // Convert the file data to text
          fileContent = await data.text();
          console.log("10. File content fetched successfully");
        } catch (error) {
          console.error("11. Error in fetching file content:", error);
          throw error;
        }

        const input = JSON.stringify({
          fileContent,
          taskType,
          targetColumn,
        });

        // Specify the path to your Python script
        const scriptPath = "../packages/python/analyze_file.py";

        console.log("12. Running Python script");
        // Run the Python script in the sandbox
        const result: any = await new Promise((resolve, reject) => {
          let stdout = "";
          let stderr = "";

          runInPythonSandbox({
            input,
            files: [],
            scriptPath,
            onData: (data: string) => {
              stdout += data;
            },
            onError: (error: string) => {
              stderr += error;
            },
            onClose: (code: number) => {
              if (code !== 0) {
                console.error("13. Python script error:", stderr);
                reject(
                  new Error(
                    `Python script exited with code ${code}. Stderr: ${stderr}`,
                  ),
                );
              } else {
                try {
                  const jsonResult = JSON.parse(stdout);
                  console.log("14. Python script executed successfully");
                  resolve(jsonResult);
                } catch (error) {
                  console.error("15. Failed to parse JSON result:", error);
                  reject(
                    new Error(
                      `Failed to parse JSON result. Stdout: ${stdout}, Stderr: ${stderr}`,
                    ),
                  );
                }
              }
            },
          });
        });

        console.log("16. Fetching existing workbook data from Supabase");
        // Fetch existing workbook data from Supabase
        let workbookdata;
        try {
          const { data, error: fetchError } = await supa
            .from("workbook_data")
            .select("config")
            .eq("id", workbookId)
            .single();

          if (fetchError) {
            console.error("17. Error fetching workbook data:", fetchError);
            throw fetchError;
          }

          workbookdata = data;
          console.log("18. Existing workbook data fetched successfully");
        } catch (error) {
          console.error("19. Error in fetching workbook data:", error);
          throw error;
        }

        // Update the workbook data with the new preprocessing config
        const updatedConfig = {
          ...workbookdata.config,
          preProcessingConfig: result.preProcessingConfig,
        };

        console.log("20. Updating workbook data in Supabase");
        // Update the workbook data in Supabase
        try {
          const { data, error: updateError } = await supa
            .from("workbook_data")
            .update({ config: updatedConfig })
            .eq("id", workbookId)
            .select();

          if (updateError) {
            console.error("21. Error updating workbook data:", updateError);
            throw updateError;
          }

          if (!data || data.length === 0) {
            console.error("21a. No data returned from update operation");
            throw new Error("No data returned from update operation");
          }

          console.log("22. Updated Supabase with new preprocessing config");
        } catch (error) {
          console.error(
            "24. Error in updating or verifying workbook data:",
            error,
          );
          throw error;
        }
        reply
          .header("Content-Type", "application/json; charset=utf-8")
          .send(result);
      } catch (error) {
        console.error("24. Error in /analyze_file:", error);
        if (error instanceof Error) {
          reply
            .status(500)
            .send({ error: "Internal Server Error", message: error.message });
        }
      }
    },
  );

  // POST /preprocess_file
  fastify.post(
    "/preprocess_file",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { taskType, targetColumn, preProcessingConfig, projectId } =
        _request.body as {
          taskType: string;
          targetColumn: string | null;
          preProcessingConfig: any;
          projectId: string;
        };

      try {
        console.log(
          "1. Received preprocessing request for projectId:",
          projectId,
        );

        // Fetch the workbook_id, user_id, and file_url based on the project_id
        let workbookId, userId, fileUrl, fileName;
        try {
          const { data: workbookData, error: workbookError } = await supa
            .from("workbook_data")
            .select("id, created_by, files")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (workbookError) {
            console.error("2. Error fetching workbook data:", workbookError);
            throw workbookError;
          }

          if (
            !workbookData ||
            !workbookData.files ||
            workbookData.files.length === 0
          ) {
            console.error(
              "3. No workbook or file found for the given project_id",
            );
            throw new Error(
              "No workbook or file found for the given project_id",
            );
          }

          workbookId = workbookData.id;
          userId = workbookData.created_by;
          fileUrl = workbookData.files[0].file_url;
          fileName = workbookData.files[0].name;
          console.log(
            "4. Fetched workbookId:",
            workbookId,
            "userId:",
            userId,
            "and fileUrl:",
            fileUrl,
          );
        } catch (error) {
          console.error("5. Error in fetching workbook data:", error);
          throw error;
        }

        // Extract the path from the fileUrl
        const urlParts = new URL(fileUrl);
        let filePath = urlParts.pathname;

        // Remove the '/storage/v1/object/public/' prefix if it exists
        const prefixToRemove = "/storage/v1/object/public/";
        if (filePath.startsWith(prefixToRemove)) {
          filePath = filePath.slice(prefixToRemove.length);
        }

        // Split the remaining path and remove the bucket name
        const pathParts = filePath.split("/");
        const bucketName = pathParts.shift(); // This removes and returns the bucket name
        filePath = pathParts.join("/");

        console.log("6. Extracted bucket name:", bucketName);
        console.log("7. Extracted file path:", filePath);

        // Fetch the file content from Supabase storage
        let fileContent;
        try {
          const { data, error } = await supa.storage
            .from(bucketName!)
            .download(filePath);

          if (error) {
            console.error("8. Supabase storage error:", error);
            throw error;
          }

          if (!data) {
            console.error("9. No data received from Supabase storage");
            throw new Error("No data received from Supabase storage");
          }

          // Convert the file data to text
          fileContent = await data.text();
          console.log("10. File content fetched successfully");
        } catch (error) {
          console.error("11. Error in fetching file content:", error);
          throw error;
        }

        // Create a temporary file
        const tempDir = os.tmpdir();
        let tempFilePath = path.join(tempDir, `temp_${Date.now()}.csv`);
        fs.writeFileSync(tempFilePath, fileContent);

        console.log("11. Temporary file created:", tempFilePath);

        const input = JSON.stringify({
          filePath: tempFilePath,
          taskType,
          targetColumn,
          preProcessingConfig,
        });

        console.log(input);

        // Specify the path to your Python script
        const scriptPath = "../packages/python/preprocessing.py";

        console.log("12. Running Python script");
        // Run the Python script in the sandbox
        const result: any = await new Promise((resolve, reject) => {
          let stdout = "";
          let stderr = "";

          runInPythonSandbox({
            input,
            files: [tempFilePath], // Include the temporary file
            scriptPath,
            onData: (data: string) => {
              stdout += data;
            },
            onError: (error: string) => {
              stderr += error;
            },
            onClose: (code: number) => {
              if (code !== 0) {
                console.error("13. Python script error:", stderr);
                reject(
                  new Error(
                    `Python script exited with code ${code}. Stderr: ${stderr}`,
                  ),
                );
              } else {
                try {
                  const jsonResult = JSON.parse(stdout);
                  console.log("14. Python script executed successfully");
                  resolve(jsonResult);
                } catch (error) {
                  console.error("15. Failed to parse JSON result:", error);
                  reject(
                    new Error(
                      `Failed to parse JSON result. Stdout: ${stdout}, Stderr: ${stderr}`,
                    ),
                  );
                }
              }
            },
          });
        });

        const parsedData = Papa.parse(result.preprocessed_data, {
          header: true,
          skipEmptyLines: true,
        });
        console.log("Parsed data:", parsedData);

        console.log("16. Uploading preprocessed file to storage");
        // Upload the preprocessed file to storage
        const preprocessedFileName = fileName.replace(
          ".csv",
          "_preprocessed.csv",
        );
        const preprocessedFilePath = `${userId}/project-${projectId}/${preprocessedFileName}`;

        try {
          const { error } = await supa.storage
            .from(bucketName!)
            .upload(preprocessedFilePath, result.preprocessed_data, {
              contentType: "text/csv",
              upsert: true,
            });

          if (error) {
            console.error("17. Error uploading preprocessed file:", error);
            throw error;
          }

          console.log("18. Preprocessed file uploaded successfully");

          // Get the public URL of the uploaded file
          const {
            data: { publicUrl },
          } = supa.storage.from(bucketName!).getPublicUrl(preprocessedFilePath);

          console.log("20. Got public URL for preprocessed file:", publicUrl);

          // Parse the first 15 lines of the preprocessed CSV
          const parsedData = Papa.parse(result.preprocessed_data, {
            header: true,
          });
          const previewData = parsedData.data.slice(0, 15);

          // Fetch the current files array
          const { data: currentData, error: fetchError } = await supa
            .from("workbook_data")
            .select("files")
            .eq("id", workbookId)
            .single();

          if (fetchError) {
            console.error("21. Error fetching current files data:", fetchError);
            throw fetchError;
          }

          // Update the files array with the new preprocessed file
          const updatedFiles = [
            ...currentData.files,
            {
              name: preprocessedFileName,
              file_url: publicUrl,
              file_type: "text/csv",
              preprocessed_file: true,
            },
          ];

          // Update the workbook_data with the new file information
          const { data: updateData, error: updateError } = await supa
            .from("workbook_data")
            .update({
              files: updatedFiles,
              preview_data_preprocessed: previewData,
            })
            .eq("id", workbookId)
            .select();

          console.log("21.5 Updated workbook_data with", updateData);

          if (updateError) {
            console.error("22. Error updating workbook data:", updateError);
            throw updateError;
          }

          console.log(
            "23. Workbook data updated with preprocessed file info and preview data",
          );

          reply.header("Content-Type", "application/json; charset=utf-8").send({
            message: "File preprocessed and uploaded successfully",
            preprocessedFileUrl: publicUrl,
            previewDataPreprocessed: previewData,
          });
        } catch (error) {
          console.error(
            "24. Error in uploading preprocessed file or updating workbook data:",
            error,
          );
          throw error;
        }
      } catch (error) {
        console.error("25. Error in /preprocess_file:", error);
        if (error instanceof Error) {
          reply
            .status(500)
            .send({ error: "Internal Server Error", message: error.message });
        }
      }
    },
  );

  // POST /create_model
  fastify.post(
    "/create_model",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { projectId, modelConfig } = _request.body as {
        projectId: string;
        modelConfig: any;
      };

      try {
        console.log(
          "1. Received create_model request for projectId:",
          projectId,
        );

        // Fetch the workbook data
        const { data: workbookData, error: workbookError } = await supa
          .from("workbook_data")
          .select("id, files, config, created_by")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (workbookError) {
          console.error("2. Error fetching workbook data:", workbookError);
          throw workbookError;
        }

        if (
          !workbookData ||
          !workbookData.files ||
          workbookData.files.length === 0
        ) {
          throw new Error("No workbook or file found for the given project_id");
        }

        // Get the preprocessed file if it exists, otherwise use the original file
        const file =
          workbookData.files.find((f: any) => f.preprocessed_file) ||
          workbookData.files[0];

        console.log("File: ", file);
        // Download the file content
        const { data: fileData, error: fileError } = await supa.storage
          .from(file.file_url.split("/")[7])
          .download(file.file_url.split("/").slice(8).join("/"));

        if (fileError) {
          console.error("3. Error downloading file:", fileError);
          throw fileError;
        }

        // Create a temporary file
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `temp_${Date.now()}.csv`);
        fs.writeFileSync(tempFilePath, await fileData.text());

        console.log("4. Temporary file created:", tempFilePath);

        // Prepare input for the Python script
        const taskType = modelConfig.taskType || workbookData.config.taskType;
        const input = JSON.stringify({
          filePath: tempFilePath,
          params: {
            ...modelConfig,
            task: taskType, // Changed from taskType to task to match Python script
            y_column:
              taskType === "clustering"
                ? null
                : modelConfig.targetColumn || workbookData.config.targetColumn,
            X_columns: "all", // Use all columns for features
          },
        });

        console.log("5. Input prepared:", input);

        // Run the Python script
        const scriptPath = "../packages/python/create_model.py";
        console.log("6. Running Python script");

        const result: any = await new Promise((resolve, reject) => {
          let stdout = "";
          let stderr = "";

          runInPythonSandbox({
            input,
            files: [tempFilePath],
            scriptPath,
            onData: (data: string) => {
              stdout += data;
            },
            onError: (error: string) => {
              stderr += error;
            },
            onClose: (code: number) => {
              if (code !== 0) {
                console.error("7. Python script error:", stderr);
                reject(
                  new Error(
                    `Python script exited with code ${code}. Stderr: ${stderr}`,
                  ),
                );
              } else {
                try {
                  const jsonResult = JSON.parse(stdout);
                  console.log("8. Python script executed successfully");
                  if (jsonResult.success) {
                    resolve(jsonResult.results);
                  } else {
                    reject(new Error(jsonResult.error));
                  }
                } catch (error) {
                  console.error("9. Failed to parse JSON result:", error);
                  reject(
                    new Error(
                      `Failed to parse JSON result. Stdout: ${stdout}, Stderr: ${stderr}`,
                    ),
                  );
                }
              }
            },
          });
        });

        // Clean up the temporary CSV file
        fs.unlinkSync(tempFilePath);

        // Create a temporary file for the pickle
        const tempPicklePath = path.join(tempDir, `model_${Date.now()}.pkl`);
        fs.writeFileSync(
          tempPicklePath,
          Buffer.from(result.model_pickle, "base64"),
        );

        console.log("10. Temporary pickle file created:", tempPicklePath);

        // Upload the pickle file to Supabase storage
        const pickleFileName = `model_${workbookData.id}.pkl`;
        const pickleFilePath = `${workbookData.created_by}/project-${projectId}/${pickleFileName}`;

        try {
          const { error: uploadError } = await supa.storage
            .from("workbook-files")
            .upload(pickleFilePath, fs.readFileSync(tempPicklePath), {
              contentType: "application/octet-stream",
              upsert: true,
            });

          if (uploadError) {
            console.error("11. Error uploading pickle file:", uploadError);
            throw uploadError;
          }

          console.log("12. Pickle file uploaded successfully");

          // Get the public URL of the uploaded pickle file
          const {
            data: { publicUrl },
          } = supa.storage.from("workbook-files").getPublicUrl(pickleFilePath);

          console.log("13. Got public URL for pickle file:", publicUrl);

          // Clean up the temporary pickle file
          fs.unlinkSync(tempPicklePath);

          // Update the result object with the model URL
          result.model_url = publicUrl;
          delete result.model_pickle; // Remove the base64 pickle data from the result
        } catch (error) {
          console.error("14. Error in uploading pickle file:", error);
          throw error;
        }

        // Update the workbook data with the model results
        const updatedConfig = {
          ...workbookData.config,
          modelResults: result,
        };

        const { error: updateError } = await supa
          .from("workbook_data")
          .update({ config: updatedConfig })
          .eq("id", workbookData.id);

        if (updateError) {
          console.error("15. Error updating workbook data:", updateError);
          throw updateError;
        }

        console.log("16. Workbook data updated with model results");

        reply
          .header("Content-Type", "application/json; charset=utf-8")
          .send(result);
      } catch (error) {
        console.error("17. Error in /create_model:", error);
        if (error instanceof Error) {
          reply.status(500).send({
            error: "Internal Server Error",
            message: error.message,
            stack: error.stack,
          });
        } else {
          reply.status(500).send({
            error: "Internal Server Error",
            message: "An unknown error occurred",
          });
        }
      }
    },
  );
}

/**
 * @deprecated
 */
function getGenerator(
  framework: CodeGenerationRequestConfig["framework"],
  payload: CodeGenerationRequestConfig["payload"],
): BaseGenerator {
  switch (framework) {
    case "sklearn":
      return new SklearnGenerator(payload);
    case "pytorch":
      return new PyTorchGenerator(payload);
    case "tensorflow":
      return new TensorFlowGenerator(payload);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

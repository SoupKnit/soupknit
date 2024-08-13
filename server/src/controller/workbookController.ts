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

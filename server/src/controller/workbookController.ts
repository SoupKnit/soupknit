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

export default async function workbookController(fastify: FastifyInstance) {
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

  // POST /workbook
  fastify.post(
    "/workbook",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      // validate the request
      // const request = WorkbookSchema.parse(_request.body);
      console.log(_request.body);

      // This is an example
      runInPythonSandbox({
        files: [],
        input: "Here's some input passed from the controller!!!",
      });

      reply.send({ status: "success" });
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

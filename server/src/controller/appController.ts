import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Config, configSchema } from "@soupknit/model/src/codeGeneratorSchemas";
import {
  BaseGenerator,
  GeneratedCode,
} from "../core/codeGeneration/baseGenerator";
import {
  SklearnGenerator,
  PyTorchGenerator,
  TensorFlowGenerator,
} from "../core/codeGeneration/modelGenerator";

export default async function appController(fastify: FastifyInstance) {
  // POST /
  fastify.post(
    "/code_gen",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      // validate the request
      const request = configSchema.parse(_request.body);

      const generator = getGenerator(request.framework, request.payload);
      const response: GeneratedCode = generator.generateCode();

      reply
        .header("Content-Type", "application/json; charset=utf-8")
        .send(response);
    },
  );
}

function getGenerator(
  framework: Config["framework"],
  payload: Config["payload"],
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

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { promises } from "fs";
import { resolve } from "path";

const { readFile } = promises;

export default async function indexController(fastify: FastifyInstance) {
  // POST /
  fastify.post(
    "/code_gen",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const request = _request.body;
      const framework = request.framework;
      const payload = request.data;

      let response;
      switch(framework) {
        case "pytorch":
          response = handle_pytorch(payload);
          break;
        case "sklearn":
          response = handle_sklearn(payload);
          break;
        case "tensorflow":
          response = handle_tensorflow(payload);
          break;
      }

      reply
        .header("Content-Type", "application/json; charset=utf-8")
        .send(response);
    }
  )
}

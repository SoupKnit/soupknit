import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { promises } from "fs";
import { resolve } from "path";

const { readFile } = promises;

export default async function indexController(fastify: FastifyInstance) {
  // GET /
  fastify.get(
    "/",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const indexHtmlPath = resolve(__dirname, "../../static/index.html");
      const indexHtmlContent = await readFile(indexHtmlPath);
      reply
        .header("Content-Type", "text/html; charset=utf-8")
        .send(indexHtmlContent);
    },
  );

  fastify.get(
    "/your_mom",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      reply
        .header("Content-Type", "application/json; charset=utf-8")
        .send({ message: "Your mom is so fat that Thanos had to snap twice." });
    },
  );
}

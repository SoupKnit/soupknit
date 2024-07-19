import { FastifyInstance } from "fastify";
import userController from "./controller/userController";
import indexController from "./controller/indexController";
import appController from "./controller/appController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(indexController, { prefix: "/" });
  fastify.register(userController, { prefix: "/user" });
  fastify.register(appController, { prefix: "/app" });
}

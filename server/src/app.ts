import fastify from "fastify";
import router from "./router";

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

// await fastify.register(cors, {
//   // put your options here
// });

// Middleware: Router
server.register(router);

export default server;

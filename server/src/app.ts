import fastifyJWT from "@fastify/jwt";
import fastify from "fastify";
import router from "./router";

require("dotenv").config();

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_JWT_SECRET) {
  throw new Error("Missing env supabase");
}

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

server.register(fastifyJWT, {
  secret: SUPABASE_JWT_SECRET,
});

// await fastify.register(cors, {
//   // put your options here
// });

server.register(router);

export default server;

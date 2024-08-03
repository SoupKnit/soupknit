import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import userController from "./controller/userController";
import indexController from "./controller/indexController";
import appController from "./controller/appController";

// Middleware to verify JWT
async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    // if we can decode the token, it's sufficient to validate the user/actor performing the request
    await request.jwtVerify();

    /** optionally verify the user with Supabase
     * this is useful when we need to perform operations AS the user
     * in this case Supabase will check the appropriate permissions
     * 
      const supabase = getSupabaseClient();
      console.log("decoded", decoded);
      const decoded = await request.jwtVerify();
      const { data: user, error } = await supabase.auth.getUser(
        decoded.sub?.toString(),
      );
      if (error) {
        throw error;
      } else {
        request.user = user;
      }
    * 
    */
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export default async function router(fastify: FastifyInstance) {
  fastify.addHook("onRequest", verifyJWT);
  fastify.register(indexController, { prefix: "/" });
  fastify.register(userController, { prefix: "/user" });
  fastify.register(appController, { prefix: "/app" });
  // fastify.register(uploadController, { prefix: "/upload" });
}

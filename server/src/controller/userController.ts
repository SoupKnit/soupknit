import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createOrg } from "../core/orgSetup/createOrg";
import { orgSetupRequestSchema } from "@soupknit/model/src/userAndOrgSchemas";

export default async function userController(fastify: FastifyInstance) {
  // GET /api/v1/user
  fastify.get(
    "/",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      reply.send({
        balance: "$3,277.32",
        picture: "http://placehold.it/32x32",
        age: 30,
        name: "Leonor Cross",
        gender: "female",
        company: "GRONK",
        email: "leonorcross@gronk.com",
      });
    },
  );

  /**
   *
   * request {
   *   orgName: string : same as username for now
   * }
   *  */
  fastify.post(
    "/org/setup",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      // validate that the sender is logged in (auth)
      // use supabase service role, to create the org as the server
      // or
      // don't validate anything
      // use JWT to get the user -> execute supabase commands as the user
      const request = orgSetupRequestSchema.safeParse(_request.body);

      if (!request.success) {
        reply.code(400).send(request.error);
        return;
      }
      if (!request.data?.orgId) {
        reply.code(400).send("orgName is required");
        return;
      }
      const { data, error } = await createOrg(request.data.orgName);
      if (error) {
        reply.code(500).send(error.message);
        return;
      }
      reply.send({ message: "Org created successfully" });
    },
  );
}

import { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify } from "jose";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userEmail?: string;
  }
}

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

/**
 * preHandler that verifies the Supabase-issued JWT (HS256, shared secret
 * from the Supabase dashboard) and attaches the authenticated user id.
 * Identity-bearing fields must come from req.userId, never the request
 * body — otherwise any caller could act as any user.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "missing_token" });
  }

  try {
    const { payload } = await jwtVerify(header.slice("Bearer ".length), secret, {
      audience: "authenticated",
    });
    if (typeof payload.sub !== "string") throw new Error("no sub claim");
    req.userId = payload.sub;
    if (typeof payload.email === "string") req.userEmail = payload.email;
  } catch {
    return reply.status(401).send({ error: "invalid_token" });
  }
}

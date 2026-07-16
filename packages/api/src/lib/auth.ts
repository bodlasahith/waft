import { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userEmail?: string;
  }
}

// Supabase signs user tokens with asymmetric keys (ES256); we verify
// against the project's public JWKS endpoint. jose caches the keys and
// refetches automatically when it sees an unknown kid (key rotation).
const jwks = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

/**
 * preHandler that verifies the Supabase-issued JWT and attaches the
 * authenticated user id. Identity-bearing fields must come from
 * req.userId, never the request body — otherwise any caller could act
 * as any user.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "missing_token" });
  }

  try {
    const { payload } = await jwtVerify(header.slice("Bearer ".length), jwks, {
      audience: "authenticated",
    });
    if (typeof payload.sub !== "string") throw new Error("no sub claim");
    req.userId = payload.sub;
    if (typeof payload.email === "string") req.userEmail = payload.email;
  } catch {
    return reply.status(401).send({ error: "invalid_token" });
  }
}

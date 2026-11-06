import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type Authenticator = (request: Request, response: Response, next: NextFunction) => Promise<void>;

export function createAuthenticator(config: NodeJS.ProcessEnv = process.env): Authenticator {
  if (config.DEV_AUTH_BYPASS === "true" && config.NODE_ENV !== "production") {
    return async (request, _response, next) => {
      request.identity = { userId: "local-development-user" };
      next();
    };
  }

  const { ENTRA_AUDIENCE, ENTRA_ISSUER, ENTRA_JWKS_URI } = config;
  if (!ENTRA_AUDIENCE || !ENTRA_ISSUER || !ENTRA_JWKS_URI) {
    return async (_request, response) => {
      response.status(503).json({ error: "Authentication is not configured." });
    };
  }

  const jwks = createRemoteJWKSet(new URL(ENTRA_JWKS_URI));
  return async (request, response, next) => {
    const header = request.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
      response.status(401).json({ error: "Bearer token required." });
      return;
    }
    try {
      const { payload } = await jwtVerify(token, jwks, {
        audience: ENTRA_AUDIENCE,
        issuer: ENTRA_ISSUER
      });
      if (typeof payload.sub !== "string" || payload.sub.length === 0) {
        response.status(401).json({ error: "Token subject is missing." });
        return;
      }
      request.identity = { userId: `${payload.iss}:${payload.sub}` };
      next();
    } catch {
      response.status(401).json({ error: "Invalid bearer token." });
    }
  };
}

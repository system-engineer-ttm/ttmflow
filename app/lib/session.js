import { SignJWT, jwtVerify } from "jose";

const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "ttmflow-dev-secret-change-in-production"
  );

/** Sign a JWT with 8-hour expiry */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

/** Verify a JWT — returns payload or null */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

/** Cookie name used across API routes */
export const SESSION_COOKIE = "ttm_session";

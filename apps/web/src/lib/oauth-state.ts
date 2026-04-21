import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/env";

const secretKey = createHash("sha256")
  .update(env.AUTH_SECRET)
  .digest();

export async function signOAuthState(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);
}

export async function verifyOAuthState<T extends Record<string, unknown>>(
  token: string,
): Promise<T> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload as T;
}

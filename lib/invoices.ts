import { randomBytes } from "crypto";

/**
 * Creates an opaque public invoice token.
 * 32 random bytes = 256 bits of entropy; the token is never derived from
 * an invoice id, user id, email, or other predictable value.
 */
export function makePublicToken() {
  return randomBytes(32).toString("base64url");
}

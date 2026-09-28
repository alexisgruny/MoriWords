import { describe, expect, it } from "vitest";

import { OWNER_COOKIE, isOwnerRequest, isOwnerSecret, ownerCookieValue, requireOwner } from "./owner";

const PROD = { NODE_ENV: "production", OWNER_SECRET: "un-secret-de-test" };

function requestWithCookie(cookie?: string): Request {
  return new Request("http://localhost/api/decks/x", {
    method: "DELETE",
    headers: cookie ? { cookie } : {},
  });
}

describe("owner protection", () => {
  it("allows everything outside production (local dev and tests)", () => {
    expect(isOwnerRequest(requestWithCookie(), { NODE_ENV: "development" })).toBe(true);
  });

  it("denies everyone in production when OWNER_SECRET is not configured", () => {
    expect(isOwnerRequest(requestWithCookie(), { NODE_ENV: "production" })).toBe(false);
  });

  it("denies a production request without the owner cookie", () => {
    expect(isOwnerRequest(requestWithCookie(), PROD)).toBe(false);
    expect(isOwnerRequest(requestWithCookie(`${OWNER_COOKIE}=faux`), PROD)).toBe(false);
  });

  it("allows a production request carrying the signed owner cookie", () => {
    const cookie = `autre=1; ${OWNER_COOKIE}=${ownerCookieValue(PROD.OWNER_SECRET)}`;
    expect(isOwnerRequest(requestWithCookie(cookie), PROD)).toBe(true);
  });

  it("never puts the secret itself in the cookie", () => {
    expect(ownerCookieValue(PROD.OWNER_SECRET)).not.toContain(PROD.OWNER_SECRET);
  });

  it("checks the unlock password", () => {
    expect(isOwnerSecret("un-secret-de-test", PROD)).toBe(true);
    expect(isOwnerSecret("mauvais", PROD)).toBe(false);
    expect(isOwnerSecret("", { NODE_ENV: "production" })).toBe(false);
  });

  it("answers 403 with a clear message when refused", async () => {
    const response = requireOwner(requestWithCookie(), PROD);
    expect(response?.status).toBe(403);
    expect(((await response?.json()) as { error: string }).error).toContain("propriétaire");
    expect(requireOwner(requestWithCookie(), { NODE_ENV: "development" })).toBeNull();
  });
});

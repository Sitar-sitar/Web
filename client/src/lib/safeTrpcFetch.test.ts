import { describe, expect, it } from "vitest";
import { safeTrpcFetch } from "./safeTrpcFetch";

describe("safeTrpcFetch", () => {
  it("HTMLの502応答を利用者向けtRPCエラーへ変換する", async () => {
    const response = await safeTrpcFetch(
      "https://example.test/api/trpc/build.lookup",
      undefined,
      async () => new Response("<!DOCTYPE html><title>Bad Gateway</title>", { status: 502, headers: { "content-type": "text/html" } }),
    );

    expect(response.headers.get("content-type")).toContain("application/json");
    const body = await response.json() as Array<{ error: { json: { message: string; data: { httpStatus: number } } } }>;
    expect(body[0]?.error.json.message).toContain("一時的に応答していません");
    expect(body[0]?.error.json.data.httpStatus).toBe(502);
  });
});

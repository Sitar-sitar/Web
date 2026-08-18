type FetchImplementation = typeof fetch;

function trpcErrorResponse(message: string, httpStatus: number): Response {
  return new Response(JSON.stringify([{
    error: {
      json: {
        message,
        code: -32603,
        data: {
          code: "INTERNAL_SERVER_ERROR",
          httpStatus,
          path: "build.lookup",
        },
      },
    },
  }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/**
 * The edge can return an HTML 5xx page before tRPC receives the request.
 * Convert that response into the tRPC error envelope so React Query exposes a
 * readable message rather than a JSON parse exception.
 */
export async function safeTrpcFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  implementation: FetchImplementation = fetch,
): Promise<Response> {
  try {
    const response = await implementation(input, { ...(init ?? {}), credentials: "include" });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) return response;

    const status = response.status || 502;
    const message = status >= 500
      ? "照会サービスが一時的に応答していません。1〜2分後にもう一度お試しください。"
      : "照会リクエストを処理できませんでした。UIDと公開設定をご確認ください。";
    return trpcErrorResponse(message, status);
  } catch {
    return trpcErrorResponse("照会サービスへ接続できませんでした。通信環境を確認して再試行してください。", 502);
  }
}

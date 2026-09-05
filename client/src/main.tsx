import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import {
  consumeAdminExchangeCodeFromLocation,
  getAdminBearerToken,
  setAdminBearerToken,
} from "./lib/adminSession";
import { safeTrpcFetch } from "./lib/safeTrpcFetch";
import "./index.css";

const queryClient = new QueryClient();
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const trpcUrl = `${apiBaseUrl}/api/trpc`;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      headers() {
        // Safari/ITP fallback: the GitHub callback provides a one-time exchange
        // code in the URL fragment. It is exchanged for a short-lived Bearer
        // token before React renders, so cross-site cookies are not required.
        const adminToken = getAdminBearerToken();
        if (adminToken) return { Authorization: `Bearer ${adminToken}` };

        // Keep the legacy preview fallback for non-production Manus runtimes.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return safeTrpcFetch(input, init);
      },
    }),
  ],
});

async function bootstrapAdminSession() {
  const exchangeCode = consumeAdminExchangeCodeFromLocation();
  if (!exchangeCode) return;

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/github/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: exchangeCode }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Admin session exchange failed: ${response.status}`);
    }

    const payload = await response.json() as { token?: string };
    if (!payload.token) throw new Error("Admin session exchange returned no token");
    setAdminBearerToken(payload.token);
  } catch (error) {
    console.error("[Admin Auth] Failed to exchange one-time code", error);
  }
}

async function bootstrap() {
  await bootstrapAdminSession();

  createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

void bootstrap();

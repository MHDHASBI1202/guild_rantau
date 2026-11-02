import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    try {
      const url = new URL(request.url);
      const decodedPath = decodeURIComponent(url.pathname).trim().toLowerCase();

      // Gracefully redirect legacy or external sign-in URLs (including spaces/hyphens) to /masuk
      if (
        decodedPath === '/signin' ||
        decodedPath === '/login' ||
        decodedPath === '/sign-in' ||
        decodedPath === '/signin with chatgpt' ||
        decodedPath === '/signin-with-chatgpt' ||
        decodedPath.startsWith('/signin') ||
        decodedPath.startsWith('/login')
      ) {
        if (decodedPath !== '/masuk') {
          const returnTo = url.searchParams.get('return_to') || '/';
          const target = new URL('/masuk', request.url);
          target.searchParams.set('return_to', returnTo);
          return Response.redirect(target, 302);
        }
      }

      if (
        decodedPath === '/signout with chatgpt' ||
        decodedPath === '/signout-with-chatgpt' ||
        decodedPath === '/signout' ||
        decodedPath === '/logout' ||
        decodedPath === '/keluar'
      ) {
        const returnTo = url.searchParams.get('return_to') || '/';
        const target = new URL('/api/auth/logout', request.url);
        target.searchParams.set('return_to', returnTo);
        return Response.redirect(target, 302);
      }
    } catch {}

    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;

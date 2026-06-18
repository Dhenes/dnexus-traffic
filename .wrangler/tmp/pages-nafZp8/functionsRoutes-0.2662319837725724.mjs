import { onRequestGet as __api_credentials_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\credentials.ts"
import { onRequestPost as __api_credentials_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\credentials.ts"
import { onRequestGet as __api_metrics_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\metrics.ts"
import { onRequestPost as __api_sync_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\sync.ts"

export const routes = [
    {
      routePath: "/api/credentials",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_credentials_ts_onRequestGet],
    },
  {
      routePath: "/api/credentials",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_credentials_ts_onRequestPost],
    },
  {
      routePath: "/api/metrics",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_metrics_ts_onRequestGet],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_ts_onRequestPost],
    },
  ]
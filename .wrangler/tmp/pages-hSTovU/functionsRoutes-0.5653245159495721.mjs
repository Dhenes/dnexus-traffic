import { onRequestPost as __api_auth_login_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\auth\\login.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\auth\\me.ts"
import { onRequestDelete as __api_clients_ts_onRequestDelete } from "E:\\Codex\\003 - Dnexus\\functions\\api\\clients.ts"
import { onRequestGet as __api_clients_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\clients.ts"
import { onRequestPost as __api_clients_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\clients.ts"
import { onRequestPut as __api_clients_ts_onRequestPut } from "E:\\Codex\\003 - Dnexus\\functions\\api\\clients.ts"
import { onRequestGet as __api_credentials_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\credentials.ts"
import { onRequestPost as __api_credentials_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\credentials.ts"
import { onRequestGet as __api_metrics_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\metrics.ts"
import { onRequestPost as __api_sync_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\sync.ts"
import { onRequestDelete as __api_users_ts_onRequestDelete } from "E:\\Codex\\003 - Dnexus\\functions\\api\\users.ts"
import { onRequestGet as __api_users_ts_onRequestGet } from "E:\\Codex\\003 - Dnexus\\functions\\api\\users.ts"
import { onRequestPost as __api_users_ts_onRequestPost } from "E:\\Codex\\003 - Dnexus\\functions\\api\\users.ts"
import { onRequestPut as __api_users_ts_onRequestPut } from "E:\\Codex\\003 - Dnexus\\functions\\api\\users.ts"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_ts_onRequestGet],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_clients_ts_onRequestDelete],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_clients_ts_onRequestGet],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_clients_ts_onRequestPost],
    },
  {
      routePath: "/api/clients",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_clients_ts_onRequestPut],
    },
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
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_users_ts_onRequestDelete],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_users_ts_onRequestGet],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_users_ts_onRequestPost],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_users_ts_onRequestPut],
    },
  ]
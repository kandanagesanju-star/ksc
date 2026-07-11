import { onRequestGet as __api_admin_ts_onRequestGet } from "C:\\Users\\KSC\\Desktop\\agon-agent\\functions\\api\\admin.ts"
import { onRequestOptions as __api_admin_ts_onRequestOptions } from "C:\\Users\\KSC\\Desktop\\agon-agent\\functions\\api\\admin.ts"
import { onRequestPost as __api_admin_ts_onRequestPost } from "C:\\Users\\KSC\\Desktop\\agon-agent\\functions\\api\\admin.ts"
import { onRequestGet as __api_sync_ts_onRequestGet } from "C:\\Users\\KSC\\Desktop\\agon-agent\\functions\\api\\sync.ts"
import { onRequestOptions as __api_sync_ts_onRequestOptions } from "C:\\Users\\KSC\\Desktop\\agon-agent\\functions\\api\\sync.ts"
import { onRequestPost as __api_sync_ts_onRequestPost } from "C:\\Users\\KSC\\Desktop\\agon-agent\\functions\\api\\sync.ts"

export const routes = [
    {
      routePath: "/api/admin",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_ts_onRequestGet],
    },
  {
      routePath: "/api/admin",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_admin_ts_onRequestOptions],
    },
  {
      routePath: "/api/admin",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_ts_onRequestPost],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_sync_ts_onRequestGet],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_sync_ts_onRequestOptions],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_ts_onRequestPost],
    },
  ]
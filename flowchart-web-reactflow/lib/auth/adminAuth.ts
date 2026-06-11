import { isAdminRole } from "./roles";
import { getAuthState } from "./session";

import type { AuthContext } from "./types";

/** 管理者専用 Server Action / ページの入口（M-3 SSOT） */
export async function requireAdmin(): Promise<AuthContext> {
  const state = await getAuthState();
  if (state.kind !== "allowed") {
    throw new Error("認証が必要です");
  }
  if (!isAdminRole(state.context.role)) {
    throw new Error("管理者権限がありません");
  }
  return state.context;
}

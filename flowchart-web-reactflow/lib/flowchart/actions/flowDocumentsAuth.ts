import { canEditFlowchart } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/session";

export async function requireEditor() {
  const state = await getAuthState();
  if (state.kind === "disabled") return state.context;
  if (state.kind !== "allowed") {
    throw new Error("認証が必要です");
  }
  if (!canEditFlowchart(state.context.role)) {
    throw new Error("編集権限がありません");
  }
  return state.context;
}

export async function requireViewerOrEditor() {
  const state = await getAuthState();
  if (state.kind === "disabled") return state.context;
  if (state.kind !== "allowed") {
    throw new Error("認証が必要です");
  }
  return state.context;
}

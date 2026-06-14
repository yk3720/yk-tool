import { isAdminRole } from "@/lib/auth/roles";
import type { ProfileRole } from "@/lib/auth/types";

export type FlowResetTarget = {
  /** flow_documents 行が存在するか */
  hasFlow: boolean;
  /** flow_documents.created_by — サーバー内部のみ */
  createdBy?: string;
};

/** admin · フロー作成者（flow_documents.created_by） */
export function canResetFlowContent(
  role: ProfileRole,
  userId: string | undefined,
  flow: FlowResetTarget
): boolean {
  if (!flow.hasFlow || !userId || role === "viewer") return false;
  if (isAdminRole(role)) return true;
  return flow.createdBy === userId;
}

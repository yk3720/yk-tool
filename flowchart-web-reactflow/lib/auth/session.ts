import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AuthContext, ProfileRole } from "./types";

function isProfileRole(value: string): value is ProfileRole {
  return value === "editor" || value === "viewer";
}

export type AuthState =
  | { kind: "disabled"; context: AuthContext }
  | { kind: "guest" }
  | { kind: "pending"; email: string }
  | { kind: "allowed"; context: AuthContext };

const DEV_CONTEXT: AuthContext = {
  userId: "dev-local",
  email: "dev@local",
  role: "editor",
};

export async function getAuthState(): Promise<AuthState> {
  if (isAuthDisabled()) {
    return { kind: "disabled", context: DEV_CONTEXT };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { kind: "guest" };
  }

  const email = user.email.toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, role, user_id")
    .eq("email", email)
    .maybeSingle();

  if (profileError || !profile || !isProfileRole(profile.role)) {
    return { kind: "pending", email };
  }

  if (profile.user_id !== user.id) {
    await supabase
      .from("profiles")
      .update({ user_id: user.id })
      .eq("email", email);
  }

  return {
    kind: "allowed",
    context: {
      userId: user.id,
      email,
      role: profile.role,
    },
  };
}

/** @deprecated getAuthState を優先 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const state = await getAuthState();
  if (state.kind === "allowed") return state.context;
  if (state.kind === "disabled") return state.context;
  return null;
}

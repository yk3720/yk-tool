import { redirect } from "next/navigation";

import { FlowchartWorkspace } from "@/components/flowchart/FlowchartWorkspace";
import { getAuthState } from "@/lib/auth/session";

export default async function HomePage() {
  const state = await getAuthState();

  if (state.kind === "guest") {
    redirect("/login");
  }
  if (state.kind === "pending") {
    redirect("/login/no-access");
  }

  const context =
    state.kind === "allowed"
      ? state.context
      : state.kind === "disabled"
        ? state.context
        : null;

  if (!context) {
    redirect("/login");
  }

  return (
    <FlowchartWorkspace
      role={context.role}
      email={context.email}
      authDisabled={state.kind === "disabled"}
    />
  );
}

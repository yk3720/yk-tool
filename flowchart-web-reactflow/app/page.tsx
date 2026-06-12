import { redirect } from "next/navigation";

import { getAuthState } from "@/lib/auth/session";
import { FlowchartWorkspace } from "@/components/flowchart/FlowchartWorkspace";
import { fetchDeviceHierarchy } from "@/lib/flowchart/actions/deviceHierarchy";
import { DEMO_DEVICES } from "@/lib/flowchart/moduleHierarchy";

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

  let devices = DEMO_DEVICES;
  if (state.kind === "allowed") {
    const hierarchy = await fetchDeviceHierarchy();
    if (hierarchy.ok) {
      devices = hierarchy.devices;
    }
  }

  return (
    <FlowchartWorkspace
      role={context.role}
      email={context.email}
      userId={state.kind === "allowed" ? context.userId : undefined}
      authDisabled={state.kind === "disabled"}
      devices={devices}
    />
  );
}

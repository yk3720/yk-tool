import type { Metadata } from "next";

import { DiagramWorkspace } from "@/components/diagram-manager/DiagramWorkspace";

export const metadata: Metadata = {
  title: "図解管理",
  description: "surge.sh に公開した図解を探して見返すワークスペース",
};

export default function DiagramManagerPage() {
  return <DiagramWorkspace />;
}

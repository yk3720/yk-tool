import { notFound } from "next/navigation";

import { StyleGuideClient } from "./StyleGuideClient";

/** 開発時のみ — 操作 UI の見本（docs/design-system.md Phase 2） */
export default function DevStylePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <StyleGuideClient />;
}

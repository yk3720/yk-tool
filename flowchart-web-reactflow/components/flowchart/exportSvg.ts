import { toSvg } from "html-to-image";

import { shouldIncludeInFlowExport } from "./exportImageFilter";

export async function captureFlowSvg(
  element: HTMLElement,
  filename = "flowchart.svg"
): Promise<void> {
  const viewport = element.querySelector(
    ".react-flow__viewport"
  ) as HTMLElement | null;
  const target = viewport ?? element;

  const svg = await toSvg(target, {
    cacheBust: true,
    filter: shouldIncludeInFlowExport,
  });

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

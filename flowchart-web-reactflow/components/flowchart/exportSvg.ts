import { toSvg } from "html-to-image";

export async function captureFlowSvg(
  element: HTMLElement,
  filename = "flowchart.svg",
): Promise<void> {
  const viewport = element.querySelector(
    ".react-flow__viewport",
  ) as HTMLElement | null;
  const target = viewport ?? element;

  const svg = await toSvg(target, {
    cacheBust: true,
    filter: (node) => {
      if (
        node instanceof HTMLElement &&
        node.classList?.contains("react-flow__controls")
      ) {
        return false;
      }
      return true;
    },
  });

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

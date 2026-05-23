import { toPng } from "html-to-image";

export async function captureFlowPng(
  element: HTMLElement,
  filename = "flowchart.png",
): Promise<void> {
  const viewport = element.querySelector(".react-flow__viewport") as HTMLElement | null;
  const target = viewport ?? element;

  const png = await toPng(target, {
    cacheBust: true,
    pixelRatio: 2,
    style: {
      transform: "translate(0px, 0px) scale(1)",
    },
    filter: (node) => {
      if (node instanceof HTMLElement && node.classList?.contains("react-flow__controls")) {
        return false;
      }
      return true;
    },
  });

  const a = document.createElement("a");
  a.href = png;
  a.download = filename;
  a.click();
}

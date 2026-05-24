"use client";

import mermaid from "mermaid";
import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";

export type MermaidPreviewHandle = {
  getSvgElement: () => SVGSVGElement | null;
};

type MermaidPreviewProps = {
  source: string;
  previewRef?: React.Ref<MermaidPreviewHandle>;
};

let mermaidInitialized = false;

function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    flowchart: { htmlLabels: true, curve: "basis" },
  });
  mermaidInitialized = true;
}

export function MermaidPreview({ source, previewRef }: MermaidPreviewProps) {
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(
    previewRef,
    () => ({
      getSvgElement: () =>
        containerRef.current?.querySelector("svg") ?? null,
    }),
    [source, error],
  );

  useEffect(() => {
    if (!source.trim()) {
      if (containerRef.current) containerRef.current.innerHTML = "";
      setError(null);
      return;
    }

    let cancelled = false;
    const renderId = `mmd-${reactId}-${Date.now()}`;

    void (async () => {
      try {
        ensureMermaidInit();
        const { svg } = await mermaid.render(renderId, source);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          if (containerRef.current) containerRef.current.innerHTML = "";
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Mermaid 描画エラー: {error}
      </div>
    );
  }

  return (
    <div
      data-flowchart-export-root
      className="min-h-[420px] w-full overflow-auto rounded-lg border border-slate-200 bg-white p-4"
    >
      <div
        ref={containerRef}
        className="mermaid flex justify-center [&>svg]:max-w-full"
      />
    </div>
  );
}

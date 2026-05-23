"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LayoutGrid,
  Terminal,
} from "lucide-react";

import { type Figure } from "@/data/figures";
import { diagramFeatures } from "@/lib/diagram/features";
import { buildSurgeCommands } from "@/lib/diagram/surge-commands";
import {
  getCategoryLabel,
  getSeriesMembers,
  hasSeriesData,
} from "@/lib/diagram/series";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type DiagramDetailPaneProps = {
  figure: Figure | null;
  allFigures: Figure[];
  categoryLabel: string;
  topicLabel?: string | null;
  selectedFigureId: string | null;
  onSelectFigure: (id: string) => void;
};

export function DiagramDetailPane({
  figure,
  allFigures,
  categoryLabel,
  topicLabel,
  selectedFigureId,
  onSelectFigure,
}: DiagramDetailPaneProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedTeardown, setCopiedTeardown] = useState(false);
  const [copiedRename, setCopiedRename] = useState(false);
  const [surgeOpen, setSurgeOpen] = useState(!diagramFeatures.surgeCommandsCollapsedDefault);

  const seriesMembers = useMemo(() => {
    if (
      figure === null ||
      !diagramFeatures.seriesRelatedPane ||
      !hasSeriesData(allFigures) ||
      figure.seriesId === undefined
    ) {
      return [];
    }
    return getSeriesMembers(figure.seriesId, allFigures);
  }, [figure, allFigures]);

  if (!figure) {
    return (
      <aside className="flex w-80 shrink-0 flex-col items-center justify-center gap-3 border-l border-border bg-background py-16 text-muted-foreground">
        <LayoutGrid className="size-10 opacity-30" />
        <p className="text-sm">{"\u30ab\u30fc\u30c9\u3092\u9078\u629e\u3059\u308b\u3068\u8a73\u7d30\u304c\u8868\u793a\u3055\u308c\u307e\u3059"}</p>
      </aside>
    );
  }

  const commands = buildSurgeCommands(figure.url);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(figure.url).catch(() => {});
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  const handleCopyTeardown = () => {
    navigator.clipboard.writeText(commands.teardown).catch(() => {});
    setCopiedTeardown(true);
    setTimeout(() => setCopiedTeardown(false), 1500);
  };

  const handleCopyRename = () => {
    navigator.clipboard.writeText(commands.rename).catch(() => {});
    setCopiedRename(true);
    setTimeout(() => setCopiedRename(false), 1500);
  };

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-background">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-base font-semibold text-foreground">{figure.title}</h3>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-4">
        <dl className="flex flex-col gap-4">
          <DetailRow label={"\u30c4\u30fc\u30eb\u7a2e\u5225"}>
            <p className="text-sm text-foreground">{categoryLabel}</p>
          </DetailRow>

          {topicLabel ? (
            <DetailRow label={"\u30c8\u30d4\u30c3\u30af"}>
              <p className="text-sm text-foreground">{topicLabel}</p>
            </DetailRow>
          ) : null}

          <DetailRow label={"\u30bf\u30b0"}>
            <ul className="flex flex-wrap gap-1">
              {figure.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          </DetailRow>

          <DetailRow label={"\u516c\u958b\u65e5"}>
            <p className="text-sm text-muted-foreground">{figure.publishedAt}</p>
          </DetailRow>

          <DetailRow label={"\u30e1\u30e2"}>
            <p className="text-sm text-muted-foreground">{figure.memo}</p>
            {!diagramFeatures.memoEdit && (
              <p className="mt-1 text-xs text-muted-foreground/60">
                {"\u203b \u73fe\u6642\u70b9\u3067\u306f\u7de8\u96c6\u30fb\u4fdd\u5b58\u3067\u304d\u307e\u305b\u3093"}
              </p>
            )}
          </DetailRow>
        </dl>

        {seriesMembers.length > 1 ? (
          <section className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <h4 className="text-xs font-medium text-muted-foreground">
              {"\u540c\u3058\u984c\u6750\u306e\u56f3\u89e3"}
            </h4>
            <ul className="flex flex-col gap-1">
              {seriesMembers.map((member) => {
                const isActive = member.id === selectedFigureId;
                const memberCategoryLabel = getCategoryLabel(member.categoryId);
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 rounded-md border px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                        isActive ? "border-primary bg-muted/50" : "border-border"
                      }`}
                      onClick={() => onSelectFigure(member.id)}
                    >
                      <span className="line-clamp-2 font-medium leading-snug">{member.title}</span>
                      <span className="text-xs text-muted-foreground">{memberCategoryLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <footer className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
          <Button
            className="w-full gap-2"
            nativeButton={false}
            render={
              <a href={figure.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                {"\u56f3\u89e3\u3092\u958b\u304f"}
              </a>
            }
          />
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopyUrl}>
            {copiedUrl ? (
              <>
                <Check className="size-3.5 text-green-600" />
                {"URL\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f"}
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                {"URL\u3092\u30b3\u30d4\u30fc"}
              </>
            )}
          </Button>
        </footer>

        {diagramFeatures.surgeCommands && (
          <Collapsible open={surgeOpen} onOpenChange={setSurgeOpen} className="mt-4">
            <CollapsibleTrigger
              nativeButton={false}
              render={
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="size-3.5" />
                    {"surge \u7ba1\u7406"}
                  </span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${surgeOpen ? "rotate-180" : ""}`}
                  />
                </button>
              }
            />
            <CollapsibleContent className="pt-3">
              <section className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {
                    "surge.sh \u306e\u64cd\u4f5c\u30b3\u30de\u30f3\u30c9\u3067\u3059\u3002\u30b3\u30d4\u30fc\u3057\u3066\u30bf\u30fc\u30df\u30ca\u30eb\u3067\u5b9f\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002"
                  }
                </p>

                <CommandBlock
                  label={"\u524a\u9664\uff08teardown\uff09"}
                  command={commands.teardown}
                  onCopy={handleCopyTeardown}
                  copied={copiedTeardown}
                />

                <CommandBlock
                  label={"\u30ea\u30cd\u30fc\u30e0\uff08\u518d\u30c7\u30d7\u30ed\u30a4\uff09"}
                  command={commands.rename}
                  onCopy={handleCopyRename}
                  copied={copiedRename}
                />

                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {
                    "\u3053\u306e\u30b3\u30de\u30f3\u30c9\u306f surge.sh \u306e\u30c7\u30d7\u30ed\u30a4\u3092\u64cd\u4f5c\u3057\u307e\u3059\u3002\u5b9f\u884c\u5f8c\u3001\u4e00\u89a7\u304b\u3089\u524a\u9664\u3059\u308b\u5834\u5408\u306f\u30ab\u30fc\u30c9\u524a\u9664\uff08\u4eca\u5f8c\u5bfe\u5fdc\uff09\u3092\u4f7f\u3063\u3066\u304f\u3060\u3055\u3044\u3002"
                  }
                </p>
              </section>
            </CollapsibleContent>
          </Collapsible>
        )}
      </section>
    </aside>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function CommandBlock({
  label,
  command,
  onCopy,
  copied,
}: {
  label: string;
  command: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1.5">
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{command}</code>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label={"\u30b3\u30de\u30f3\u30c9\u3092\u30b3\u30d4\u30fc"}
          onClick={onCopy}
        >
          {copied ? (
            <Check className="size-3.5 text-green-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

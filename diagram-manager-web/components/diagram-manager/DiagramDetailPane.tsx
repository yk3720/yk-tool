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
  onSaveMemo?: (id: string, memo: string) => Promise<void>;
};

export function DiagramDetailPane({
  figure,
  allFigures,
  categoryLabel,
  topicLabel,
  selectedFigureId,
  onSelectFigure,
  onSaveMemo,
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
        <p className="text-sm">カードを選択すると詳細が表示されます</p>
      </aside>
    );
  }

  const commands = buildSurgeCommands(figure.url);
  const canEditMemo = diagramFeatures.memoEdit && Boolean(onSaveMemo);

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
          <DetailRow label="ツール種別">
            <p className="text-sm text-foreground">{categoryLabel}</p>
          </DetailRow>

          {topicLabel ? (
            <DetailRow label="トピック">
              <p className="text-sm text-foreground">{topicLabel}</p>
            </DetailRow>
          ) : null}

          <DetailRow label="タグ">
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

          <DetailRow label="公開日">
            <p className="text-sm text-muted-foreground">{figure.publishedAt}</p>
          </DetailRow>

          <DetailRow label="メモ">
            {canEditMemo && onSaveMemo ? (
              <MemoEditor
                key={figure.id}
                figureId={figure.id}
                initialMemo={figure.memo}
                onSave={onSaveMemo}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{figure.memo}</p>
                {!diagramFeatures.memoEdit ? (
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    ※ 現時点では編集・保存できません
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    ※ Neon（DATABASE_URL）未設定のため閲覧のみです
                  </p>
                )}
              </>
            )}
          </DetailRow>
        </dl>

        {seriesMembers.length > 1 ? (
          <section className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <h4 className="text-xs font-medium text-muted-foreground">同じ題材の図解</h4>
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
                図解を開く
              </a>
            }
          />
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopyUrl}>
            {copiedUrl ? (
              <>
                <Check className="size-3.5 text-green-600" />
                URLをコピーしました
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                URLをコピー
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
                    surge 管理
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
                  surge.sh の操作コマンドです。コピーしてターミナルで実行してください。
                </p>

                <CommandBlock
                  label="削除（teardown）"
                  command={commands.teardown}
                  onCopy={handleCopyTeardown}
                  copied={copiedTeardown}
                />

                <CommandBlock
                  label="リネーム（再デプロイ）"
                  command={commands.rename}
                  onCopy={handleCopyRename}
                  copied={copiedRename}
                />

                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  このコマンドは surge.sh のデプロイを操作します。実行後、一覧から削除する場合はカード削除（今後対応）を使ってください。
                </p>
              </section>
            </CollapsibleContent>
          </Collapsible>
        )}
      </section>
    </aside>
  );
}

function MemoEditor({
  figureId,
  initialMemo,
  onSave,
}: {
  figureId: string;
  initialMemo: string;
  onSave: (id: string, memo: string) => Promise<void>;
}) {
  const [draftMemo, setDraftMemo] = useState(initialMemo);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = draftMemo !== initialMemo;

  const handleSave = async () => {
    setStatus("saving");
    setError(null);
    try {
      await onSave(figureId, draftMemo);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        value={draftMemo}
        onChange={(event) => {
          setDraftMemo(event.target.value);
          if (status !== "idle") {
            setStatus("idle");
            setError(null);
          }
        }}
        aria-label="メモ"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!dirty || status === "saving"} onClick={handleSave}>
          {status === "saving" ? "保存中…" : "メモを保存"}
        </Button>
        {status === "saved" ? (
          <span className="text-xs text-green-700">保存しました</span>
        ) : null}
        {status === "error" && error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Neon に保存します。リロード後も残ります。</p>
    </div>
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
          aria-label="コマンドをコピー"
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

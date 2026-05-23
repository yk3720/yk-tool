"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  LayoutGrid,
  Search,
  X,
} from "lucide-react";

import { DiagramCardMenu } from "@/components/diagram-manager/DiagramCardMenu";
import { type Figure } from "@/data/figures";
import { diagramFeatures } from "@/lib/diagram/features";
import { collectTags, filterFigures } from "@/lib/diagram/search";
import {
  AUDIENCE_LABELS,
  getCategoryLabel,
  getSeriesSiblings,
  hasSeriesData,
} from "@/lib/diagram/series";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DiagramCardPaneProps = {
  figures: Figure[];
  allFigures: Figure[];
  selectedFigureId: string | null;
  onSelectFigure: (id: string) => void;
  onSelectRelatedFigure: (id: string) => void;
  categoryLabel: string;
  topicLabel?: string | null;
  onDeleteFigure?: (id: string) => void;
};

export function DiagramCardPane({
  figures,
  allFigures,
  selectedFigureId,
  onSelectFigure,
  onSelectRelatedFigure,
  categoryLabel,
  topicLabel,
  onDeleteFigure,
}: DiagramCardPaneProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allTags = useMemo(() => collectTags(figures), [figures]);

  const filtered = useMemo(
    () => filterFigures({ figures, query: searchQuery, tag: activeTag }),
    [figures, searchQuery, activeTag],
  );

  const relatedFigures = useMemo(() => {
    if (!diagramFeatures.seriesRelatedPane || !hasSeriesData(allFigures)) {
      return [];
    }
    return getSeriesSiblings(filtered, allFigures);
  }, [filtered, allFigures]);

  const isFiltering = searchQuery !== "" || activeTag !== null;

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveTag(null);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-sm"
            placeholder={"\u30bf\u30a4\u30c8\u30eb\u30fb\u30bf\u30b0\u30fb\u30e1\u30e2\u3067\u691c\u7d22\u2026"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
              aria-label={"\u691c\u7d22\u3092\u30af\u30ea\u30a2"}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        {allTags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <li key={tag}>
                <Badge
                  variant={activeTag === tag ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {activeTag === tag ? <X className="mr-0.5 size-2.5" /> : null}
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
        {isFiltering ? (
          <p className="text-xs text-muted-foreground">
            {activeTag ? <span>{"\u30bf\u30b0\u300c"}{activeTag}{"\u300d"}</span> : null}
            {activeTag && searchQuery ? <span>{"\u30fb"}</span> : null}
            {searchQuery ? (
              <span>
                {"\u30ad\u30fc\u30ef\u30fc\u30c9\u300c"}
                {searchQuery}
                {"\u300d"}
              </span>
            ) : null}
            {"\u3067\u7d5e\u308a\u8fbc\u307f\u4e2d"}
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <LayoutGrid className="size-10 opacity-30" />
            {figures.length === 0 ? (
              <p className="text-sm">
                {categoryLabel}
                {" \u306b\u306f\u307e\u3060\u56f3\u89e3\u304c\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u305b\u3093"}
              </p>
            ) : (
              <>
                <p className="text-sm">{"\u6761\u4ef6\u306b\u4e00\u81f4\u3059\u308b\u56f3\u89e3\u304c\u3042\u308a\u307e\u305b\u3093"}</p>
                <div className="flex flex-col items-center gap-1 text-xs">
                  <span>{"\u9069\u7528\u4e2d\u306e\u6761\u4ef6:"}</span>
                  <span>
                    {"\u7a2e\u5225: "}
                    {categoryLabel}
                  </span>
                  {topicLabel ? <span>{"\u30c8\u30d4\u30c3\u30af: "}{topicLabel}</span> : null}
                  {activeTag ? <span>{"\u30bf\u30b0: "}{activeTag}</span> : null}
                  {searchQuery ? (
                    <span>
                      {"\u30ad\u30fc\u30ef\u30fc\u30c9: "}
                      {searchQuery}
                    </span>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  {"\u7d5e\u308a\u8fbc\u307f\u3092\u30ea\u30bb\u30c3\u30c8"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                {"\u3053\u306e\u68da\u306e\u56f3\u89e3"}
              </h3>
              <ul className="grid grid-cols-2 gap-3">
                {filtered.map((figure) => (
                  <li key={figure.id}>
                    <DiagramCardItem
                      figure={figure}
                      isSelected={figure.id === selectedFigureId}
                      isCopied={copiedId === figure.id}
                      onSelect={() => onSelectFigure(figure.id)}
                      onCopy={() => handleCopy(figure.url, figure.id)}
                      onDelete={() => onDeleteFigure?.(figure.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>

            {relatedFigures.length > 0 ? (
              <section>
                <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                  {"\u540c\u3058\u984c\u6750\u306e\u4ed6\u30d0\u30fc\u30b8\u30e7\u30f3"}
                </h3>
                <ul className="flex flex-col gap-2">
                  {relatedFigures.map((figure) => (
                    <li key={figure.id}>
                      <SeriesRelatedCardItem
                        figure={figure}
                        isSelected={figure.id === selectedFigureId}
                        isCopied={copiedId === figure.id}
                        onSelect={() => onSelectRelatedFigure(figure.id)}
                        onCopy={() => handleCopy(figure.url, figure.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {filtered.length} {"\u4ef6"}
        {isFiltering ? ` / \u5168 ${figures.length} \u4ef6` : null}
      </footer>
    </section>
  );
}

type DiagramCardItemProps = {
  figure: Figure;
  isSelected: boolean;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onDelete?: () => void;
};

function DiagramCardItem({
  figure,
  isSelected,
  isCopied,
  onSelect,
  onCopy,
  onDelete,
}: DiagramCardItemProps) {
  const displayTags = figure.tags.slice(0, 3);

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3 pb-1">
        <p className="line-clamp-2 flex-1 text-base font-medium leading-snug">{figure.title}</p>
        <DiagramCardMenu onDelete={onDelete} />
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-3 pt-1">
        <div className="flex flex-wrap items-center gap-1">
          {displayTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{figure.publishedAt}</span>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={"\u65b0\u3057\u3044\u30bf\u30d6\u3067\u958b\u304f"}
                  nativeButton={false}
                  render={
                    <a href={figure.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                    </a>
                  }
                />
              }
            />
            <TooltipContent>{figure.url}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={"URL\u3092\u30b3\u30d4\u30fc"}
                  onClick={onCopy}
                >
                  {isCopied ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              }
            />
            <TooltipContent>{"URL\u3092\u30b3\u30d4\u30fc"}</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

type SeriesRelatedCardItemProps = {
  figure: Figure;
  isSelected: boolean;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: () => void;
};

function SeriesRelatedCardItem({
  figure,
  isSelected,
  isCopied,
  onSelect,
  onCopy,
}: SeriesRelatedCardItemProps) {
  const categoryLabel = getCategoryLabel(figure.categoryId);
  const audienceLabel = figure.audience ? AUDIENCE_LABELS[figure.audience] : null;

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="flex flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{figure.title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {categoryLabel}
          </Badge>
          {audienceLabel ? (
            <Badge variant="secondary" className="text-xs">
              {audienceLabel}
            </Badge>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground">{figure.publishedAt}</span>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={"\u65b0\u3057\u3044\u30bf\u30d6\u3067\u958b\u304f"}
                  nativeButton={false}
                  render={
                    <a href={figure.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                    </a>
                  }
                />
              }
            />
            <TooltipContent>{figure.url}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={"URL\u3092\u30b3\u30d4\u30fc"}
                  onClick={onCopy}
                >
                  {isCopied ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              }
            />
            <TooltipContent>{"URL\u3092\u30b3\u30d4\u30fc"}</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

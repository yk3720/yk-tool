"use client";

import { useMemo, useState } from "react";

import { CATEGORIES, FIGURES, type CategoryId, type Figure } from "@/data/figures";
import { getTopicById, type TopicId } from "@/data/topics";
import { CategoryPane } from "@/components/diagram-manager/CategoryPane";
import { DiagramCardPane } from "@/components/diagram-manager/DiagramCardPane";
import { DiagramDetailPane } from "@/components/diagram-manager/DiagramDetailPane";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type FigureSelectionSource = "primary" | "related";

export function DiagramWorkspace() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>(CATEGORIES[0].id);
  const [selectedTopicId, setSelectedTopicId] = useState<TopicId | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null);
  const [figureSelectionSource, setFigureSelectionSource] =
    useState<FigureSelectionSource | null>(null);

  const filteredFigures = useMemo(() => {
    let list = FIGURES.filter((f) => f.categoryId === selectedCategoryId);
    if (selectedTopicId !== null) {
      list = list.filter((f) => f.topicId === selectedTopicId);
    }
    return list;
  }, [selectedCategoryId, selectedTopicId]);

  const selectedFigure: Figure | null = useMemo(() => {
    if (selectedFigureId === null) {
      return null;
    }
    if (figureSelectionSource === "related") {
      return FIGURES.find((f) => f.id === selectedFigureId) ?? null;
    }
    return (
      FIGURES.find(
        (f) =>
          f.id === selectedFigureId &&
          f.categoryId === selectedCategoryId &&
          (selectedTopicId === null || f.topicId === selectedTopicId),
      ) ?? null
    );
  }, [selectedFigureId, figureSelectionSource, selectedCategoryId, selectedTopicId]);

  const figureCountByCategory = useMemo(() => {
    return ([...CATEGORIES] as const).reduce<Record<CategoryId, number>>(
      (acc, category) => {
        acc[category.id] = FIGURES.filter((f) => f.categoryId === category.id).length;
        return acc;
      },
      {} as Record<CategoryId, number>,
    );
  }, []);

  const handleSelectCategory = (id: CategoryId) => {
    setSelectedCategoryId(id);
    setSelectedTopicId(null);
    setSelectedFigureId(null);
    setFigureSelectionSource(null);
  };

  const handleSelectTopic = (categoryId: CategoryId, topicId: TopicId | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedTopicId(topicId);
    setSelectedFigureId(null);
    setFigureSelectionSource(null);
  };

  const handleSelectPrimaryFigure = (id: string) => {
    setSelectedFigureId(id);
    setFigureSelectionSource("primary");
  };

  const handleSelectRelatedFigure = (id: string) => {
    setSelectedFigureId(id);
    setFigureSelectionSource("related");
  };

  const handleDeleteFigure = (_id: string) => {
    // cardDelete 有効化時に repository.remove を接続
  };

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId) ?? CATEGORIES[0];
  const selectedTopicLabel =
    selectedTopicId !== null ? (getTopicById(selectedTopicId)?.label ?? null) : null;

  const detailCategoryLabel = useMemo(() => {
    if (!selectedFigure) {
      return selectedCategory.label;
    }
    return CATEGORIES.find((c) => c.id === selectedFigure.categoryId)?.label ?? selectedCategory.label;
  }, [selectedFigure, selectedCategory.label]);

  const detailTopicLabel = useMemo(() => {
    if (!selectedFigure) {
      return selectedTopicLabel;
    }
    return getTopicById(selectedFigure.topicId)?.label ?? null;
  }, [selectedFigure, selectedTopicLabel]);

  const cardPaneKey = `${selectedCategoryId}-${selectedTopicId ?? "all"}`;

  return (
    <SidebarProvider
      defaultOpen
      className="h-screen w-full overflow-hidden bg-background text-foreground"
    >
      <CategoryPane
        categories={CATEGORIES}
        figures={FIGURES}
        selectedCategoryId={selectedCategoryId}
        selectedTopicId={selectedTopicId}
        onSelectCategory={handleSelectCategory}
        onSelectTopic={handleSelectTopic}
        figureCountByCategory={figureCountByCategory}
      />

      <SidebarInset className="flex min-w-0 flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <span className="text-xs text-muted-foreground">図解管理</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{selectedCategory.label}</span>
          {selectedTopicLabel ? (
            <>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-sm font-medium text-foreground">{selectedTopicLabel}</span>
            </>
          ) : null}
          {selectedFigure ? (
            <>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="truncate text-sm text-muted-foreground">{selectedFigure.title}</span>
            </>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1">
          <DiagramCardPane
            key={cardPaneKey}
            figures={filteredFigures}
            allFigures={FIGURES}
            selectedFigureId={selectedFigureId}
            onSelectFigure={handleSelectPrimaryFigure}
            onSelectRelatedFigure={handleSelectRelatedFigure}
            categoryLabel={selectedCategory.label}
            topicLabel={selectedTopicLabel}
            onDeleteFigure={handleDeleteFigure}
          />

          <DiagramDetailPane
            figure={selectedFigure}
            allFigures={FIGURES}
            categoryLabel={detailCategoryLabel}
            topicLabel={detailTopicLabel}
            selectedFigureId={selectedFigureId}
            onSelectFigure={handleSelectRelatedFigure}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

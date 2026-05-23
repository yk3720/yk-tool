"use client";

import { ChevronDown, Cpu, LayoutDashboard, Map, Sparkles } from "lucide-react";

import { type Category, type CategoryId, type Figure } from "@/data/figures";
import { type TopicId } from "@/data/topics";
import { listTopicsWithFigures } from "@/lib/diagram/topics";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Pane1Toggle } from "@/components/workspace/Pane1Toggle";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<CategoryId, React.ReactNode> = {
  techmap: <Cpu className="size-4" />,
  curiositymap: <Map className="size-4" />,
  "visual-explainer": <Sparkles className="size-4" />,
  tool: <LayoutDashboard className="size-4" />,
};

type CategoryPaneProps = {
  categories: readonly Category[];
  figures: readonly Figure[];
  selectedCategoryId: CategoryId;
  selectedTopicId: TopicId | null;
  onSelectCategory: (id: CategoryId) => void;
  onSelectTopic: (categoryId: CategoryId, topicId: TopicId | null) => void;
  figureCountByCategory: Record<CategoryId, number>;
};

export function CategoryPane({
  categories,
  figures,
  selectedCategoryId,
  selectedTopicId,
  onSelectCategory,
  onSelectTopic,
  figureCountByCategory,
}: CategoryPaneProps) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border [&_[data-slot=sidebar-container]]:bg-sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="flex h-12 items-center justify-between gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[state=expanded]:px-5">
          <h2 className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            図解管理
          </h2>
          <Pane1Toggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        <SidebarGroup className="px-1">
          <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
            ツール種別
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => {
                const isExpanded = category.id === selectedCategoryId;
                const categoryCount = figureCountByCategory[category.id] ?? 0;
                const topics = listTopicsWithFigures(figures, category.id);
                const categoryActive =
                  selectedCategoryId === category.id && selectedTopicId === null;

                return (
                  <SidebarMenuItem key={category.id}>
                    <SidebarMenuButton
                      tooltip={category.description}
                      isActive={categoryActive}
                      aria-current={categoryActive ? "page" : undefined}
                      onClick={() => onSelectCategory(category.id)}
                    >
                      {CATEGORY_ICONS[category.id]}
                      <span className="truncate">{category.label}</span>
                      <span className="ml-auto flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {categoryCount}
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={cn(
                            "size-3.5 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </span>
                    </SidebarMenuButton>

                    {isExpanded && topics.length > 0 ? (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            isActive={categoryActive}
                            onClick={() => onSelectTopic(category.id, null)}
                          >
                            <span>すべて</span>
                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                              {categoryCount}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {topics.map((topic) => {
                          const topicActive =
                            selectedCategoryId === category.id &&
                            selectedTopicId === topic.id;
                          const topicCount = figures.filter(
                            (f) =>
                              f.categoryId === category.id && f.topicId === topic.id,
                          ).length;
                          return (
                            <SidebarMenuSubItem key={topic.id}>
                              <SidebarMenuSubButton
                                isActive={topicActive}
                                onClick={() => onSelectTopic(category.id, topic.id)}
                              >
                                <span className="truncate">{topic.label}</span>
                                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                                  {topicCount}
                                </span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

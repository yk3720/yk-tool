"use client";

import type { Edge, Node } from "@xyflow/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import sampleBasic from "@/fixtures/sample-basic.json";
import sampleSimpleYes from "@/fixtures/sample-simple-yes.json";
import templateLinear from "@/fixtures/template-linear.json";
import templateStarter from "@/fixtures/template-starter.json";
import sampleM002NineCol from "@/fixtures/sample-m002-9col.json";
import {
  downloadJson,
  parseFlowchartDocument,
  serializeDocument,
} from "@/lib/flowchart/document";
import { clearDraft, loadDraft, saveDraft } from "@/lib/flowchart/draftStorage";
import { generateFlowchart } from "@/lib/flowchart/generate";
import {
  LAYOUT_PRESETS,
  layoutPresetFromConfig,
  type LayoutPresetId,
} from "@/lib/flowchart/layoutPresets";
import { FLOW_THEMES, resolveThemeId, type ThemeId } from "@/lib/flowchart/themes";
import { toReactFlow, type FlowNodeData } from "@/lib/flowchart/toReactFlow";
import type { FlowchartDocument, LayoutConfig } from "@/lib/flowchart/types";
import {
  errorRowIndices,
  validateTableWarnings,
} from "@/lib/flowchart/validationMeta";
import { captureFlowPng } from "./exportPng";
import { captureFlowSvg } from "./exportSvg";
import { FlowCanvas, type FlowCanvasHandle } from "./FlowCanvas";
import { CsvPastePanel } from "./CsvPastePanel";
import {
  FlowTableEditor,
  type FlowTableEditorHandle,
} from "./FlowTableEditor";

const SAMPLES: Record<string, FlowchartDocument> = {
  basic: sampleBasic as FlowchartDocument,
  simpleYes: sampleSimpleYes as FlowchartDocument,
  templateStarter: templateStarter as FlowchartDocument,
  templateLinear: templateLinear as FlowchartDocument,
  m002NineCol: sampleM002NineCol as FlowchartDocument,
};

type InputMode = "table" | "json";
type PaneView = "table" | "canvas";

export type FlowchartEditorSnapshot = {
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  themeId: ThemeId;
  layoutPreset: LayoutPresetId;
};

export type FlowchartEditorHandle = {
  getSnapshot: () => FlowchartEditorSnapshot;
};

export type FlowchartEditorProps = {
  deviceName?: string;
  moduleId?: string | null;
  moduleLabel?: string;
  initialSnapshot?: FlowchartEditorSnapshot | null;
  workspaceMode?: boolean;
  onSnapshotPersist?: () => void;
};

const EMPTY_MODULE_MESSAGE = "モジュールを選択してください";
const EMPTY_TABLE_MESSAGE =
  "Excel から取込むか、表を入力してください";

function resolveInitialState(
  props: FlowchartEditorProps,
): {
  doc: FlowchartDocument;
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  themeId: ThemeId;
  layoutPreset: LayoutPresetId;
} {
  const snap = props.initialSnapshot;
  if (snap) {
    const { doc: parsed } = parseFlowchartDocument(snap.jsonText);
    return {
      doc: parsed ?? (SAMPLES.templateStarter as FlowchartDocument),
      jsonText: snap.jsonText,
      committedJson: snap.committedJson,
      nodes: snap.nodes,
      edges: snap.edges,
      themeId: snap.themeId,
      layoutPreset: snap.layoutPreset,
    };
  }
  if (props.workspaceMode && props.moduleId) {
    const starter = SAMPLES.templateStarter as FlowchartDocument;
    const text = serializeDocument(starter);
    return {
      doc: starter,
      jsonText: text,
      committedJson: "",
      nodes: [],
      edges: [],
      themeId: resolveThemeId(starter.themeId),
      layoutPreset: layoutPresetFromConfig(starter.layout),
    };
  }
  const basic = SAMPLES.basic as FlowchartDocument;
  const text = serializeDocument(basic);
  return {
    doc: basic,
    jsonText: text,
    committedJson: text,
    nodes: [],
    edges: [],
    themeId: resolveThemeId(basic.themeId),
    layoutPreset: layoutPresetFromConfig(basic.layout),
  };
}

export const FlowchartEditor = forwardRef<
  FlowchartEditorHandle,
  FlowchartEditorProps
>(function FlowchartEditor(props, ref) {
  const {
    deviceName,
    moduleId = null,
    moduleLabel,
    initialSnapshot,
    workspaceMode = false,
    onSnapshotPersist,
  } = props;

  const initial = useMemo(
    () => resolveInitialState(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key remount per module
    [moduleId, initialSnapshot],
  );

  const [doc, setDoc] = useState<FlowchartDocument>(initial.doc);
  const [jsonText, setJsonText] = useState(initial.jsonText);
  const [committedJson, setCommittedJson] = useState(initial.committedJson);
  const [inputMode, setInputMode] = useState<InputMode>("table");
  const [paneView, setPaneView] = useState<PaneView>("table");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [genErrors, setGenErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [status, setStatus] = useState(
    workspaceMode && moduleId && !initialSnapshot
      ? "表を入力するかサンプルを読み込んでください"
      : "準備完了",
  );
  const [themeId, setThemeId] = useState<ThemeId>(initial.themeId);
  const [layoutPreset, setLayoutPreset] = useState<LayoutPresetId>(
    initial.layoutPreset,
  );
  const canvasRef = useRef<FlowCanvasHandle>(null);
  const tableEditorRef = useRef<FlowTableEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRegenerateRef = useRef<HTMLButtonElement>(null);

  const isStale = jsonText !== committedJson;
  const moduleSelected = !workspaceMode || moduleId !== null;
  const hasPreview = nodes.length > 0;

  useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () => ({
        jsonText,
        committedJson,
        nodes,
        edges,
        themeId,
        layoutPreset,
      }),
    }),
    [jsonText, committedJson, nodes, edges, themeId, layoutPreset],
  );

  const errorRows = useMemo(
    () => errorRowIndices([...parseErrors, ...genErrors], doc.table),
    [parseErrors, genErrors, doc.table],
  );

  const syncJsonFromDoc = useCallback((nextDoc: FlowchartDocument) => {
    setDoc(nextDoc);
    setJsonText(serializeDocument(nextDoc));
    if (nextDoc.themeId) setThemeId(resolveThemeId(nextDoc.themeId));
    setLayoutPreset(layoutPresetFromConfig(nextDoc.layout));
  }, []);

  const refreshWarnings = useCallback((table: FlowchartDocument["table"]) => {
    setWarnings(validateTableWarnings(table));
  }, []);

  const runGenerate = useCallback(
    (text: string) => {
      const { doc: parsed, errors: docErrors } = parseFlowchartDocument(text);
      if (docErrors.length > 0) {
        setParseErrors(docErrors);
        setGenErrors([]);
        setStatus("JSON の形式エラー");
        return false;
      }
      if (!parsed) return false;

      setParseErrors([]);
      setDoc(parsed);
      refreshWarnings(parsed.table);
      if (parsed.themeId) setThemeId(resolveThemeId(parsed.themeId));

      const result = generateFlowchart(parsed.table, parsed.layout);
      if (!result.ok) {
        setGenErrors(result.errors);
        setStatus(
          "生成エラー — 直前のプレビューを表示しています。表を直して再生成してください",
        );
        return false;
      }

      setGenErrors([]);
      const rf = toReactFlow(
        result.placed,
        result.edges,
        parsed.themeId ?? themeId,
      );
      setNodes(rf.nodes);
      setEdges(rf.edges);
      setCommittedJson(text);
      setStatus(
        `生成完了 — ノード ${result.placed.length} / エッジ ${result.edges.length}`,
      );
      onSnapshotPersist?.();
      return true;
    },
    [refreshWarnings, themeId, onSnapshotPersist],
  );

  useEffect(() => {
    if (workspaceMode) {
      if (moduleId && initialSnapshot) {
        refreshWarnings(initial.doc.table);
      }
      return;
    }
    const draft = loadDraft();
    if (draft) {
      const { doc: parsed, errors } = parseFlowchartDocument(draft);
      if (parsed && errors.length === 0) {
        setJsonText(draft);
        setDoc(parsed);
        if (parsed.themeId) setThemeId(resolveThemeId(parsed.themeId));
        setLayoutPreset(layoutPresetFromConfig(parsed.layout));
        refreshWarnings(parsed.table);
        runGenerate(draft);
        setStatus("下書きを復元しました");
        return;
      }
    }
    runGenerate(serializeDocument(SAMPLES.basic));
  }, [runGenerate, refreshWarnings, workspaceMode, moduleId, initialSnapshot, initial.doc.table]);

  useEffect(() => {
    if (workspaceMode) return;
    const t = window.setTimeout(() => saveDraft(jsonText), 800);
    return () => window.clearTimeout(t);
  }, [jsonText, workspaceMode]);

  const handleRegenerate = () => {
    if (inputMode === "json") {
      const { doc: parsed, errors } = parseFlowchartDocument(jsonText);
      if (parsed && errors.length === 0) setDoc(parsed);
    }
    refreshWarnings(doc.table);
    runGenerate(jsonText);
  };

  const loadDocument = (sample: FlowchartDocument) => {
    const text = serializeDocument(sample);
    syncJsonFromDoc(sample);
    refreshWarnings(sample.table);
    runGenerate(text);
  };

  const handleLoadSample = (key: keyof typeof SAMPLES) => {
    loadDocument(SAMPLES[key]);
  };

  const handleTableChange = (table: FlowchartDocument["table"]) => {
    const next: FlowchartDocument = {
      ...doc,
      table,
      themeId,
      createdAt: new Date().toISOString(),
    };
    syncJsonFromDoc(next);
    refreshWarnings(table);
  };

  const handleCsvApply = (table: FlowchartDocument["table"]) => {
    handleTableChange(table);
    setStatus("CSV を表に反映しました — 「再生成」でプレビューを更新");
  };

  const applyTheme = (id: ThemeId) => {
    setThemeId(id);
    const next = { ...doc, themeId: id };
    syncJsonFromDoc(next);
    if (!isStale && nodes.length > 0) {
      const result = generateFlowchart(next.table, next.layout);
      if (result.ok) {
        const rf = toReactFlow(result.placed, result.edges, id);
        setNodes(rf.nodes);
        setEdges(rf.edges);
      }
    }
  };

  const applyLayoutPreset = (preset: LayoutPresetId) => {
    setLayoutPreset(preset);
    const layout: LayoutConfig = {
      ...doc.layout,
      ...LAYOUT_PRESETS[preset].layout,
    };
    const next = { ...doc, layout };
    syncJsonFromDoc(next);
    setStatus(`レイアウト: ${LAYOUT_PRESETS[preset].label} — 再生成してください`);
  };

  const commitDocFromJsonText = useCallback((): boolean => {
    const { doc: parsed, errors } = parseFlowchartDocument(jsonText);
    if (errors.length > 0) {
      setParseErrors(errors);
      return false;
    }
    if (!parsed) return false;
    setParseErrors([]);
    setDoc(parsed);
    refreshWarnings(parsed.table);
    return true;
  }, [jsonText, refreshWarnings]);

  const handleSaveJson = () => {
    const { doc: parsed, errors } = parseFlowchartDocument(jsonText);
    if (errors.length > 0) {
      setParseErrors(errors);
      setStatus("保存できません — JSON の形式を直してください");
      return;
    }
    if (parsed) downloadJson(parsed);
    else downloadJson(doc);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setJsonText(text);
      const { doc: parsed } = parseFlowchartDocument(text);
      if (parsed) {
        setDoc(parsed);
        refreshWarnings(parsed.table);
      }
      runGenerate(text);
    };
    reader.readAsText(file);
  };

  const handleClearDraft = () => {
    clearDraft();
    setStatus("下書きを削除しました");
  };

  const handleExportPng = async () => {
    if (isStale) {
      setStatus("PNG: 表または JSON を変更しました。先に「再生成」してください");
      return;
    }
    if (nodes.length === 0) {
      setStatus("PNG: 先に再生成してプレビューを表示してください");
      return;
    }
    canvasRef.current?.fitView();
    await new Promise((r) => setTimeout(r, 300));
    const el = canvasRef.current?.getExportElement();
    if (!el) {
      setStatus("PNG: キャプチャ要素が見つかりません");
      return;
    }
    const base = (doc.title ?? "flowchart").replace(
      /[^\w\u3040-\u30ff\u4e00-\u9fff-]+/g,
      "_",
    );
    try {
      await captureFlowPng(el, `${base}.png`);
      setStatus("PNG をダウンロードしました");
    } catch (e) {
      setStatus(`PNG エラー: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleExportSvg = async () => {
    if (isStale) {
      setStatus("SVG: 先に「再生成」してください");
      return;
    }
    if (nodes.length === 0) return;
    canvasRef.current?.fitView();
    await new Promise((r) => setTimeout(r, 300));
    const el = canvasRef.current?.getExportElement();
    if (!el) return;
    const base = (doc.title ?? "flowchart").replace(
      /[^\w\u3040-\u30ff\u4e00-\u9fff-]+/g,
      "_",
    );
    try {
      await captureFlowSvg(el, `${base}.svg`);
      setStatus("SVG をダウンロードしました");
    } catch (e) {
      setStatus(`SVG エラー: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const jumpToError = (err: string) => {
    const rows = errorRowIndices([err], doc.table);
    const first = [...rows][0];
    if (first !== undefined) {
      setInputMode("table");
      setTimeout(() => tableEditorRef.current?.scrollToRow(first), 50);
    }
  };

  const switchToTable = () => {
    commitDocFromJsonText();
    setInputMode("table");
  };

  const switchToJson = () => {
    setInputMode("json");
  };

  const canExport = !isStale && nodes.length > 0;
  const allErrors = [...parseErrors, ...genErrors];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Flowchart Web</h1>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              実用版
            </span>
          </div>
          {deviceName ? (
            <p className="text-sm text-slate-600">
              装置: <span className="font-medium text-slate-800">{deviceName}</span>
              {moduleLabel ? (
                <span className="text-slate-500"> · {moduleLabel}</span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            ref={headerRegenerateRef}
            type="button"
            onClick={handleRegenerate}
            disabled={!moduleSelected}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            再生成
          </button>
          <select
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            defaultValue="basic"
            onChange={(e) =>
              handleLoadSample(e.target.value as keyof typeof SAMPLES)
            }
          >
            <option value="basic">サンプル: 基本判断</option>
            <option value="simpleYes">サンプル: ループあり</option>
            <option value="templateStarter">雛形: はじめから</option>
            <option value="templateLinear">雛形: 直線</option>
            <option value="m002NineCol">サンプル: M002（9列·段+列）</option>
          </select>
          <select
            value={themeId}
            onChange={(e) => applyTheme(e.target.value as ThemeId)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            title="テーマ"
          >
            {Object.values(FLOW_THEMES).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={layoutPreset}
            onChange={(e) =>
              applyLayoutPreset(e.target.value as LayoutPresetId)
            }
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            title="サイズ"
          >
            {Object.entries(LAYOUT_PRESETS).map(([id, p]) => (
              <option key={id} value={id}>
                サイズ:{p.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSaveJson}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            表を保存
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            表を読込
          </button>
          <button
            type="button"
            onClick={() => void handleExportPng()}
            disabled={!canExport}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            PNG
          </button>
          <button
            type="button"
            onClick={() => void handleExportSvg()}
            disabled={!canExport}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            SVG
          </button>
          <button
            type="button"
            onClick={handleClearDraft}
            disabled={workspaceMode}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              workspaceMode
                ? "モジュール単位の下書きは切替時に自動保存されます"
                : "ブラウザに保存した下書きを削除"
            }
          >
            下書き削除
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <p
          className="ml-auto w-full text-sm lg:w-auto"
          role="status"
          aria-live="polite"
        >
          {isStale && (
            <span className="mr-2 font-medium text-amber-600">
              プレビューは古い —
            </span>
          )}
          <span className="text-slate-600">{status}</span>
          {!workspaceMode ? (
            <span className="ml-2 text-xs text-slate-400">（下書き自動保存）</span>
          ) : null}
        </p>
      </header>

      {allErrors.length > 0 && (
        <div
          className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
          role="alert"
        >
          <ul className="list-inside list-disc">
            {allErrors.map((err) => (
              <li key={err}>
                <button
                  type="button"
                  onClick={() => jumpToError(err)}
                  className="text-left underline hover:text-red-950"
                >
                  {err}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && allErrors.length === 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <p className="font-medium">確認（警告）</p>
          <ul className="list-inside list-disc">
            {warnings.map((w) => (
              <li key={w}>
                <button
                  type="button"
                  onClick={() => jumpToError(w)}
                  className="underline"
                >
                  {w}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {workspaceMode ? (
        <div className="flex border-b border-slate-200 px-4 py-2 lg:hidden">
          <div
            className="inline-flex rounded-md border border-slate-300 p-0.5 text-xs"
            role="tablist"
            aria-label="表とプレビュー"
          >
            <button
              type="button"
              role="tab"
              aria-selected={paneView === "table"}
              onClick={() => setPaneView("table")}
              className={`rounded px-3 py-1 font-medium ${
                paneView === "table"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              表
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={paneView === "canvas"}
              onClick={() => setPaneView("canvas")}
              className={`rounded px-3 py-1 font-medium ${
                paneView === "canvas"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              図
            </button>
          </div>
        </div>
      ) : null}

      <main className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[2fr_3fr]">
        <section
          className={`min-h-[320px] flex-col gap-2 border-r border-slate-200 p-4 ${
            workspaceMode && paneView === "canvas" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-slate-700">表</h2>
            {moduleSelected ? (
              <div
              className="inline-flex rounded-md border border-slate-300 p-0.5 text-xs"
              role="tablist"
              aria-label="入力モード"
            >
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === "table"}
                onClick={switchToTable}
                className={`rounded px-2.5 py-1 font-medium ${
                  inputMode === "table"
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                表 UI
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === "json"}
                onClick={switchToJson}
                className={`rounded px-2.5 py-1 font-medium ${
                  inputMode === "json"
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                JSON
              </button>
            </div>
            ) : null}
          </div>

          {!moduleSelected ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              {EMPTY_MODULE_MESSAGE}
            </div>
          ) : inputMode === "table" ? (
            <>
              <CsvPastePanel onApply={handleCsvApply} />
              <FlowTableEditor
                ref={tableEditorRef}
                table={doc.table}
                onChange={handleTableChange}
                errorRowIndices={errorRows}
              />
            </>
          ) : (
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="min-h-[400px] flex-1 resize-y rounded-md border border-slate-300 p-3 font-mono text-xs leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="フローチャート表 JSON"
            />
          )}
        </section>

        <section
          className={`min-h-[320px] flex-col gap-2 p-4 ${
            workspaceMode && paneView === "table" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-slate-700">プレビュー</h2>
            {moduleSelected ? (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                閲覧専用（表を編集 → 再生成）
              </span>
            ) : null}
          </div>
          {!moduleSelected ? (
            <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              {EMPTY_MODULE_MESSAGE}
            </div>
          ) : hasPreview ? (
            <div
              className={`relative min-h-[420px] flex-1 ${
                isStale ? "rounded-lg ring-2 ring-amber-400 ring-offset-1" : ""
              }`}
            >
              <FlowCanvas
                canvasRef={canvasRef}
                nodes={nodes}
                edges={edges}
                themeId={themeId}
              />
              {isStale && (
                <div className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-lg bg-amber-50/70 p-4">
                  <p className="pointer-events-auto max-w-md rounded-md border border-amber-300 bg-white px-3 py-2 text-center text-sm text-amber-900 shadow-sm">
                    入力が変更されています。{" "}
                    <button
                      type="button"
                      onClick={() => headerRegenerateRef.current?.click()}
                      className="font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      再生成
                    </button>
                    でプレビューを更新してください。
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              {EMPTY_TABLE_MESSAGE}
            </div>
          )}
        </section>
      </main>
    </div>
  );
});

FlowchartEditor.displayName = "FlowchartEditor";

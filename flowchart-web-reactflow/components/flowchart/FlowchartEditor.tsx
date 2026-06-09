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
import sampleCurry from "@/fixtures/sample-curry.json";
import sampleMorning from "@/fixtures/sample-morning.json";
import sampleAtm from "@/fixtures/sample-atm.json";
import sampleBasic from "@/fixtures/sample-basic.json";
import sampleSimpleYes from "@/fixtures/sample-simple-yes.json";
import templateLinear from "@/fixtures/template-linear.json";
import templateStarter from "@/fixtures/template-starter.json";
import sampleM002NineCol from "@/fixtures/sample-m002-9col.json";
import {
  downloadJson,
  normalizeFlowchartDocument,
  parseFlowchartDocument,
  serializeDocument,
} from "@/lib/flowchart/document";
import { clearDraft, loadDraft, saveDraft } from "@/lib/flowchart/draftStorage";
import { generateFlowchart } from "@/lib/flowchart/generate";
import { resolveColumnCount } from "@/lib/flowchart/tableColumns";
import { toReactFlow, type FlowNodeData } from "@/lib/flowchart/toReactFlow";
import type { FlowchartDocument } from "@/lib/flowchart/types";
import {
  errorRowIndices,
  validateTableWarnings,
  WARNING_BANNER_HINT,
} from "@/lib/flowchart/validationMeta";
import { captureFlowPng } from "./exportPng";
import { captureFlowSvg } from "./exportSvg";
import { EditorMoreMenu } from "./EditorMoreMenu";
import { FlowCanvas, type FlowCanvasHandle } from "./FlowCanvas";
import { FlowColorLegend } from "./FlowColorLegend";
import { CsvPastePanel } from "./CsvPastePanel";
import { FlowTableEditor, type FlowTableEditorHandle } from "./FlowTableEditor";

const SAMPLES: Record<string, FlowchartDocument> = {
  curry: sampleCurry as FlowchartDocument,
  morning: sampleMorning as FlowchartDocument,
  atm: sampleAtm as FlowchartDocument,
  basic: sampleBasic as FlowchartDocument,
  simpleYes: sampleSimpleYes as FlowchartDocument,
  templateStarter: templateStarter as FlowchartDocument,
  templateLinear: templateLinear as FlowchartDocument,
  m002NineCol: sampleM002NineCol as FlowchartDocument,
};

const STARTER_OPTIONS = [
  { key: "templateStarter", label: "雛形: はじめから" },
  { key: "templateLinear", label: "雛形: 直線フロー" },
] as const;

const DEMO_SAMPLE_OPTIONS = [
  { key: "curry", label: "サンプル: カレーの作り方" },
  { key: "morning", label: "サンプル: 朝の出勤準備" },
  { key: "atm", label: "サンプル: ATMで現金を下ろす" },
] as const;

type SampleKey =
  | (typeof STARTER_OPTIONS)[number]["key"]
  | (typeof DEMO_SAMPLE_OPTIONS)[number]["key"];

type PaneView = "table" | "canvas";

export type FlowchartEditorSnapshot = {
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
};

export type FlowchartEditorHandle = {
  getSnapshot: () => FlowchartEditorSnapshot;
};

export type FlowchartEditorProps = {
  /** 選択中フローの文脈（例: 供給ユニット · 供給動作） */
  contextLabel?: string;
  moduleId?: string | null;
  initialSnapshot?: FlowchartEditorSnapshot | null;
  workspaceMode?: boolean;
  /** 閲覧者: 表編集・取込・再生成を不可（ADR-013） */
  readOnly?: boolean;
  onSnapshotPersist?: () => void;
  pinOffline?: { pinned: boolean; onToggle: () => void };
  importBundle?: {
    disabled: boolean;
    disabledTitle?: string;
    onSelectFile: (file: File) => void;
  };
};

const EMPTY_MODULE_MESSAGE = "モジュールを選択してください";
const EMPTY_TABLE_MESSAGE = "Excel から取込むか、表を入力してください";

function resolveInitialState(props: FlowchartEditorProps): {
  doc: FlowchartDocument;
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} {
  const snap = props.initialSnapshot;
  if (snap) {
    const raw = snap.committedJson || snap.jsonText;
    const { doc: parsed } = parseFlowchartDocument(raw);
    const doc = normalizeFlowchartDocument(
      parsed ?? (SAMPLES.templateStarter as FlowchartDocument)
    );
    const text = serializeDocument(doc);
    return {
      doc,
      jsonText: text,
      committedJson: text,
      nodes: snap.nodes,
      edges: snap.edges,
    };
  }
  if (props.workspaceMode && props.moduleId) {
    const starter = normalizeFlowchartDocument(
      SAMPLES.templateStarter as FlowchartDocument
    );
    const text = serializeDocument(starter);
    return {
      doc: starter,
      jsonText: text,
      committedJson: "",
      nodes: [],
      edges: [],
    };
  }
  const basic = normalizeFlowchartDocument(SAMPLES.curry as FlowchartDocument);
  const text = serializeDocument(basic);
  return {
    doc: basic,
    jsonText: text,
    committedJson: text,
    nodes: [],
    edges: [],
  };
}

export const FlowchartEditor = forwardRef<
  FlowchartEditorHandle,
  FlowchartEditorProps
>(function FlowchartEditor(props, ref) {
  const {
    contextLabel,
    moduleId = null,
    initialSnapshot,
    workspaceMode = false,
    readOnly = false,
    onSnapshotPersist,
    pinOffline,
    importBundle,
  } = props;

  const initial = useMemo(
    () => resolveInitialState(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key remount per module
    [moduleId, initialSnapshot]
  );

  const [doc, setDoc] = useState<FlowchartDocument>(initial.doc);
  const [jsonText, setJsonText] = useState(initial.jsonText);
  const [committedJson, setCommittedJson] = useState(initial.committedJson);
  const [paneView, setPaneView] = useState<PaneView>("table");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [genErrors, setGenErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [status, setStatus] = useState(
    workspaceMode && moduleId && !initialSnapshot
      ? "表を入力するかサンプルを読み込んでください"
      : "準備完了"
  );
  const [samplePreviewActive, setSamplePreviewActive] = useState(false);
  const canvasRef = useRef<FlowCanvasHandle>(null);
  const tableEditorRef = useRef<FlowTableEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRegenerateRef = useRef<HTMLButtonElement>(null);

  const isStale = jsonText !== committedJson;
  const moduleSelected = !workspaceMode || moduleId !== null;
  const showEditorPanes =
    moduleSelected || (workspaceMode && samplePreviewActive);
  const hasPreview = nodes.length > 0;
  const showColorLegend = resolveColumnCount(doc.table, doc.schema) >= 10;

  useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () => ({
        jsonText,
        committedJson,
        nodes,
        edges,
      }),
    }),
    [jsonText, committedJson, nodes, edges]
  );

  const errorRows = useMemo(
    () => errorRowIndices([...parseErrors, ...genErrors], doc.table),
    [parseErrors, genErrors, doc.table]
  );

  const syncJsonFromDoc = useCallback((nextDoc: FlowchartDocument) => {
    const normalized = normalizeFlowchartDocument(nextDoc);
    setDoc(normalized);
    setJsonText(serializeDocument(normalized));
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
        setStatus("保存データの形式エラー");
        return false;
      }
      if (!parsed) return false;

      setParseErrors([]);
      setDoc(normalizeFlowchartDocument(parsed));
      refreshWarnings(parsed.table);

      const result = generateFlowchart(parsed.table, parsed.layout);
      if (!result.ok) {
        setGenErrors(result.errors);
        setStatus(
          "生成エラー — 直前のプレビューを表示しています。表を直して再生成してください"
        );
        return false;
      }

      setGenErrors([]);
      const rf = toReactFlow(result.placed, result.edges);
      setNodes(rf.nodes);
      setEdges(rf.edges);
      setCommittedJson(text);
      setStatus(
        `生成完了 — ノード ${result.placed.length} / エッジ ${result.edges.length}`
      );
      onSnapshotPersist?.();
      return true;
    },
    [refreshWarnings, onSnapshotPersist]
  );

  useEffect(() => {
    if (workspaceMode) {
      if (moduleId && initialSnapshot) {
        refreshWarnings(initial.doc.table);
        if (initial.jsonText) {
          runGenerate(initial.jsonText);
        }
      }
      return;
    }
    const draft = loadDraft();
    if (draft) {
      const { doc: parsed, errors } = parseFlowchartDocument(draft);
      if (parsed && errors.length === 0) {
        setJsonText(draft);
        setDoc(normalizeFlowchartDocument(parsed));
        refreshWarnings(parsed.table);
        runGenerate(draft);
        setStatus("下書きを復元しました");
        return;
      }
    }
    runGenerate(serializeDocument(SAMPLES.curry));
  }, [
    runGenerate,
    refreshWarnings,
    workspaceMode,
    moduleId,
    initialSnapshot,
    initial.doc.table,
  ]);

  useEffect(() => {
    if (workspaceMode) return;
    const t = window.setTimeout(() => saveDraft(jsonText), 800);
    return () => window.clearTimeout(t);
  }, [jsonText, workspaceMode]);

  const handleRegenerate = () => {
    if (readOnly) {
      setStatus("閲覧者は再生成できません");
      return;
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

  const handleLoadSample = (key: SampleKey) => {
    if (workspaceMode && !moduleId) {
      setSamplePreviewActive(true);
    }
    loadDocument(SAMPLES[key]);
  };

  const handleTableChange = (table: FlowchartDocument["table"]) => {
    if (readOnly) return;
    const next: FlowchartDocument = {
      ...doc,
      table,
      createdAt: new Date().toISOString(),
    };
    syncJsonFromDoc(next);
    refreshWarnings(table);
  };

  const handleCsvApply = (table: FlowchartDocument["table"]) => {
    if (readOnly) return;
    handleTableChange(table);
    setStatus("CSV を表に反映しました — 「再生成」でプレビューを更新");
  };

  const handleSaveJson = () => {
    if (readOnly) {
      setStatus("閲覧者は表のダウンロードはできません");
      return;
    }
    const { doc: parsed, errors } = parseFlowchartDocument(jsonText);
    if (errors.length > 0) {
      setParseErrors(errors);
      setStatus("保存できません — 表データの形式を直してください");
      return;
    }
    if (parsed) downloadJson(parsed);
    else downloadJson(doc);
  };

  const handleImportFile = (file: File) => {
    if (readOnly) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setJsonText(text);
      const { doc: parsed } = parseFlowchartDocument(text);
      if (parsed) {
        setDoc(normalizeFlowchartDocument(parsed));
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
      setStatus("PNG: 表を変更しました。先に「再生成」してください");
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
      "_"
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
      "_"
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
      setTimeout(() => tableEditorRef.current?.scrollToRow(first), 50);
    }
  };

  const canExport = !isStale && nodes.length > 0;
  const allErrors = [...parseErrors, ...genErrors];

  const previewModeHint =
    showEditorPanes && readOnly
      ? "閲覧者モード（プレビュー・PNG/SVG のみ）"
      : showEditorPanes && moduleSelected
        ? "閲覧専用（表を編集 → 再生成）"
        : showEditorPanes
          ? "サンプル表示（左でモジュールを選ぶと保存できます）"
          : null;

  const toolbarButtons = (
    <>
      <button
        ref={headerRegenerateRef}
        type="button"
        onClick={handleRegenerate}
        disabled={!showEditorPanes || readOnly}
        className={`rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 ${
          isStale && showEditorPanes && !readOnly
            ? "ring-2 ring-amber-400 ring-offset-1"
            : ""
        }`}
      >
        再生成
      </button>

      {!readOnly ? (
        <>
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
        </>
      ) : null}

      <EditorMoreMenu
        readOnly={readOnly}
        workspaceMode={workspaceMode}
        canExport={canExport}
        clearDraftDisabled={workspaceMode}
        clearDraftTitle={
          workspaceMode
            ? "モジュール単位の下書きは切替時に自動保存されます"
            : "ブラウザに保存した下書きを削除"
        }
        pinOffline={pinOffline}
        starters={[...STARTER_OPTIONS]}
        samples={[...DEMO_SAMPLE_OPTIONS]}
        onLoadSample={(key) => handleLoadSample(key as SampleKey)}
        onExportPng={() => void handleExportPng()}
        onExportSvg={() => void handleExportSvg()}
        onClearDraft={handleClearDraft}
        importBundle={importBundle}
      />

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
    </>
  );

  const statusLine = (
    <p
      className={
        workspaceMode
          ? "max-w-md text-right text-xs text-slate-600"
          : "max-w-md text-right text-sm lg:max-w-xl"
      }
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
  );

  const errorBanner =
    allErrors.length > 0 ? (
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
    ) : null;

  const warningBanner =
    warnings.length > 0 && allErrors.length === 0 ? (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <p className="font-medium">確認（警告）</p>
        <p className="mt-0.5 text-xs text-amber-800">{WARNING_BANNER_HINT}</p>
        <ul className="mt-1 list-inside list-disc">
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
    ) : null;

  const mobilePaneTabs = workspaceMode ? (
    <div className="flex shrink-0 border-b border-slate-200 px-4 py-2 lg:hidden">
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
  ) : null;

  const tablePaneBody = !showEditorPanes ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      <p>{EMPTY_MODULE_MESSAGE}</p>
      <p className="text-xs text-slate-400">
        または上の「サンプルを選択」から表と図を表示できます
      </p>
    </div>
  ) : (
    <>
      {!readOnly ? <CsvPastePanel onApply={handleCsvApply} /> : null}
      <FlowTableEditor
        ref={tableEditorRef}
        table={doc.table}
        onChange={handleTableChange}
        errorRowIndices={errorRows}
        readOnly={readOnly}
        tableSchema={doc.schema}
      />
    </>
  );

  const renderPreviewCanvas = (fullBleed: boolean) => {
    const wrapClass = fullBleed
      ? `relative flex min-h-[280px] flex-1 flex-col lg:min-h-0 ${
          isStale ? "ring-2 ring-inset ring-amber-400" : ""
        }`
      : `relative min-h-[420px] flex-1 ${
          isStale ? "rounded-lg ring-2 ring-amber-400 ring-offset-1" : ""
        }`;

    if (!showEditorPanes) {
      return (
        <div
          className={
            fullBleed
              ? "flex min-h-[280px] flex-1 flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 lg:min-h-0 lg:border-0 lg:border-l"
              : "flex min-h-[420px] flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500"
          }
        >
          <p>{EMPTY_MODULE_MESSAGE}</p>
          <p className="text-xs text-slate-400">
            または上の「サンプルを選択」から表と図を表示できます
          </p>
        </div>
      );
    }
    if (hasPreview) {
      return (
        <div className={wrapClass}>
          <FlowCanvas
            canvasRef={canvasRef}
            nodes={nodes}
            edges={edges}
            fillContainer={fullBleed}
          />
          {showColorLegend ? <FlowColorLegend /> : null}
          {isStale && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-amber-50/70 p-4">
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
      );
    }
    return (
      <div
        className={
          fullBleed
            ? "flex min-h-[280px] flex-1 items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 lg:min-h-0 lg:border-0 lg:border-l"
            : "flex min-h-[420px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500"
        }
      >
        {EMPTY_TABLE_MESSAGE}
      </div>
    );
  };

  if (workspaceMode) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {mobilePaneTabs}
        <main className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[2fr_3fr]">
          <section
            className={`flex min-h-0 min-w-0 flex-col border-r border-slate-200 ${
              paneView === "canvas" ? "hidden lg:flex" : "flex"
            }`}
          >
            <header className="shrink-0 border-b border-slate-200 px-4 py-2">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-base font-semibold tracking-tight">
                      Flowchart Web
                    </h1>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      実用版
                    </span>
                  </div>
                  {contextLabel ? (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-800">
                        {contextLabel}
                      </span>
                    </p>
                  ) : null}
                  {previewModeHint ? (
                    <p className="text-xs text-slate-500">{previewModeHint}</p>
                  ) : null}
                </div>
                {statusLine}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {toolbarButtons}
              </div>
            </header>
            {errorBanner}
            {warningBanner}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-4">
              <h2 className="shrink-0 text-sm font-medium text-slate-700">
                表
              </h2>
              {tablePaneBody}
            </div>
          </section>

          <section
            className={`flex min-h-0 min-w-0 flex-col ${
              paneView === "table" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 lg:hidden">
              <h2 className="text-sm font-medium text-slate-700">プレビュー</h2>
              {previewModeHint ? (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {previewModeHint}
                </span>
              ) : null}
            </div>
            <h2 className="sr-only">プレビュー</h2>
            <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-0">
              {renderPreviewCanvas(true)}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                Flowchart Web
              </h1>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                実用版
              </span>
            </div>
            {contextLabel ? (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  {contextLabel}
                </span>
              </p>
            ) : null}
          </div>
          {statusLine}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {toolbarButtons}
        </div>
      </header>

      {errorBanner}
      {warningBanner}

      <main className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[2fr_3fr]">
        <section className="flex min-h-[320px] flex-col gap-2 border-r border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-700">表</h2>
          {tablePaneBody}
        </section>

        <section className="flex min-h-[320px] flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-slate-700">プレビュー</h2>
            {previewModeHint ? (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {previewModeHint}
              </span>
            ) : null}
          </div>
          {renderPreviewCanvas(false)}
        </section>
      </main>
    </div>
  );
});

FlowchartEditor.displayName = "FlowchartEditor";

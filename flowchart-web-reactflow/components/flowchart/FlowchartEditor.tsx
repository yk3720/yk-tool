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
import { isModuleContentDirty } from "@/lib/flowchart/moduleContentDirty";
import { captureFlowPng } from "./exportPng";
import { captureFlowSvg } from "./exportSvg";
import { ConfirmReplaceDialog } from "./ConfirmReplaceDialog";
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
  { key: "templateStarter", label: "雛形を適用: はじめから" },
  { key: "templateLinear", label: "雛形を適用: 直線フロー" },
] as const;

const DEMO_SAMPLE_OPTIONS = [
  { key: "curry", label: "例を見る: カレーの作り方" },
  { key: "morning", label: "例を見る: 朝の出勤準備" },
  { key: "atm", label: "例を見る: ATMで現金を下ろす" },
] as const;

type StarterKey = (typeof STARTER_OPTIONS)[number]["key"];
type DemoSampleKey = (typeof DEMO_SAMPLE_OPTIONS)[number]["key"];
type SampleKey = StarterKey | DemoSampleKey;

type EditorRestorePoint = {
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  doc: FlowchartDocument;
  userTouched: boolean;
  hasInitialSnapshot: boolean;
};

type PendingConfirm =
  | { kind: "starter"; key: StarterKey; label: string }
  | { kind: "apply-preview"; label: string }
  | { kind: "import"; text: string };

function isStarterKey(key: string): key is StarterKey {
  return STARTER_OPTIONS.some((o) => o.key === key);
}

function isDemoSampleKey(key: string): key is DemoSampleKey {
  return DEMO_SAMPLE_OPTIONS.some((o) => o.key === key);
}

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
  /** モジュール選択中にユーザーが内容を上書きしたとき — 遅延 loadModule を無効化 */
  onInvalidatePendingModuleLoad?: () => void;
  pinOffline?: { pinned: boolean; onToggle: () => void };
  importBundle?: {
    disabled: boolean;
    disabledTitle?: string;
    onSelectFile: (file: File) => void;
  };
  resetFlow?: {
    onRequestReset: () => void;
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
    onInvalidatePendingModuleLoad,
    pinOffline,
    importBundle,
    resetFlow,
  } = props;

  const skipSnapshotHydrationRef = useRef(false);
  const userTouchedRef = useRef(false);
  const prePreviewRestoreRef = useRef<EditorRestorePoint | null>(null);

  const [moduleSamplePreviewActive, setModuleSamplePreviewActive] =
    useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null
  );

  const notifyUserContentOverride = useCallback(() => {
    if (workspaceMode && moduleId) {
      skipSnapshotHydrationRef.current = true;
      onInvalidatePendingModuleLoad?.();
    }
  }, [workspaceMode, moduleId, onInvalidatePendingModuleLoad]);

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
    moduleSelected ||
    (workspaceMode && samplePreviewActive) ||
    (workspaceMode && moduleSamplePreviewActive);
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

  const getDirtyInput = useCallback(
    () => ({
      userTouched: userTouchedRef.current,
      committedJson,
      hasInitialSnapshot: Boolean(initialSnapshot),
    }),
    [committedJson, initialSnapshot]
  );

  const clearModuleSamplePreview = useCallback(() => {
    setModuleSamplePreviewActive(false);
    prePreviewRestoreRef.current = null;
  }, []);

  const stashForPreviewRestore = useCallback(() => {
    prePreviewRestoreRef.current = {
      jsonText,
      committedJson,
      nodes,
      edges,
      doc,
      userTouched: userTouchedRef.current,
      hasInitialSnapshot: Boolean(initialSnapshot),
    };
  }, [jsonText, committedJson, nodes, edges, doc, initialSnapshot]);

  const runGenerate = useCallback(
    (text: string, options?: { persist?: boolean }) => {
      const shouldPersist = options?.persist ?? true;
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
      const baseStatus = `生成完了 — ノード ${result.placed.length} / エッジ ${result.edges.length}`;
      setStatus(
        shouldPersist ? baseStatus : `${baseStatus} — プレビュー（未保存）`
      );
      if (shouldPersist) {
        onSnapshotPersist?.();
        userTouchedRef.current = false;
      }
      return true;
    },
    [refreshWarnings, onSnapshotPersist]
  );

  useEffect(() => {
    skipSnapshotHydrationRef.current = false;
    userTouchedRef.current = false;
    clearModuleSamplePreview();
    setSamplePreviewActive(false);
  }, [moduleId, clearModuleSamplePreview]);

  useEffect(() => {
    if (workspaceMode) {
      if (moduleId && initialSnapshot && !skipSnapshotHydrationRef.current) {
        refreshWarnings(initial.doc.table);
        if (initial.jsonText) {
          runGenerate(initial.jsonText, { persist: false });
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
    notifyUserContentOverride();
    clearModuleSamplePreview();
    refreshWarnings(doc.table);
    runGenerate(jsonText, { persist: true });
  };

  const loadDocument = (
    sample: FlowchartDocument,
    options?: { persist?: boolean }
  ) => {
    syncJsonFromDoc(sample);
    refreshWarnings(sample.table);
    runGenerate(serializeDocument(sample), options);
  };

  const executeApplyStarter = useCallback(
    (key: StarterKey) => {
      if (workspaceMode && moduleId) notifyUserContentOverride();
      clearModuleSamplePreview();
      setSamplePreviewActive(false);
      loadDocument(SAMPLES[key], { persist: true });
    },
    [
      workspaceMode,
      moduleId,
      notifyUserContentOverride,
      clearModuleSamplePreview,
    ]
  );

  const handleApplyStarter = useCallback(
    (key: string) => {
      if (!isStarterKey(key)) return;
      const label = STARTER_OPTIONS.find((o) => o.key === key)?.label ?? "雛形";
      if (workspaceMode && moduleId && isModuleContentDirty(getDirtyInput())) {
        setPendingConfirm({ kind: "starter", key, label });
        return;
      }
      executeApplyStarter(key);
    },
    [workspaceMode, moduleId, getDirtyInput, executeApplyStarter]
  );

  const executePreviewSample = useCallback(
    (key: DemoSampleKey) => {
      if (workspaceMode && moduleId) {
        stashForPreviewRestore();
        notifyUserContentOverride();
        setModuleSamplePreviewActive(true);
        loadDocument(SAMPLES[key], { persist: false });
      } else {
        setSamplePreviewActive(true);
        loadDocument(SAMPLES[key], { persist: false });
      }
    },
    [workspaceMode, moduleId, stashForPreviewRestore, notifyUserContentOverride]
  );

  const handlePreviewSample = useCallback(
    (key: string) => {
      if (!isDemoSampleKey(key)) return;
      executePreviewSample(key);
    },
    [executePreviewSample]
  );

  const executeApplyPreview = useCallback(() => {
    notifyUserContentOverride();
    clearModuleSamplePreview();
    runGenerate(jsonText, { persist: true });
  }, [
    notifyUserContentOverride,
    clearModuleSamplePreview,
    runGenerate,
    jsonText,
  ]);

  const handleApplyPreviewToModule = useCallback(() => {
    const restore = prePreviewRestoreRef.current;
    const label = doc.title ?? "この例";
    if (
      restore &&
      isModuleContentDirty({
        userTouched: restore.userTouched,
        committedJson: restore.committedJson,
        hasInitialSnapshot: restore.hasInitialSnapshot,
      })
    ) {
      setPendingConfirm({ kind: "apply-preview", label });
      return;
    }
    executeApplyPreview();
  }, [doc.title, executeApplyPreview]);

  const handleCancelModulePreview = useCallback(() => {
    const restore = prePreviewRestoreRef.current;
    if (restore) {
      setDoc(restore.doc);
      setJsonText(restore.jsonText);
      setCommittedJson(restore.committedJson);
      setNodes(restore.nodes);
      setEdges(restore.edges);
      userTouchedRef.current = restore.userTouched;
      setParseErrors([]);
      setGenErrors([]);
      refreshWarnings(restore.doc.table);
      setStatus("プレビューを終了しました");
    }
    clearModuleSamplePreview();
  }, [refreshWarnings, clearModuleSamplePreview]);

  const executeImportText = useCallback(
    (text: string) => {
      notifyUserContentOverride();
      clearModuleSamplePreview();
      setSamplePreviewActive(false);
      setJsonText(text);
      const { doc: parsed } = parseFlowchartDocument(text);
      if (parsed) {
        setDoc(normalizeFlowchartDocument(parsed));
        refreshWarnings(parsed.table);
      }
      runGenerate(text, { persist: true });
      if (workspaceMode && !moduleId) {
        setSamplePreviewActive(true);
      }
    },
    [
      notifyUserContentOverride,
      clearModuleSamplePreview,
      refreshWarnings,
      runGenerate,
      workspaceMode,
      moduleId,
    ]
  );

  const handleConfirmReplace = useCallback(() => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);
    switch (action.kind) {
      case "starter":
        executeApplyStarter(action.key);
        break;
      case "apply-preview":
        executeApplyPreview();
        break;
      case "import":
        executeImportText(action.text);
        break;
    }
  }, [
    pendingConfirm,
    executeApplyStarter,
    executeApplyPreview,
    executeImportText,
  ]);

  const handleTableChange = (table: FlowchartDocument["table"]) => {
    if (readOnly) return;
    userTouchedRef.current = true;
    notifyUserContentOverride();
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
      if (workspaceMode && moduleId && isModuleContentDirty(getDirtyInput())) {
        setPendingConfirm({ kind: "import", text });
        return;
      }
      executeImportText(text);
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
      : showEditorPanes && moduleSamplePreviewActive
        ? "例をプレビュー中（未保存）"
        : showEditorPanes && !moduleSelected
          ? "サンプル表示（左でモジュールを選ぶと保存できます）"
          : null;

  const confirmDialog = (() => {
    if (!pendingConfirm) return null;
    switch (pendingConfirm.kind) {
      case "starter":
        return {
          title: "表を雛形で始め直しますか？",
          description: `いまの表は「${pendingConfirm.label}」に置き換わります。元に戻せません。`,
          confirmLabel: "雛形を適用",
        };
      case "apply-preview":
        return {
          title: "例をモジュールに適用しますか？",
          description: `いまの表は「${pendingConfirm.label}」で置き換わり、モジュールに保存されます。元に戻せません。`,
          confirmLabel: "モジュールに適用",
        };
      case "import":
        return {
          title: "表を読込ファイルで置き換えますか？",
          description:
            "いまの表とプレビューは読込 JSON の内容に置き換わり、モジュールに保存されます。元に戻せません。",
          confirmLabel: "置き換える",
        };
    }
  })();

  const exportDisabledTitle = !canExport
    ? isStale
      ? "先に「再生成」してください"
      : nodes.length === 0
        ? "先に再生成してプレビューを表示してください"
        : undefined
    : undefined;

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
        moduleSelected={moduleSelected}
        canExport={canExport}
        exportDisabledTitle={exportDisabledTitle}
        clearDraftDisabled={workspaceMode}
        clearDraftTitle={
          workspaceMode
            ? "モジュール単位の下書きは切替時に自動保存されます"
            : "ブラウザに保存した下書きを削除"
        }
        pinOffline={pinOffline}
        starters={[...STARTER_OPTIONS]}
        samples={[...DEMO_SAMPLE_OPTIONS]}
        onApplyStarter={handleApplyStarter}
        onPreviewSample={handlePreviewSample}
        onExportPng={() => void handleExportPng()}
        onExportSvg={() => void handleExportSvg()}
        onClearDraft={handleClearDraft}
        importBundle={importBundle}
        resetFlow={resetFlow}
      />

      {moduleSamplePreviewActive && moduleSelected && !readOnly ? (
        <>
          <button
            type="button"
            data-testid="apply-sample-preview"
            onClick={handleApplyPreviewToModule}
            className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100"
          >
            モジュールに適用
          </button>
          <button
            type="button"
            data-testid="cancel-sample-preview"
            onClick={handleCancelModulePreview}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            プレビューを終了
          </button>
        </>
      ) : null}

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
      {!readOnly ? (
        <CsvPastePanel
          onApply={handleCsvApply}
          onRegenerate={handleRegenerate}
        />
      ) : null}
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

  const replaceConfirmDialog =
    confirmDialog != null ? (
      <ConfirmReplaceDialog
        open
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={handleConfirmReplace}
        onCancel={() => setPendingConfirm(null)}
      />
    ) : null;

  if (workspaceMode) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {replaceConfirmDialog}
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
      {replaceConfirmDialog}
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

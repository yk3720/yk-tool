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
  type KeyboardEvent,
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
import { cn } from "@/lib/utils";
import { captureFlowPng } from "./exportPng";
import { captureFlowSvg } from "./exportSvg";
import { ConfirmReplaceDialog } from "./ConfirmReplaceDialog";
import { EditorMoreMenu } from "./EditorMoreMenu";
import { FlowCanvas, type FlowCanvasHandle } from "./FlowCanvas";
import {
  FC_WORKSPACE_MAIN_GRID,
  fcBadgeAccent,
  fcBadgeMuted,
  fcBorderB,
  fcBorderR,
  fcBtnAccent,
  fcBtnPrimary,
  fcBtnSecondary,
  fcEmptyHint,
  fcEmptyState,
  fcEmptyStateLg,
  fcEmptyStateMd,
  fcErrorBanner,
  fcErrorBannerLink,
  fcLink,
  fcMobileTabActive,
  fcMobileTabGroup,
  fcMobileTabIdle,
  fcPaneHeader,
  fcSectionTitle,
  fcStaleCallout,
  fcStaleOverlay,
  fcStaleRing,
  fcStaleRingInset,
  fcStatusDraftHint,
  fcStatusStaleLabel,
  fcStatusText,
  fcWarningBanner,
  fcWarningBannerHint,
  fcWarningBannerLink,
  fcModuleLoadingOverlay,
} from "./flowchartUiClasses";
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

const MOBILE_TAB_TABLE_ID = "flowchart-pane-tab-table";
const MOBILE_TAB_CANVAS_ID = "flowchart-pane-tab-canvas";
const MOBILE_PANEL_TABLE_ID = "flowchart-pane-panel-table";
const MOBILE_PANEL_CANVAS_ID = "flowchart-pane-panel-canvas";

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
  /** ワークスペース: モジュール読込中は表・プレビューを覆う */
  moduleLoading?: boolean;
};

const EMPTY_MODULE_MESSAGE = "モジュールを選択してください";
const EMPTY_MODULE_NAV_HINT =
  "← 左のナビでユニットを展開し、動作を選んでください";
const REGENERATE_HINT =
  "表を編集したあとは「再生成」でプレビューを更新します。";
const EMPTY_SAMPLE_HINT =
  "または「その他」→「サンプル（例）」から表と図を表示できます";
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
      nodes: [],
      edges: [],
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
    moduleLoading = false,
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
        if (!samplePreviewActive && !moduleSamplePreviewActive) {
          stashForPreviewRestore();
        }
        setSamplePreviewActive(true);
        loadDocument(SAMPLES[key], { persist: false });
      }
    },
    [
      workspaceMode,
      moduleId,
      stashForPreviewRestore,
      notifyUserContentOverride,
      samplePreviewActive,
      moduleSamplePreviewActive,
    ]
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
      userTouchedRef.current = restore.userTouched;
      setParseErrors([]);
      setGenErrors([]);
      refreshWarnings(restore.doc.table);
      runGenerate(restore.jsonText, { persist: false });
      setStatus("プレビューを終了しました");
    }
    clearModuleSamplePreview();
    setSamplePreviewActive(false);
  }, [refreshWarnings, clearModuleSamplePreview, runGenerate]);

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
    setStatus("JSON をダウンロードしました");
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
    if (nodes.length === 0) {
      setStatus("SVG: 先に再生成してプレビューを表示してください");
      return;
    }
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

  const handleMobileTabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPaneView("canvas");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPaneView("table");
      }
    },
    []
  );

  const canExport = !isStale && nodes.length > 0;
  const allErrors = [...parseErrors, ...genErrors];

  const previewModeHint =
    showEditorPanes && readOnly
      ? "閲覧者モード（プレビュー・PNG/SVG のみ）"
      : showEditorPanes && moduleSamplePreviewActive
        ? "例をプレビュー中（未保存）—「プレビューを終了」で戻れます"
        : showEditorPanes && samplePreviewActive
          ? "例をプレビュー中（未保存）—「プレビューを終了」で戻れます"
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
        className={cn(
          fcBtnPrimary,
          isStale && showEditorPanes && !readOnly ? fcStaleRing : ""
        )}
      >
        再生成
      </button>

      {!readOnly ? (
        <>
          <button
            type="button"
            onClick={handleSaveJson}
            className={fcBtnSecondary}
          >
            JSON をダウンロード
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={fcBtnSecondary}
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

      {((moduleSamplePreviewActive && moduleSelected) ||
        (samplePreviewActive && workspaceMode)) &&
      !readOnly ? (
        <>
          {moduleSamplePreviewActive && moduleSelected ? (
            <button
              type="button"
              data-testid="apply-sample-preview"
              onClick={handleApplyPreviewToModule}
              className={fcBtnAccent}
            >
              モジュールに適用
            </button>
          ) : null}
          <button
            type="button"
            data-testid="cancel-sample-preview"
            onClick={handleCancelModulePreview}
            className={fcBtnSecondary}
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
          ? cn("max-w-md text-right text-xs", fcStatusText)
          : "max-w-md text-right text-sm lg:max-w-xl"
      }
      role="status"
      aria-live="polite"
    >
      {isStale && (
        <span className={fcStatusStaleLabel}>プレビューは古い —</span>
      )}
      <span className={fcStatusText}>{status}</span>
      {!workspaceMode ? (
        <span className={fcStatusDraftHint}>（下書き自動保存）</span>
      ) : null}
    </p>
  );

  const errorBanner =
    allErrors.length > 0 ? (
      <div className={fcErrorBanner} role="alert">
        <ul className="list-inside list-disc">
          {allErrors.map((err) => (
            <li key={err}>
              <button
                type="button"
                onClick={() => jumpToError(err)}
                className={fcErrorBannerLink}
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
      <div className={fcWarningBanner}>
        <p className="font-medium">確認（警告）</p>
        <p className={fcWarningBannerHint}>{WARNING_BANNER_HINT}</p>
        <ul className="mt-1 list-inside list-disc">
          {warnings.map((w) => (
            <li key={w}>
              <button
                type="button"
                onClick={() => jumpToError(w)}
                className={fcWarningBannerLink}
              >
                {w}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const mobilePaneTabs = workspaceMode ? (
    <div className={cn("flex shrink-0", fcBorderB, "px-4 py-2 lg:hidden")}>
      <div
        className={fcMobileTabGroup}
        role="tablist"
        aria-label="表とプレビュー"
        onKeyDown={handleMobileTabKeyDown}
      >
        <button
          type="button"
          id={MOBILE_TAB_TABLE_ID}
          role="tab"
          aria-selected={paneView === "table"}
          aria-controls={MOBILE_PANEL_TABLE_ID}
          onClick={() => setPaneView("table")}
          className={cn(
            paneView === "table" ? fcMobileTabActive : fcMobileTabIdle
          )}
        >
          表
        </button>
        <button
          type="button"
          id={MOBILE_TAB_CANVAS_ID}
          role="tab"
          aria-selected={paneView === "canvas"}
          aria-controls={MOBILE_PANEL_CANVAS_ID}
          onClick={() => setPaneView("canvas")}
          className={cn(
            paneView === "canvas" ? fcMobileTabActive : fcMobileTabIdle
          )}
        >
          図
        </button>
      </div>
    </div>
  ) : null;

  const tablePaneBody = !showEditorPanes ? (
    <div className={fcEmptyState}>
      <p>{EMPTY_MODULE_MESSAGE}</p>
      {workspaceMode ? (
        <p className={fcEmptyHint}>{EMPTY_MODULE_NAV_HINT}</p>
      ) : null}
      <p className={fcEmptyHint}>{EMPTY_SAMPLE_HINT}</p>
    </div>
  ) : (
    <>
      {!readOnly ? <p className={fcEmptyHint}>{REGENERATE_HINT}</p> : null}
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
      ? cn(
          "relative flex min-h-[280px] flex-1 flex-col lg:min-h-0",
          isStale && fcStaleRingInset
        )
      : cn("relative min-h-[420px] flex-1", isStale && fcStaleRing);

    if (!showEditorPanes) {
      return (
        <div className={fullBleed ? fcEmptyStateLg : fcEmptyStateMd}>
          <p>{EMPTY_MODULE_MESSAGE}</p>
          {workspaceMode ? (
            <p className={fcEmptyHint}>{EMPTY_MODULE_NAV_HINT}</p>
          ) : null}
          <p className={fcEmptyHint}>{EMPTY_SAMPLE_HINT}</p>
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
            <div className={fcStaleOverlay}>
              <p className={fcStaleCallout}>
                入力が変更されています。{" "}
                <button
                  type="button"
                  onClick={() => headerRegenerateRef.current?.click()}
                  className={fcLink}
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
            ? cn(fcEmptyStateLg, "items-center justify-center text-center")
            : fcEmptyStateMd
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
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {replaceConfirmDialog}
        {mobilePaneTabs}
        <main
          className={cn("grid min-h-0 flex-1 gap-0", FC_WORKSPACE_MAIN_GRID)}
        >
          <section
            id={MOBILE_PANEL_TABLE_ID}
            role="tabpanel"
            aria-labelledby={MOBILE_TAB_TABLE_ID}
            className={cn("flex min-h-0 min-w-0 flex-col", fcBorderR, {
              "hidden lg:flex": paneView === "canvas",
              flex: paneView !== "canvas",
            })}
          >
            <header className={fcPaneHeader}>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-base font-semibold tracking-tight">
                      Flowchart Web
                    </h1>
                    <span className={fcBadgeAccent}>実用版</span>
                  </div>
                  {contextLabel ? (
                    <p className={cn("text-sm", fcStatusText)}>
                      <span className="font-medium text-flow-text-body">
                        {contextLabel}
                      </span>
                    </p>
                  ) : null}
                  {previewModeHint ? (
                    <p className={fcEmptyHint}>{previewModeHint}</p>
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
              <h2 className={cn("shrink-0", fcSectionTitle)}>表</h2>
              {tablePaneBody}
            </div>
          </section>

          <section
            id={MOBILE_PANEL_CANVAS_ID}
            role="tabpanel"
            aria-labelledby={MOBILE_TAB_CANVAS_ID}
            className={`flex min-h-0 min-w-0 flex-col ${
              paneView === "table" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div
              className={cn(
                "flex shrink-0 flex-wrap items-center gap-2",
                fcBorderB,
                "px-4 py-2 lg:hidden"
              )}
            >
              <h2 className={fcSectionTitle}>プレビュー</h2>
              {previewModeHint ? (
                <span className={fcBadgeMuted}>{previewModeHint}</span>
              ) : null}
            </div>
            <h2 className="sr-only">プレビュー</h2>
            <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-0">
              {renderPreviewCanvas(true)}
            </div>
          </section>
        </main>
        {moduleLoading ? (
          <div
            className={fcModuleLoadingOverlay}
            data-testid="module-loading-overlay"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            モジュールを読み込み中…
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {replaceConfirmDialog}
      <header className={cn(fcBorderB, "px-4 py-3")}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                Flowchart Web
              </h1>
              <span className={fcBadgeAccent}>実用版</span>
            </div>
            {contextLabel ? (
              <p className={cn("text-sm", fcStatusText)}>
                <span className="font-medium text-flow-text-body">
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

      <main className={cn("grid min-h-0 flex-1 gap-0", FC_WORKSPACE_MAIN_GRID)}>
        <section
          className={cn("flex min-h-[320px] flex-col gap-2 p-4", fcBorderR)}
        >
          <h2 className={fcSectionTitle}>表</h2>
          {tablePaneBody}
        </section>

        <section className="flex min-h-[320px] flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={fcSectionTitle}>プレビュー</h2>
            {previewModeHint ? (
              <span className={fcBadgeMuted}>{previewModeHint}</span>
            ) : null}
          </div>
          {renderPreviewCanvas(false)}
        </section>
      </main>
    </div>
  );
});

FlowchartEditor.displayName = "FlowchartEditor";

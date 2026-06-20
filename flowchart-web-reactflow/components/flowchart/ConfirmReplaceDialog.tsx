"use client";

import { fcDialogBody } from "./flowchartUiClasses";
import { FlowAlertDialog } from "./FlowAlertDialog";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 破壊的な表置換の確認（alertdialog · Cancel に初期フォーカス） */
export function ConfirmReplaceDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <FlowAlertDialog
      open={open}
      titleId="confirm-replace-title"
      title={title}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p id="confirm-replace-desc" className={fcDialogBody}>
        {description}
      </p>
    </FlowAlertDialog>
  );
}

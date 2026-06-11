/** モジュール選択中に破壊的読込（雛形適用・表取込等）の確認が要るか */
export type ModuleContentDirtyInput = {
  userTouched: boolean;
  committedJson: string;
  hasInitialSnapshot: boolean;
};

export function isModuleContentDirty(input: ModuleContentDirtyInput): boolean {
  return (
    input.userTouched || input.committedJson !== "" || input.hasInitialSnapshot
  );
}

import "server-only";

import { FIGURES, type Figure } from "@/data/figures";
import { hasDatabaseUrl } from "@/lib/diagram/db";
import { neonFigureRepository } from "@/lib/diagram/neon-repository";
import type { FigureStorageKind } from "@/lib/diagram/repository-types";

export type { FigureStorageKind };

export type FigureRepository = {
  list(): Promise<Figure[]>;
  remove(id: string): Promise<void>;
  updateMemo(id: string, memo: string): Promise<void>;
};

const mockRepository: FigureRepository = {
  async list() {
    return [...FIGURES];
  },
  async remove(_id: string) {
    // DATABASE_URL 未設定時は永続化しない
  },
  async updateMemo(_id: string, _memo: string) {
    throw new Error(
      "DATABASE_URL が未設定のためメモを保存できません。Neon を追加してください。",
    );
  },
};

export function getFigureStorageKind(): FigureStorageKind {
  return hasDatabaseUrl() ? "neon" : "mock";
}

export const figureRepository: FigureRepository = {
  async list() {
    if (hasDatabaseUrl()) {
      return neonFigureRepository.list();
    }
    return mockRepository.list();
  },
  async remove(id: string) {
    if (hasDatabaseUrl()) {
      return neonFigureRepository.remove(id);
    }
    return mockRepository.remove(id);
  },
  async updateMemo(id: string, memo: string) {
    if (hasDatabaseUrl()) {
      return neonFigureRepository.updateMemo(id, memo);
    }
    return mockRepository.updateMemo(id, memo);
  },
};

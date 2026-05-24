import { FIGURES, type Figure } from "@/data/figures";

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
    // 永続化は次フェーズ。モックでは no-op。
  },
  async updateMemo(_id: string, _memo: string) {
    // 永続化は次フェーズ。モックでは no-op。
  },
};

export const figureRepository: FigureRepository = mockRepository;

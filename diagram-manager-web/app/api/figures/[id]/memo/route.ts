import { NextResponse } from "next/server";
import { z } from "zod";

import { figureRepository, getFigureStorageKind } from "@/lib/diagram/repository";

const bodySchema = z.object({
  memo: z.string(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (getFigureStorageKind() !== "neon") {
    return NextResponse.json(
      { error: "DATABASE_URL が未設定です。Neon を追加してください。" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が不正です" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "memo が不正です" }, { status: 400 });
  }

  try {
    await figureRepository.updateMemo(id, parsed.data.memo);
    return NextResponse.json({ ok: true, id, memo: parsed.data.memo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存に失敗しました";
    const status = message.includes("見つかりません") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import Link from "next/link";

export const metadata = {
  title: "図解管理 — 移行のお知らせ",
};

/**
 * 旧 URL（/diagram-manager）向け。正本は diagram-manager-web（ルート `/`）。
 */
export default function DiagramManagerMovedPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold">図解管理は別アプリに移りました</h1>
      <p className="text-sm text-muted-foreground">
        図解管理ワークスペースは <code className="text-foreground">diagram-manager-web</code>{" "}
        として切り出されています。本番は Vercel の diagram-manager 用プロジェクト（Root
        Directory: <code className="text-foreground">diagram-manager-web</code>）を参照してください。
      </p>
      <section className="flex flex-col gap-2 text-sm">
        <p>
          <strong>ローカル開発:</strong>
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted px-3 py-2 text-xs">
          {`cd c:/yk-tool/diagram-manager-web\nnpm install\nnpm run dev`}
        </pre>
      </section>
      <p className="text-sm">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          採用管理サンプル（トップ）へ戻る
        </Link>
      </p>
    </main>
  );
}

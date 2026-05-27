import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthContext } from "@/lib/auth/session";
import { isAuthDisabled } from "@/lib/supabase/env";

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  if (isAuthDisabled()) {
    redirect("/");
  }

  const auth = await getAuthContext();
  if (auth) {
    redirect("/");
  }

  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/";

  return (
    <LoginForm
      nextPath={nextPath}
      authError={params.error === "auth"}
    />
  );
}

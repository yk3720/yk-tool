"use client";

import Link from "next/link";

import {
  fcAuthBar,
  fcAuthBarAdminLink,
  fcAuthBarDevBadge,
  fcAuthBarRoleBadge,
  fcAuthBarSignOutBtn,
} from "@/components/flowchart/flowchartUiClasses";
import { getRoleLabel, isAdminRole } from "@/lib/auth/roles";

import type { ProfileRole } from "@/lib/auth/types";

type Props = {
  email: string;
  role: ProfileRole;
  showDevBanner?: boolean;
};

export function AppAuthBar({ email, role, showDevBanner }: Props) {
  return (
    <div className={fcAuthBar}>
      {showDevBanner ? (
        <span className={fcAuthBarDevBadge}>認証オフ（ローカル）</span>
      ) : null}
      <span>
        {email}
        <span className={fcAuthBarRoleBadge}>{getRoleLabel(role)}</span>
      </span>
      {isAdminRole(role) ? (
        <Link
          href="/admin"
          data-testid="admin-nav-link"
          className={fcAuthBarAdminLink}
        >
          管理
        </Link>
      ) : null}
      <form action="/auth/signout" method="post" className="ml-auto">
        <button type="submit" className={fcAuthBarSignOutBtn}>
          ログアウト
        </button>
      </form>
    </div>
  );
}

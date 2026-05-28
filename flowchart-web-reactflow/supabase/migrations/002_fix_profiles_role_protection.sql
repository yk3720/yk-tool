-- ADR-013 DB-1 セキュリティ修正: profiles.role の自己昇格を防ぐ
--
-- 背景: profiles_update_link_self ポリシーは user_id の紐づけのみを意図しているが、
-- WITH CHECK が (user_id = auth.uid()) のみのため、role 列も自由に書き換えられる。
-- authenticated ロールの UPDATE 権限を user_id 列のみに制限することで解決する。

-- authenticated ロールの UPDATE 権限を全列から剥奪し、user_id 列のみ付与
revoke update on public.profiles from authenticated;
grant update (user_id) on public.profiles to authenticated;

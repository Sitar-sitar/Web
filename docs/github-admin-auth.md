# GitHub App 管理者認証

最終更新: 2026-09-05

## 構成

管理画面は GitHub App のユーザー認証を使い、GitHub の numeric user ID を `ADMIN_GITHUB_IDS` と照合します。管理APIは既存の `adminProcedure` でも同じ Allowlist を再確認します。

認証フロー:

1. GitHub Pages の `/admin` または `/admin/feedback` から Railway の `/api/auth/github` へ遷移する。
2. Railway が OAuth `state` を生成し、HttpOnly の一時 Cookie に保存する。
3. GitHub App の認可画面へ遷移する。
4. `/api/auth/github/callback` で `state` を検証し、認可コードを GitHub の user access token に交換する。
5. GitHub `/user` から numeric user ID を取得し、`ADMIN_GITHUB_IDS` と照合する。
6. 許可されたユーザーだけを `users` テーブルへ `role=admin` として保存し、12時間のアプリケーションセッションを発行する。
7. 以後の tRPC リクエストでもセッション署名、期限、GitHub ID Allowlist、`role=admin` を確認する。

GitHub access token はブラウザへ返さず、ユーザー情報取得後にサーバー側で破棄します。

## GitHub App 設定

GitHub の Developer settings で GitHub App を作成し、Web flow を利用します。

- Callback URL: `https://hoyoverse-builder-api-production.up.railway.app/api/auth/github/callback`
- 管理者判定にリポジトリ権限は使いません。GitHub App に不要な Repository permissions を与えないでください。
- 管理者の numeric user ID は GitHub API の `id` を使用し、変更可能なログイン名やメールアドレスは判定に使用しません。

## Railway 環境変数

```env
API_ONLY=true
CORS_ORIGINS=https://sitar-sitar.github.io
DATABASE_URL=<Railway MySQL URL>

GITHUB_APP_CLIENT_ID=<GitHub App Client ID>
GITHUB_APP_CLIENT_SECRET=<GitHub App Client Secret>
GITHUB_APP_CALLBACK_URL=https://hoyoverse-builder-api-production.up.railway.app/api/auth/github/callback
ADMIN_GITHUB_IDS=12345678,87654321
ADMIN_SESSION_SECRET=<32文字以上のランダム値>
ADMIN_FRONTEND_URL=https://sitar-sitar.github.io/Web/hoyoverse
```

`ADMIN_GITHUB_IDS` はカンマまたは空白区切りで複数指定できます。Allowlist からIDを削除すると、既存セッションのJWTが期限内でも次回APIアクセス時に拒否されます。

## 管理画面

- `/admin`: 管理者ポータル。検索数、キャッシュヒット率、未解決フィードバック、API状態を表示。
- `/admin/feedback`: 既存の翻訳フィードバック管理と検索Analytics。

## セキュリティ上の前提

- GitHub Client Secret と `ADMIN_SESSION_SECRET` はRailway環境変数だけに保存する。
- GitHub numeric user ID のAllowlistをサーバー側で管理する。
- OAuth `state` を一時Cookieと照合する。
- セッションCookieは HttpOnly / Secure / SameSite=None とし、GitHub PagesからRailway APIへのcredential付きtRPC通信に使う。
- 管理APIはフロント側表示制御だけに依存せず、`adminProcedure`で必ず拒否する。

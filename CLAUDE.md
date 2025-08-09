# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

UIGenは、ライブプレビュー機能付きのAI駆動Reactコンポーネントジェネレーターです。Claude Code Actionのサンプルプロジェクトとして構築されており、ユーザーがReactコンポーネントを説明すると、バーチャルファイルシステムを使用してリアルタイムで生成されます。

## 開発コマンド

### セットアップ
```bash
npm run setup
```
依存関係のインストール、Prismaクライアントの生成、データベースマイグレーションを実行します。

### 開発
```bash
npm run dev          # Turbopack使用の開発サーバー起動
npm run dev:daemon   # バックグラウンドで開発サーバー起動（ログはlogs.txtに出力）
```

### ビルドとリント
```bash
npm run build     # 本番用ビルド
npm run lint      # ESLint実行
```

### テスト
```bash
npm test          # Vitestテスト実行
```

### データベース
```bash
npm run db:reset  # データベースリセット（--forceフラグ付き）
```

## アーキテクチャ概要

### 基本構造
- **Next.js 15** with App Router and React 19
- **バーチャルファイルシステム**: `src/lib/file-system.ts`による（ディスクに書き込まない）メモリ内ファイル管理
- **リアルタイムチャット**: `src/app/api/chat/route.ts`経由のAnthropic Claude使用AI駆動コンポーネント生成
- **デュアルビュー**: 左にチャット、右にプレビュー/コードエディターの分割インターフェース

### 主要コンポーネントアーキテクチャ

**メインレイアウト** (`src/app/main-content.tsx`):
- 分割ペインインターフェースに`ResizablePanelGroup`を使用
- 全体を`FileSystemProvider`と`ChatProvider`でラップ
- プレビューとコードビューの切り替え

**バーチャルファイルシステム** (`src/lib/file-system.ts`):
- ディレクトリ/ファイル操作を含む完全なメモリ内ファイルシステム
- プロジェクト永続化のためのシリアル化/デシリアル化
- AI駆動ファイル操作のためのツール統合

**コンテキストプロバイダー**:
- `FileSystemProvider`: バーチャルファイル管理、AIからのツール呼び出し処理
- `ChatProvider`: チャット状態とAIインタラクション管理

**AI統合**:
- Vercel AI SDKとAnthropic Claudeを使用
- カスタムツール: ファイル操作用`str_replace_editor`と`file_manager`
- レスポンスをストリーミングし、自動的にデータベースに保存

### データベーススキーマ (Prisma/SQLite)
```
User: id, email, password, projects[]
Project: id, name, userId, messages (JSON), data (JSON)
```
- プロジェクトはチャットメッセージとバーチャルファイルシステムの状態をJSONとして保存
- `src/generated/prisma/`にPrismaクライアント生成

### テスト
- **Vitest** with jsdom環境
- コンポーネントテスト用React Testing Library
- 各モジュール内の`__tests__/`ディレクトリにテスト配置

### 認証
- `src/lib/auth.ts`のカスタムJWTベース認証
- オプション - APIキーなしでもモックレスポンスでアプリ動作

## 重要な注意事項

- これはClaude Code Actionsの**サンプルプロジェクト**です
- バーチャルファイルシステムのため、実際のファイルはディスクに書き込まれません
- ANTHROPIC_API_KEYなしでもプロジェクト実行可能（モックレスポンス使用）
- データベースはSQLiteで、ファイルは`prisma/dev.db`に配置
- コメントは控えめに。複雑なコードにのみコメントをつける
- Schemaが定義しているデータベースは @prisma/schema.prisma です。データベースに保存されているデータの構造を理解する必要があれば、いつでも参照できます。
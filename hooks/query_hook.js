import { query } from "@anthropic-ai/claude-code";
import path from "path";

const REVIEW_DIR = "src/queries";

async function main() {
  // 標準入力からJSONデータを読み込む
  const input = await new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });

  const hookData = JSON.parse(input);
  const toolInput = hookData.tool_input;

  // ./queriesディレクトリ内のファイル変更かどうかを確認
  const filePath = toolInput.file_path || toolInput.path;
  if (!filePath) {
    process.exit(0);
  }

  // パスを正規化して比較用に整形
  const normalizedFilePath = path.resolve(filePath);
  const queriesDir = path.resolve(process.cwd(), REVIEW_DIR);

  // ファイルがqueriesディレクトリ（サブディレクトリ含む）内かどうかを確認
  if (!normalizedFilePath.startsWith(queriesDir + path.sep)) {
    process.exit(0);
  }

  // 分析用プロンプトを作成
  const newContent = toolInput.content || toolInput.contents;
  const prompt = `You are reviewing a proposed change to a database query file.
Your task is to analyze if the new or modified query functions could be 
accomplished by reusing or slightly modifying existing query functions.

Within reason, we want to prevent duplicate queries from being added into this project,
so you are seeing if the proposed change will duplicate any existing functionality.

File: ${filePath}
New content:
<new_content>
${newContent}
</new_content>

Please research and analyze the existing queries in the ./queries directory and:
1. Identify any new query functions being added in this change
2. For each new query function, determine if it could be accomplished by:
   - Using an existing query function as-is
   - Slightly modifying an existing query function, perhaps by adding additional 
      arguments or expanding a select statement

If yes, provide specific feedback on which existing functions could be used instead. Be concise and specific.
If no, just say "Changes look appropriate."`;

  const messages = [];
  // Claude APIからのメッセージを非同期で受信
  for await (const message of query({
    prompt,
    abortController: new AbortController(),
  })) {
    messages.push(message);
  }

  // 分析結果を抽出
  const resultMessage = messages.find((m) => m.type === "result");
  if (!resultMessage || resultMessage.subtype !== "success") {
    process.exit(0);
  }

  // 変更が適切な場合はそのまま許可
  if (resultMessage.result.includes("Changes look appropriate")) {
    process.exit(0);
  }

  // それ以外の場合は重複のフィードバックを表示して終了
  console.error(`Query duplication detected:\n\n${resultMessage.result}`);
  process.exit(2);
}

main().catch((err) => {
  // フック実行時のエラーを表示
  console.error(`Hook error: ${err.message}`);
  process.exit(1);
});

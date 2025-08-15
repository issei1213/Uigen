import fs from "fs";

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  // デバッグ用：chunkの内容を外部ファイルに出力

  const debugData = {
    timestamp: new Date().toISOString(),
    chunks: chunks.map((chunk) => chunk.toString()),
    chunksRaw: chunks,
  };
  fs.writeFileSync("debug-chunks.json", JSON.stringify(debugData, null, 2));

  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());

  // デバッグ用：toolArgsの内容も外部ファイルに出力
  const toolArgsDebugData = {
    timestamp: new Date().toISOString(),
    toolArgs: toolArgs,
  };
  fs.writeFileSync(
    "debug-toolargs.json",
    JSON.stringify(toolArgsDebugData, null, 2),
  );

  // readPath is the path to the file that Claude is trying to read
  const readPath =
    toolArgs.tool_input?.file_path || toolArgs.tool_input?.path || "";

  // TODO: ensure Claude isn't trying to read the .env file
  if (readPath.includes(".env")) {
    console.error(".envファイルを読み込むことはできません");
    process.exit(2);
  }
}

main();

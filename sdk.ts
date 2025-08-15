import { query } from "@anthropic-ai/claude-code";

const prompt = "";

for await (const message of query({
  prompt,
})) {
  console.log(JSON.stringify(message, null, 2));
}

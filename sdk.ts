import { query } from "@anthropic-ai/claude-code";

const prompt = "Add a description to the package.json file";

for await (const message of query({
  prompt,
  options: {
    allowedTools: ["Edit"],
  },
})) {
  console.log(JSON.stringify(message, null, 2));
}

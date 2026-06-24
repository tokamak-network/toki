// Temp e2e smoke test: drive the MCP server over stdio like a real client.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/server.js"],
  env: { ...process.env, TOKI_NETWORK: process.env.TOKI_NETWORK || "mainnet" },
});
const client = new Client({ name: "smoke", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const apr = await client.callTool({ name: "toki_get_apr", arguments: {} });
console.log("\ntoki_get_apr →\n" + apr.content[0].text);

const ops = await client.callTool({ name: "toki_list_operators", arguments: { limit: 5 } });
const parsed = JSON.parse(ops.content[0].text);
console.log("\ntoki_list_operators → tokiPick:", parsed.tokiPick?.name, "(" + parsed.tokiPick?.commission_pct + "% fee)");
console.log("  top operators:", parsed.operators.slice(0, 3).map((o) => `${o.name}:${o.staked_TON}`).join(" | "));

const pos = await client.callTool({ name: "toki_staking_status", arguments: { address: "0xf9fa94d45c49e879e46ea783fc133f41709f3bc7" } });
console.log("\ntoki_staking_status →\n" + pos.content[0].text);

await client.close();
console.log("\n✅ e2e OK");

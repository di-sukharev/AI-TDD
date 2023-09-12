import { outro } from "@clack/prompts";

export async function exe(args: string[]) {
  const proc = Bun.spawnSync(args);

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  return { stdout, stderr, exitCode: proc.exitCode };
}

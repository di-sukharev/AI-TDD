export async function exe(args) {
  const process = Bun.spawnSync(args);

  const stdout = await new Response(process.stdout).text();
  const error = await new Response(process.stderr).text();

  if (process.exitCode !== 0) throw new Error(error);

  return stdout;
}

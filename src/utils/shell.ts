export async function exe(args: string[]) {
  const process = Bun.spawn(args); // todo: consider async

  const stdout = await new Response(process.stdout).text();
  const error = await new Response(process.stderr).text();

  if (process.exitCode !== 0) throw new Error(error);

  return stdout;
}

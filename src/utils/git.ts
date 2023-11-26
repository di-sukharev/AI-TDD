import { outro } from "@clack/prompts";
import { exe } from "./shell";

export const assertGitRepo = async () => {
  try {
    const { exitCode, stderr } = await exe(["git", "status"]);
    if (exitCode !== 0) throw new Error(stderr);
  } catch (error) {
    throw new Error(error as string);
  }
};

export const getIsGitRepo = async () => {
  try {
    const { exitCode } = await exe(["git", "status"]);
    return exitCode !== 0 ? false : true;
  } catch (error) {
    return false;
  }
};

export const getChangedFiles = async (): Promise<string[]> => {
  await assertGitRepo();

  const { stdout: modified } = await exe(["git", "ls-files", "--modified"]);
  const { stdout: others } = await exe([
    "git",
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);

  const files = [...modified.split("\n"), ...others.split("\n")].filter(
    (file) => !!file
  );

  return files.sort();
};

export const getDiff = async ({ files }: { files: string[] }) => {
  const lockFiles = files.filter(
    (file) =>
      file.includes(".lock") ||
      file.includes("-lock.") ||
      file.includes(".svg") ||
      file.includes(".png") ||
      file.includes(".jpg") ||
      file.includes(".jpeg") ||
      file.includes(".webp") ||
      file.includes(".gif")
  );

  if (lockFiles.length) {
    outro(
      `Some files are excluded by default from 'git diff'. No commit messages are generated for this files:\n${lockFiles.join(
        "\n"
      )}`
    );
  }

  const filesWithoutLocks = files.filter(
    (file) => !file.includes(".lock") && !file.includes("-lock.")
  );

  const { stdout: diff } = await exe([
    "git",
    "diff",
    "--staged",
    "--",
    ...filesWithoutLocks,
  ]);

  return diff;
};

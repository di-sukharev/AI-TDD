import { outro } from "@clack/prompts";
import { execa } from "execa";
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

// const excludeBigFilesFromDiff = ['*-lock.*', '*.lock'].map(
//   (file) => `:(exclude)${file}`
// );

// export const getAITDDIgnore = (): Ignore => {
//   const ig = ignore();

//   try {
//     ig.add(readFileSync(".ai-tddignore").toString().split("\n"));
//   } catch (e) {}

//   return ig;
// };

// export const getCoreHooksPath = async (): Promise<string> => {
//   const { stdout } = await execa("git", ["config", "core.hooksPath"]);

//   return stdout;
// };

// export const getStagedFiles = async (): Promise<string[]> => {
//   const { stdout: gitDir } = await execa("git", [
//     "rev-parse",
//     "--show-toplevel",
//   ]);

//   const { stdout: files } = await execa("git", [
//     "diff",
//     "--name-only",
//     "--cached",
//     "--relative",
//     gitDir,
//   ]);

//   if (!files) return [];

//   const filesList = files.split("\n");

//   const ig = getAITDDIgnore();
//   const allowedFiles = filesList.filter((file) => !ig.ignores(file));

//   if (!allowedFiles) return [];

//   return allowedFiles.sort();
// };

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

// export const gitAdd = async ({ files }: { files: string[] }) => {
//   const gitAddSpinner = spinner();
//   gitAddSpinner.start('Adding files to commit');
//   await execa('git', ['add', ...files]);
//   gitAddSpinner.stop('Done');
// };

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

  const { stdout: diff } = await execa("git", [
    "diff",
    "--staged",
    "--",
    ...filesWithoutLocks,
  ]);

  return diff;
};

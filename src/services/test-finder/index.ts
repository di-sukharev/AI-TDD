/*
    This service finds test(s) to operate on
*/

import { isCancel, note, select, text } from "@clack/prompts";
import chalk from "chalk";
import { assertGitRepo, getChangedFiles } from "../../utils/git";
import { outroError } from "../../utils/prompts";

class TestFinder {
  private async getTestFilesInGit() {
    try {
      const changedFiles = await getChangedFiles();
      const testFilePattern = /\.((test|spec)\..+)$/;

      const changedTestFiles = changedFiles.filter((file) =>
        file.match(testFilePattern)
      );

      return changedTestFiles;
    } catch (error) {
      outroError("Failed to find changed files via git");
      return null;
    }
  }

  private async selectChangedFileInGit(): Promise<string | null> {
    try {
      await assertGitRepo();
    } catch (err) {
      throw new Error("NOT_A_GIT_REPO");
    }

    const testFiles = await this.getTestFilesInGit();

    if (testFiles === null) throw new Error("FILE_NOT_FOUND");

    if (testFiles.length === 0) return null;

    const selectedFilePath = await select({
      message: chalk.cyan("Select a test file to run:"),
      options: testFiles.map((file) => ({ value: file, label: file })),
    });

    if (isCancel(selectedFilePath)) return process.exit(1);

    if (!selectedFilePath) throw new Error("FILE_NOT_SELECTED");

    return selectedFilePath as string;
  }

  private findAllTestFilesInGit() {}

  private async findTestFileByPath() {
    const testFilePath = await text({
      message: "Provide a test file path:",
      placeholder: "__tests__/path/to/your.test.file",
      // initialValue: "42",
      validate(value) {
        if (value.length === 0) return `Path is required`;
      },
    });

    return testFilePath.toString();
  }

  async find() {
    try {
      const testFile = await this.selectChangedFileInGit();

      if (!testFile) return await this.findTestFileByPath();

      return testFile;
    } catch (error) {
      note("Could not find test files via git");
      return await this.findTestFileByPath();
    }
  }
}

export const testFinder = new TestFinder();

/*
    This service tries to solve a test file
*/

import { testSolverAgent } from "../../ai-agents/test-solver";
import { CodeToWrite } from "../../types";
import { fileManagerService } from "../file-manager/fileManagerService";

class TestSolverService {
  async solve({
    testFilePath,
    testRelevantFilePaths,
    error,
    clarifications,
  }: {
    testFilePath: string;
    testRelevantFilePaths?: string[];
    error: string;
    clarifications?: string;
  }): Promise<CodeToWrite[]> {
    // TODO: use clarifications

    const testFileCode = await fileManagerService.readFileContent(testFilePath);

    if (!testFileCode) throw new Error("FILE_NOT_FOUND");

    console.log({ testRelevantFilePaths });

    const testRelevantFilesCode = testRelevantFilePaths
      ? await Promise.all(
          testRelevantFilePaths.map(async (path) => ({
            code: await fileManagerService.readFileContent(path),
            path,
          }))
        )
      : [];

    const filesToWrite = await testSolverAgent.solve({
      testFile: { path: testFilePath, code: testFileCode },
      relevantFiles: testRelevantFilesCode,
      error,
    });

    return filesToWrite;
  }
}

export const testSolver = new TestSolverService();

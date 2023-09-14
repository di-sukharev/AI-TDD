/*
    This service tries to solve a test file
*/

import { testSolverAgent } from "../../ai-agents/test-solver";
import { CodeToWrite } from "../../types";
import { fileManagerService } from "../file-manager";

class TestSolverService {
  async solve(
    testFilePath: string,
    testRelevantFilePaths: string[],
    error: string,
    clarifications?: string
  ): Promise<CodeToWrite[]> {
    // TODO: use clarifications

    const testFileCode = await fileManagerService.readFileContent(testFilePath);

    if (!testFileCode) throw new Error("FILE_NOT_FOUND");

    const testRelevantFilesCode = await Promise.all(
      testRelevantFilePaths.map((path) =>
        fileManagerService.readFileContent(path)
      )
    );

    const testRelevantFilesWithCode = testRelevantFilesCode.map((code, i) => ({
      path: testRelevantFilePaths[i],
      code,
    }));

    const testFileWithCode = { path: testFilePath, code: testFileCode };

    const filesToWrite = await testSolverAgent.solve(
      testFileWithCode,
      testRelevantFilesWithCode,
      error
    );

    return filesToWrite;
  }
}

export const testSolver = new TestSolverService();

/*
    This service tries to solve a test file
*/

import { testSolverAgent } from "../../ai-agents/test-solver";
import { CodeToWrite } from "../../types";
import { fileManagerService } from "../file-manager/fileManagerService";

interface testRelevantFile {
  name: string;
  from: string;
  declarations: {
    from: string;
    declaration: string;
  }[];
}

class TestSolverService {
  async solve({
    testFilePath,
    testRelevantFiles,
    error,
    clarifications,
  }: {
    testFilePath: string;
    testRelevantFiles?: testRelevantFile[];
    error: string;
    clarifications?: string;
  }): Promise<CodeToWrite[]> {
    // TODO: use clarifications

    const testFileCode = await fileManagerService.readFileContent(testFilePath);

    if (!testFileCode) throw new Error("FILE_NOT_FOUND");

    const relevantFiles = testRelevantFiles?.map((file) => ({
      path: file.from,
      code: file.declarations.reduce(
        (acc, func) => `${acc}\n// ...other code\n ${func.declaration}`,
        ""
      ),
    }));

    const filesToWrite = await testSolverAgent.solve({
      testFile: { path: testFilePath, code: testFileCode },
      relevantFiles,
      error,
    });

    return filesToWrite;
  }
}

export const testSolver = new TestSolverService();

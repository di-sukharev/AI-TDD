/*
    This service runs test(s)
*/

import { note } from "@clack/prompts";
import { exe } from "../../utils/shell";

class ProjectLearnerService {
  async init() {
    try {
      const { stdout, stderr, exitCode } = await exe(["ls"]);

      if (stderr) note(stderr);

      return {
        message: stdout || stderr,
        failed: exitCode !== 0,
      };
    } catch (error) {
      return {
        message: error as string,
        failed: true,
      };
    }
  }
}

export const projectLearnerService = new ProjectLearnerService();

import { expect, test, mock } from "bun:test";
import { projectLearnerService } from ".";

test("calls openAI api with file import paths and gets shell commands to be executed to find actual functions/methods declarations", async () => {
  await projectLearnerService.init();
});

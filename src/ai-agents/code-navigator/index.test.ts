import { expect, test, mock } from "bun:test";
import { codeNavigator } from ".";

test("call's openAI api with file import paths and gets shell commands to be executed to find actual functions/methods declarations", async () => {
  const commands = await codeNavigator.getCommandsToFindImportedMethods();
});

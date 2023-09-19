import { expect, test, mock } from "bun:test";
import { unlink } from "node:fs/promises";

import { codeNavigatorService } from ".";

test("gets .js file path, extracts imported modules as paths and reads content of the imported modules, skips imports that are not being called", async () => {
  const filePath = "__tests__/sandbox/dummy-file.js";

  const imports = [
    {
      name: "SomeFunction",
      from: "__tests__/sandbox/SomeFunction.js",
    },
    {
      name: "NotCalledFunction",
      from: "__tests__/sandbox/utils.js",
    },
  ];

  for (const func of imports) {
    await Bun.write(
      func.from,
      `function ${func.name}({arg1, arg2}) {
        const a = 1;
        const b = 2;

        return true;
    }`
    );
  }

  await Bun.write(
    filePath,
    [
      ...imports.map((imp) => `import ${imp.name} from "${imp.from}"`),
      `function init() {
        const response = ${imports[0].name}({arg1: "test", arg2: 2});
      }`,
    ].join("\n")
  );

  const importedFunctionDeclarations =
    await codeNavigatorService.findImportedFunctionDeclarationsForFile(
      filePath
    );

  console.log({ importedFunctionDeclarations });

  expect(importedFunctionDeclarations).toMatchObject([
    {
      ...imports,
      declaration: `function ${imports[0].name}({arg1, arg2}) {
    const a = 1;
    const b = 2;

    return true;
}`,
    },
  ]);

  // delete all files in the sandbox
  await unlink(filePath);
  for (const func of imports) await unlink(func.from);
});

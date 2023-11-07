/*
    This service searches (greps) the code occurrences
*/

import path from "path/posix";
import { exe } from "../../utils/shell";
import { fileManipulator } from "../file-manager/fileManagerService";

interface FileImport {
  name: string;
  from: string;
}

interface FunctionCalls {
  calls: string[];
  name: string;
}

type SUPPORTED_LANGUAGES = "js" | "ts";

class CodeNavigatorService {
  private extractImportsFromFileJSTS() {
    const moduleConfiguration = "ESM"; // TODO: make configurable

    const COMMONJS_REGEX =
      /const\s+{([^}]+)}\s+=\s+require\s*\(['"]([^'"]+)['"]\)/g;
    const ESM_REGEX =
      /import\s+(?:(\*\s+as\s+)?([a-zA-Z0-9_$]+)|{([^}]+)})?\s+from\s+['"]([^'"]+)['"]/g;

    return moduleConfiguration === "ESM" ? ESM_REGEX : COMMONJS_REGEX;
  }

  private async extractImportsFromFile(filePath: string) {
    const fileContent = await fileManipulator.readFileContent(filePath);
    if (!fileContent) return null;

    const fileExtension = path.extname(filePath).replace(".", "");

    const extToRegexp: Record<SUPPORTED_LANGUAGES, RegExp | (() => RegExp)> = {
      js: this.extractImportsFromFileJSTS,
      ts: this.extractImportsFromFileJSTS,
    };

    const getter = extToRegexp[fileExtension as SUPPORTED_LANGUAGES];

    const regex = typeof getter === "function" ? getter() : getter;

    const matches: FileImport[] = [];

    let match;

    while ((match = regex.exec(fileContent)) !== null) {
      const [_full, _as, name, multipleNames, from] = match;

      const imports = multipleNames
        ? multipleNames.split(",").map((str) => str.trim())
        : [name];

      imports.forEach((name) => {
        if (name) {
          matches.push({ name, from });
        }
      });
    }

    return matches;
  }

  private async findFunctionDeclaration(func: { from: string; call: string }) {
    const declarations = [];

    const regexpToMatchFunctionDeclarations = new RegExp(
      `^.*${func.call}.*([A-z0-9]+)?\\s*\\((?:[^)(]+|\\((?:[^)(]+|\\([^)(]*\\))*\\))*\\)\\s*\\{(?:[^}{]+|\\{(?:[^}{]+|\\{[^}{]*\\})*\\})*\\}`,
      "gm"
    );

    const fileContent = await fileManipulator.readFileContent(func.from);

    if (!fileContent) return null;

    let match;
    while (
      (match = regexpToMatchFunctionDeclarations.exec(fileContent)) !== null
    ) {
      const [full] = match;

      declarations.push({ from: func.from, declaration: full });
    }

    return declarations[0]; // todo: are there multiple declarations available in Java, etc?
  }

  private findFunctionCallsInFile(fileContent: string, functionName: string) {
    const calls = [];

    // TODO: split to different languages

    const regexToMatchFunctionCalls = new RegExp(
      `^.*${functionName}\\.?([\\.\\S]*)\\([\\S\\s]*?\\);$`,
      "gm"
    );

    let match;
    while ((match = regexToMatchFunctionCalls.exec(fileContent)) !== null) {
      const [_full, method] = match;

      calls.push(method ? method.trim() : functionName);
    }

    const uniqueCalls = new Set(calls);

    return Array.from(uniqueCalls);
  }

  // TODO: improve
  private filterExternalImports(imports: FileImport[]) {
    return imports.filter((imp) => imp.from.includes("examples"));
  }

  async findImportsInFile(filePath: string) {
    const imports = await this.extractImportsFromFile(filePath);

    return imports;
  }

  async findImportDeclarationsForFile(filePath: string) {
    const fileContent = await fileManipulator.readFileContent(filePath);
    if (!fileContent) return null;

    const imports = await this.findImportsInFile(filePath);
    if (!imports) return null;

    const importWithCalls = imports.map(({ from, name }) => {
      // TODO: take only those calls that exist in failing test
      const calls = this.findFunctionCallsInFile(fileContent, name);

      return { from, name, calls };
    });

    const functionCalls = importWithCalls.filter((f) =>
      Boolean(f.calls.length)
    );

    const functionDeclarations = [];
    for (const call of functionCalls) {
      const declarations = await Promise.all(
        call.calls.map(
          (cl) =>
            this.findFunctionDeclaration({ call: cl, from: call.from + ".ts" }) // todo: find extension
        )
      );

      functionDeclarations.push({
        name: call.name,
        from: call.from + ".ts", // todo: tell extension
        declarations: declarations.filter(Boolean),
      });
    }

    return functionDeclarations;
  }
}

export const codeNavigatorService = new CodeNavigatorService();

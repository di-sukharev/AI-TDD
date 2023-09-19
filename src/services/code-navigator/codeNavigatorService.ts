/*
    This service searches (greps) the code occurrences
*/

import { exe } from "../../utils/shell";
import { fileManagerService } from "../file-manager/fileManagerService";

interface FileImport {
  name: string;
  from: string;
}

interface FunctionCalls {
  calls: string[];
  from: string;
}

class CodeNavigatorService {
  private extractImportsFromFile(code: string) {
    // const get file extension with `const [_, extension] = split(".")` and adapt for java, rust, go, kotlin.

    const COMMONJS_REGEX =
      /const\s+{([^}]+)}\s+=\s+require\s*\(['"]([^'"]+)['"]\)/g;
    const ESM_REGEX =
      /import\s+(?:(\*\s+as\s+)?([a-zA-Z0-9_$]+)|{([^}]+)})?\s+from\s+['"]([^'"]+)['"]/g;

    const matches: FileImport[] = [];

    const moduleConfiguration = "ESM";

    let regex;
    if (moduleConfiguration === "ESM") {
      regex = ESM_REGEX;
    } else if (moduleConfiguration === "CommonJS") {
      regex = COMMONJS_REGEX;
    } else {
      throw new Error("Invalid module type");
    }

    let match;

    while ((match = regex.exec(code)) !== null) {
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

  // TODO: not working
  private async findFunctionDeclarations(fileImports: FileImport[]) {
    const declarations: (FileImport & { declaration: string })[] = [];

    for (const fileImport of fileImports) {
      const regexpToMatchFunctionDeclarations = new RegExp(
        `^.*${fileImport.name}.*\\(.*\\).*{[\\s\\S]*?}\\s*$`,
        "gm"
      );

      const fileContent = await fileManagerService.readFileContent(
        fileImport.from
      );

      if (!fileContent) continue;

      let match;
      while (
        (match = regexpToMatchFunctionDeclarations.exec(fileContent)) !== null
      ) {
        const [row] = match;
        declarations.push({
          from: fileImport.from,
          name: fileImport.name,
          declaration: row,
        });
      }

      return declarations;
    }
  }

  private findFunctionCalls(functionName: string, fileContent: string) {
    const functionCalls: string[] = [];

    const regexToMatchFunctionCalls = new RegExp(
      `${functionName}(\\.\\w+)?\\([\\s\\S]*?\\)(?=\\s*\\/\\/|$)`,
      "gm"
    );

    let match;
    while ((match = regexToMatchFunctionCalls.exec(fileContent)) !== null) {
      const [row] = match;
      functionCalls.push(row);
    }

    return functionCalls;
  }

  private extractAbsolutePathFromFilePath(filePath: string): string | null {
    const folders = filePath.split("/");

    if (!folders.length) return null;

    const fileName = folders.pop();

    if (!fileName) return null;

    return folders.join("/");
  }

  private mapRelativeImportsToAbsolute(
    imports: FileImport[],
    relativePath: string
  ) {
    return imports.map((imp) => ({
      name: imp.name,
      from:
        imp.from[0] === "."
          ? this.extractAbsolutePathFromFilePath(relativePath) +
            imp.from.slice(1)
          : imp.from,
    }));
  }

  private filterExternalImports(imports: FileImport[]) {
    return imports.filter((imp) => imp.from.includes("src"));
  }

  async findImportsForFile(filePath: string) {
    const fileContent = await fileManagerService.readFileContent(filePath);

    if (!fileContent) return null;

    const imports = this.extractImportsFromFile(fileContent);

    const absoluteImports = this.mapRelativeImportsToAbsolute(
      imports,
      filePath
    );

    const filteredImports = this.filterExternalImports(absoluteImports);

    return filteredImports;
  }

  // TODO: not working yet
  async findImportedFunctionDeclarationsForFile(filePath: string) {
    const fileContent = await fileManagerService.readFileContent(filePath);

    if (!fileContent) return null;

    const imports = this.extractImportsFromFile(fileContent);

    const functionCalls = imports.map(({ from, name }) => ({
      from,
      calls: this.findFunctionCalls(name, fileContent),
    }));

    const functionDeclarations = await this.findFunctionDeclarations(imports);

    return functionDeclarations;
  }
}

export const codeNavigatorService = new CodeNavigatorService();

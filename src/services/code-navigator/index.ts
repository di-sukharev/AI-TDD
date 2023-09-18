/*
    This service searches (greps) the code occurrences
*/

import { exe } from "../../utils/shell";
import { fileManagerService } from "../file-manager";

interface FileImport {
  functionImport: string;
  from: string;
}

interface FunctionCalls {
  calls: string[];
  from: string;
}

class CodeNavigatorService {
  // TODO: use codeNavigatorAgent instead
  private extractImportsFromFile(fileContent: string) {
    // const get file extension with const [_, extension] = split(".")

    const ESM_REGEX = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    const COMMONJS_REGEX =
      /const\s+{([^}]+)}\s+=\s+require\s*\(['"]([^'"]+)['"]\)/g;

    const imports: FileImport[] = [];

    const module = "ESM"; // Change this to "CommonJS" for CommonJS modules

    let regex;
    if (module === "ESM") {
      regex = ESM_REGEX;
    } else if (module === "CommonJS") {
      regex = COMMONJS_REGEX;
    } else {
      throw new Error("Invalid module type");
    }

    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const importItems = match[1];
      const importPath = match[2];

      // Split the import items and trim each one
      const items = importItems.split(",").map((item) => item.trim());

      // Create an object for each import item
      items.forEach((item) =>
        imports.push({ functionImport: item, from: importPath })
      );
    }

    return imports;
  }

  // TODO: not working
  private async findFunctionDeclarations(fileImports: FileImport[]) {
    const functionCalls: string[] = [];

    for (const fileImport of fileImports) {
      const regexpToMatchFunctionDeclarations = new RegExp(
        `^.*${fileImport.functionImport}.*\\(.*\\).*{[\\s\\S]*?}\\s*$`,
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
        functionCalls.push(row);
      }
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

  async findImportsForFile(filePath: string) {
    const fileContent = await fileManagerService.readFileContent(filePath);

    if (!fileContent) return null;

    const imports = this.extractImportsFromFile(fileContent);

    return imports;
  }

  // TODO: not working
  async findImportsDeclarationsForFile(filePath: string) {
    const fileContent = await fileManagerService.readFileContent(filePath);

    if (!fileContent) return null;

    const imports = this.extractImportsFromFile(fileContent);

    const functionCalls = imports.map(({ from, functionImport }) => ({
      from,
      calls: this.findFunctionCalls(functionImport, fileContent),
    }));

    const functionDeclarations = await this.findFunctionDeclarations(imports);

    return functionDeclarations;
  }
}

export const codeNavigatorService = new CodeNavigatorService();

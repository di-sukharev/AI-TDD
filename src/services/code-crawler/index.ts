/*
    This service searches (greps) the code occurrences
*/

import { exe } from "../../utils/shell";
import { fileManagerService } from "../file-manager";

interface FileImport {
  import: string;
  from: string;
}

interface ImportOccurrence {
  row: string;
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
      items.forEach((item) => imports.push({ import: item, from: importPath }));
    }

    return imports;
  }

  // TODO: use codeNavigatorAgent instead
  private async extractCallsFromImports(importOccurrences: ImportOccurrence[]) {
    for (const occurrence of importOccurrences) {
      const { stdout } = await exe([
        "awk",
        `'/${occurrence.from}\(/ {flag=1;count=0} flag {print; if ($0 ~ /{/) count++; if ($0 ~ /}/) count--; if (count == 0) flag=0}'`,
        occurrence.row,
      ]);

      console.log({ stdout });
    }
  }

  // TODO: use codeNavigatorAgent instead
  private findImportOccurrences(imports: FileImport[], fileContent: string) {
    const occurrences: ImportOccurrence[] = [];

    for (const { import: importName, from: importPath } of imports) {
      // TODO: simplify the regexp, to only catch line before \n
      const regex = new RegExp(
        `\\b${importName}(?:\\.[a-zA-Z0-9_]+)?\\([^)]*\\)`,
        "g"
      );

      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        const [row] = match;
        occurrences.push({
          row,
          from: importPath,
        });
      }
    }

    return occurrences;
  }

  async findImportsInFile(filePath: string) {
    const fileContent = await fileManagerService.readFileContent(filePath);

    if (!fileContent) return null;

    const imports = this.extractImportsFromFile(fileContent);

    const importsOccurrences = this.findImportOccurrences(imports, fileContent);

    await this.extractCallsFromImports(importsOccurrences);

    return importsOccurrences;
  }
}

export const codeNavigatorService = new CodeNavigatorService();

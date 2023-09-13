/*
    This service searches (greps) the code occurrences
*/

import { fileManager } from "../file-manager";

interface FileImport {
  import: string;
  from: string;
}

type ImportOccurrence = {
  row: string;
  from: string;
};

class CodeCrawler {
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
      items.forEach((item) => {
        imports.push({
          import: item,
          from: importPath,
        });
      });
    }

    return imports;
  }

  private async extractCallsFromImports(filePaths: string) {
    // const get file type with `type
    // awk '/async findImportsInFile\(/ {flag=1;count=0} flag {print; if ($0 ~ /{/) count++; if ($0 ~ /}/) count--; if (count == 0) flag=0}' src/services/code-crawler/index.ts
  }

  private findImportOccurrences(imports: FileImport[], fileContent: string) {
    const occurrences: ImportOccurrence[] = [];

    for (const { import: importName, from: importPath } of imports) {
      // Create a regex to find method calls or direct calls for this import
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
    const fileContent = await fileManager.readFileContent(filePath);
    console.log({ fileContent });
    if (!fileContent) return null;

    const imports = this.extractImportsFromFile(fileContent);
    console.log({ imports });
    const importsOccurrences = this.findImportOccurrences(imports, fileContent);

    console.log({ importsOccurrences });

    return importsOccurrences;
  }
}

export const codeCrawler = new CodeCrawler();

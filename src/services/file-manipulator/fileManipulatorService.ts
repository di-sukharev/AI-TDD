/* This service manipulates code: replaces, prepends, appends lines */

import fs from "node:fs/promises";

interface IContent {
  row: string;
  action: "replace" | "append" | "prepend";
  with: string;
}

interface FileToManipulate {
  filePath: string;
  content: IContent[];
}

class FileManipulator {
  private extractDirsFromFilePath(filePath: string): string | null {
    const folders = filePath.split("/");

    if (!folders.length) return null;

    const fileName = folders.pop();

    if (!fileName) return null;

    return folders.join("/");
  }

  async createFile(filePath: string, content?: string) {
    try {
      await Bun.write(filePath, content ?? "");
    } catch (error: any) {
      // directory does not exist, create one
      if (error.code === "ENOENT") {
        const directory = this.extractDirsFromFilePath(filePath);

        if (!directory) throw error;

        await fs.mkdir(directory);
        await this.createFile(filePath, content);
      }
    }
  }

  async writeFile(filePath: string, content: string) {
    await Bun.write(filePath, content);
  }

  async readFileContent(filePath: string): Promise<string | null> {
    const file = Bun.file(filePath);

    const isFileExists = await file.exists();

    if (!isFileExists) return null;

    const text = await file.text();

    return text;
  }

  // TODO: make this async write in place for better performance
  manipulateFileContent(currentContent: string, newContent: IContent) {
    const lines = currentContent.split("\n");
    const newLines: string[] = [];
    for (const line of lines) {
      if (!line.includes(newContent.row)) {
        newLines.push(line);
        continue;
      }

      if (newContent.action === "replace") {
        newLines.push(newContent.with);
      } else if (newContent.action === "append") {
        newLines.push(line);
        newLines.push(newContent.with);
      } else if (newContent.action === "prepend") {
        newLines.push(newContent.with);
        newLines.push(line);
      } else {
        throw new Error("UNKNOWN_CONTENT_ACTION");
      }
    }

    return newLines.join("\n");
  }

  async writeFileContent(filePath: string, modifications: IContent[]) {
    const currentContent = await this.readFileContent(filePath);

    for (const modification of modifications) {
      try {
        if (!currentContent) {
          await this.createFile(filePath, modification.with);
        } else {
          const contentToWrite = this.manipulateFileContent(
            currentContent,
            modification
          );

          await this.writeFile(filePath, contentToWrite);

          return `${filePath}: success`;
        }
      } catch (error) {
        return `${filePath}: ${error}`;
      }
    }
  }

  async manage(files: FileToManipulate[]) {
    const outputs = [];
    for (const file of files)
      outputs.push(await this.writeFileContent(file.filePath, file.content));

    return outputs;
  }
}

export const fileManipulator = new FileManipulator();

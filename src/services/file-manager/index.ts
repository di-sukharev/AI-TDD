/*
    This service manipulates the code in current repo: replaces, prepends, appends lines
*/

interface IContent {
  target: string;
  action: "replace" | "append" | "prepend";
  with: string;
}

interface FileToManipulate {
  filePath: string;
  content: IContent;
}

class FileManager {
  async createFile(filePath: string, content?: string) {
    await Bun.write(filePath, content ?? "");
  }

  async writeFile(filePath: string, content: string) {
    await Bun.write(filePath, content);
  }

  async readFileContent(filePath: string): Promise<string | null> {
    const file = Bun.file(filePath);

    if (!file.exists) return null;

    const text = await file.text();

    return text;
  }

  manipulateFileContent(currentContent: string, newContent: IContent) {
    const lines = currentContent.split("\n");
    const newLines: string[] = [];

    for (const line of lines) {
      if (line.includes(newContent.target)) {
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
      } else {
        throw new Error("NO_TARGET_FOUND");
      }
    }

    return newLines.join("\n");
  }

  async writeFileContent(filePath: string, newContent: IContent) {
    const currentContent = await this.readFileContent(filePath);

    if (!currentContent) {
      this.createFile(filePath, newContent.with);
    } else {
      const contentToWrite = this.manipulateFileContent(
        currentContent,
        newContent
      );
      this.writeFile(filePath, contentToWrite);
    }
  }

  async manage(files: FileToManipulate[]): Promise<void> {
    for (const file of files)
      this.writeFileContent(file.filePath, file.content);
  }
}

export const fileManager = new FileManager();

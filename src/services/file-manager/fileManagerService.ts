/*
    This service manipulates the code in current repo: replaces, prepends, appends lines
*/

interface IContent {
  row: string;
  action: "replace" | "append" | "prepend";
  with: string;
}

interface FileToManipulate {
  filePath: string;
  content: IContent;
}

class FileManagerService {
  async createFile(filePath: string, content?: string) {
    await Bun.write(filePath, content ?? "");
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

  async writeFileContent(filePath: string, newContent: IContent) {
    const currentContent = await this.readFileContent(filePath);

    if (!currentContent) {
      await this.createFile(filePath, newContent.with);
    } else {
      const contentToWrite = this.manipulateFileContent(
        currentContent,
        newContent
      );

      await this.writeFile(filePath, contentToWrite);
    }
  }

  async manage(files: FileToManipulate[]): Promise<void> {
    await Promise.all(
      files.map((file) => this.writeFileContent(file.filePath, file.content))
    );
  }
}

export const fileManagerService = new FileManagerService();

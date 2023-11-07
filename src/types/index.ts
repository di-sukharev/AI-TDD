export interface ContentToWrite {
  row: string;
  action: "replace" | "append" | "prepend";
  with: string;
}

export interface CodeToWrite {
  content: ContentToWrite;
  filePath: string;
}

export interface FileWithCode {
  path: string;
  code: string;
}

export interface FunctionsToCall {
  todo: any;
}

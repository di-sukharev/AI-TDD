import { unlink } from "node:fs/promises";

import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function getFiles(directoryPath: string) {
  try {
    const fileNames = await readdir(directoryPath);
    const filePaths = fileNames.map((fn) => join(directoryPath, fn));
    return filePaths;
  } catch (err) {
    console.error(err);
  }
}

const files = (await getFiles(import.meta.dir)) ?? [];

const filesToUnlink = files.filter(
  (file) => !file.match(/.*(README|clean).*/g)
);

await Promise.all(filesToUnlink.map(unlink));

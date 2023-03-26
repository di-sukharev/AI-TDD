import { execa } from 'execa';
import fs from 'fs';

async function openFile(filePath: string) {
  const platform = process.platform;

  let command;

  switch (platform) {
    case 'win32': // Windows
      command = 'start';
      break;
    case 'darwin': // macOS
      command = 'open';
      break;
    case 'linux': // Linux
      command = 'xdg-open';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    await execa(command, [filePath]);
  } catch (error) {
    console.error(`Error opening file: ${error}`);
  }
}

export async function createAndOpenFile(filePath: string, fileContent: string) {
  fs.writeFileSync(filePath, fileContent);
  await openFile(filePath);
}

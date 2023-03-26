import { spinner, outro, intro, confirm, isCancel, text } from '@clack/prompts';
import path from 'path';
import fs from 'fs';
import { solveTest } from '../solveTest';
import { highlight } from 'cli-highlight';
import chalk from 'chalk';
import { createAndOpenFile } from '../utils/createAndOpenAFile';

function getAbsoluteFilePathAndDirname(filePath: string): {
  absolutePath: string;
  dirname: string;
} {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const dirname = path.dirname(absolutePath);

  return { absolutePath, dirname };
}

function readFileContent(filePath: string): string {
  const { absolutePath } = getAbsoluteFilePathAndDirname(filePath);

  const content = fs.readFileSync(absolutePath, 'utf8');

  return content;
}

export async function tddCommand(args: string[] = []) {
  intro('aitdd');
  const readingFileSpinner = spinner();
  try {
    let filePath = args[0];

    if (!filePath) {
      filePath = (await text({
        message: 'Provide the test suite file path',
        placeholder: './tests/.../...'
      })) as string;
    }

    readingFileSpinner.start('reading file');
    const testFileContent = readFileContent(filePath);
    readingFileSpinner.stop('done reading');

    const onStream = (token: string) => {
      process.stdout.write(highlight(token));
    };

    // @ts-ignore
    const onComplete = async (completion: string) => {
      const fileCreationConfirmed = await confirm({
        message: 'Do you want to create a file with the code?'
      });

      if (fileCreationConfirmed && !isCancel(fileCreationConfirmed)) {
        const { dirname } = getAbsoluteFilePathAndDirname(filePath);
        const fileName = await text({
          message: 'Name the file',
          placeholder: 'file.extension',
          defaultValue: 'file.extension'
        });
        const newFilePath = path.join(dirname, fileName as string);
        await createAndOpenFile(newFilePath, completion);
        outro(`${chalk.green('✔')} file is created`);
      }

      process.exit(0);
    };

    outro('--- code that should solve the test suite ---');
    await solveTest(testFileContent, onStream, onComplete);
  } catch (error) {
    readingFileSpinner.stop('error reading the file: ' + error);
  }
}

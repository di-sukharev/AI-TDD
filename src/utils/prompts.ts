import { outro } from "@clack/prompts";
import chalk from "chalk";

export const outroError = (error: string) =>
  outro(`${chalk.red("✖")} ${error}`);

export const outroSuccess = (message: string) =>
  outro(`${chalk.green("✔")} ${message}`);

import { outro } from "@clack/prompts";
import chalk from "chalk";

export const outroError = (error) => outro(`${chalk.red("✖")} ${error}`);
export const outroSuccess = (message) =>
  outro(`${chalk.green("✔")} ${message}`);

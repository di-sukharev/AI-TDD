import { intro, outro } from "@clack/prompts";
import { command } from "cleye";
import { COMMANDS } from "./enums";

export const initCommand = command(
  {
    name: COMMANDS.init,
    // parameters: ["<mode>", "<key=values...>"],
  },
  async (argv) => {
    intro("AI-TDD is initializing 🐣");

    // TODO

    outro("Initialization finished 🐥");
  }
);

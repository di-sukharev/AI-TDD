import chalk from "chalk";
import { command } from "cleye";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { parse as iniParse, stringify as iniStringify } from "ini";
import { homedir } from "os";
import { join as pathJoin } from "path";
import { intro, outro } from "@clack/prompts";
import { outroError, outroSuccess } from "../utils/prompts";
import { getI18nLocal } from "../i18n";
import { COMMANDS } from "./enums";

export enum CONFIG_KEYS {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  MODEL = "MODEL",
  LANGUAGE = "LANGUAGE",
}

export const DEFAULT_MODEL_TOKEN_LIMIT = 100_000;

enum CONFIG_COMMAND_MODES {
  get = "get",
  set = "set",
}

const validateConfig = (
  key: string,
  condition: any,
  validationMessage: string
) => {
  if (!condition) {
    outroError(`Unsupported config key ${key}: ${validationMessage}`);

    process.exit(1);
  }
};

export const configValidators = {
  [CONFIG_KEYS.OPENAI_API_KEY](value: any, config?: any) {
    validateConfig(CONFIG_KEYS.OPENAI_API_KEY, value, "Cannot be empty");
    validateConfig(
      CONFIG_KEYS.OPENAI_API_KEY,
      value.startsWith("sk-"),
      'Must start with "sk-"'
    );

    return value;
  },

  [CONFIG_KEYS.LANGUAGE](value: any) {
    validateConfig(
      CONFIG_KEYS.LANGUAGE,
      getI18nLocal(value),
      `${value} is not supported yet`
    );
    return getI18nLocal(value);
  },

  [CONFIG_KEYS.MODEL](value: any) {
    validateConfig(
      CONFIG_KEYS.MODEL,
      [
        "gpt-3.5-turbo",
        "gpt-4",
        "gpt-3.5-turbo-16k",
        "gpt-3.5-turbo-0613",
      ].includes(value),
      `${value} is not supported yet, use 'gpt-4', 'gpt-3.5-turbo-16k' (default), 'gpt-3.5-turbo-0613' or 'gpt-3.5-turbo'`
    );
    return value;
  },
};

export type ConfigType = {
  [key in CONFIG_KEYS]?: any;
};

const configPath = pathJoin(homedir(), ".aitdd");

export const getConfig = (): ConfigType | null => {
  const configFromEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS
      ? Number(process.env.OPENAI_MAX_TOKENS)
      : undefined,
    OPENAI_BASE_PATH: process.env.OPENAI_BASE_PATH,
    DESCRIPTION: process.env.DESCRIPTION === "true" ? true : false,
    EMOJI: process.env.EMOJI === "true" ? true : false,
    MODEL: process.env.MODEL || "gpt-3.5-turbo-16k",
    LANGUAGE: process.env.LANGUAGE || "en",
    MESSAGE_TEMPLATE_PLACEHOLDER:
      process.env.MESSAGE_TEMPLATE_PLACEHOLDER || "$msg",
    PROMPT_MODULE: process.env.PROMPT_MODULE || "conventional-commit",
  };

  const configExists = existsSync(configPath);
  if (!configExists) return configFromEnv;

  const configFile = readFileSync(configPath, "utf8");
  const config = iniParse(configFile);

  for (const configKey of Object.keys(config)) {
    if (
      !config[configKey] ||
      ["null", "undefined"].includes(config[configKey])
    ) {
      config[configKey] = undefined;
      continue;
    }
    try {
      const validator = configValidators[configKey as CONFIG_KEYS];
      const validValue = validator(
        config[configKey] ?? configFromEnv[configKey as CONFIG_KEYS],
        config
      );

      config[configKey] = validValue;
    } catch (error) {
      outro(
        `'${configKey}' name is invalid, it should be either '${configKey.toUpperCase()}' or it doesn't exist.`
      );
      outro(`Manually fix the '.env' file or global '~/.ai-tdd' config file.`);
      process.exit(1);
    }
  }

  return config;
};

export const setConfig = (keyValues: [key: string, value: string][]) => {
  const config = getConfig() || {};

  for (const [configKey, configValue] of keyValues) {
    if (!configValidators.hasOwnProperty(configKey)) {
      throw new Error(`Unsupported config key: ${configKey}`);
    }

    let parsedConfigValue;

    try {
      parsedConfigValue = JSON.parse(configValue);
    } catch (error) {
      parsedConfigValue = configValue;
    }

    const validValue =
      configValidators[configKey as CONFIG_KEYS](parsedConfigValue);
    config[configKey as CONFIG_KEYS] = validValue;
  }

  writeFileSync(configPath, iniStringify(config), "utf8");

  outroSuccess("Config successfully set");
};

export const configCommand = command(
  {
    name: COMMANDS.config,
    parameters: ["<mode>", "<key=values...>"],
  },
  async (argv) => {
    intro("ai-tdd — config");
    try {
      const { mode, keyValues } = argv._;

      if (mode === CONFIG_COMMAND_MODES.get) {
        const config = getConfig() || {};
        for (const key of keyValues) {
          outro(`${key}=${config[key as keyof typeof config]}`);
        }
      } else if (mode === CONFIG_COMMAND_MODES.set) {
        await setConfig(
          keyValues.map((keyValue) => keyValue.split("=") as [string, string])
        );
      } else {
        throw new Error(
          `Unsupported mode: ${mode}. Valid modes are: "set" and "get"`
        );
      }
    } catch (error) {
      outroError(error as string);
      process.exit(1);
    }
  }
);

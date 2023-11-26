import { intro, outro } from "@clack/prompts";
import { command } from "cleye";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { parse as iniParse, stringify as iniStringify } from "ini";
import { homedir } from "os";
import { join as pathJoin } from "path";
import { getI18nLocal } from "../i18n";
import { outroError, outroSuccess } from "../utils/prompts";
import { COMMANDS } from "./enums";

export enum CONFIG_KEYS {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  MODEL = "MODEL",
  RUN_TESTS = "RUN_TESTS",
  LANGUAGE = "LANGUAGE",
}

export const DEFAULT_MODEL = "gpt-4-1106-preview";
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

  [CONFIG_KEYS.RUN_TESTS](value: any) {
    validateConfig(
      CONFIG_KEYS.RUN_TESTS,
      typeof value === "string",
      `${value} is not of type string`
    );

    return value;
  },

  [CONFIG_KEYS.MODEL](value: any) {
    validateConfig(
      CONFIG_KEYS.MODEL,
      [
        DEFAULT_MODEL,
        "gpt-4",
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-16k",
        "gpt-3.5-turbo-0613",
      ].includes(value),
      `${value} is not supported yet, 'gpt-4-1106-preview' (default), 'gpt-4', or 'gpt-3.5-turbo'`
    );

    return value;
  },
};

export type ConfigType = {
  [key in CONFIG_KEYS]?: any;
};

const configPath = pathJoin(homedir(), ".aitdd", "config");

export const getConfig = (): ConfigType | null => {
  const defaults = {
    [CONFIG_KEYS.RUN_TESTS]: null,
    [CONFIG_KEYS.OPENAI_API_KEY]: null,
    [CONFIG_KEYS.MODEL]: DEFAULT_MODEL,
    [CONFIG_KEYS.LANGUAGE]: "en",
  };

  const configFromEnv = {
    [CONFIG_KEYS.OPENAI_API_KEY]: process.env.OPENAI_API_KEY,
    [CONFIG_KEYS.MODEL]: process.env.MODEL || defaults.MODEL,
    [CONFIG_KEYS.LANGUAGE]: process.env.LANGUAGE || defaults.LANGUAGE,
    [CONFIG_KEYS.RUN_TESTS]: process.env.RUN_TESTS || null,
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
      config[configKey] = defaults[configKey as CONFIG_KEYS];

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
      outro(
        `Manually fix the '.env' file or global '~/.aitdd/config' config file.`
      );
      process.exit(1);
    }
  }

  return config;
};

export const setConfig = (key: string, value: string) => {
  const config = getConfig() || {};

  if (!configValidators.hasOwnProperty(key)) {
    throw new Error(`Unsupported config key: ${key}`);
  }

  let parsedConfigValue;

  try {
    parsedConfigValue = JSON.parse(value);
  } catch (error) {
    parsedConfigValue = value;
  }

  const validValue = configValidators[key as CONFIG_KEYS](parsedConfigValue);
  config[key as CONFIG_KEYS] = validValue;

  writeFileSync(configPath, iniStringify(config), "utf8");

  outroSuccess("Config successfully set");
};

export const configCommand = command(
  {
    name: COMMANDS.config,
    parameters: ["<mode>", "<key>", "<values...>"],
  },
  async (argv) => {
    intro("aitdd — config");
    try {
      const { mode, key, values } = argv._;

      if (mode === CONFIG_COMMAND_MODES.get) {
        const config = getConfig() || {};
        for (const key of values) {
          outro(`${key}=${config[key as keyof typeof config]}`);
        }
      } else if (mode === CONFIG_COMMAND_MODES.set) {
        await setConfig(key, values.join(" "));
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

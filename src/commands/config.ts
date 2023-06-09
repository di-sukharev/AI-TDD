import { command } from 'cleye';
import { join as pathJoin } from 'path';
import { parse as iniParse, stringify as iniStringify } from 'ini';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { COMMANDS } from '../CommandsEnum';

export enum CONFIG_KEYS {
  OPENAI_API_KEY = 'OPENAI_API_KEY',
  model = 'model',
  maxTokens = 'maxTokens'
}

export enum CONFIG_MODES {
  get = 'get',
  set = 'set'
}

const validateConfig = (
  key: string,
  condition: any,
  validationMessage: string
) => {
  if (!condition) {
    outro(
      `${chalk.red('✖')} Unsupported config key ${key}: ${validationMessage}`
    );
    process.exit(1);
  }
};

export const configValidators = {
  [CONFIG_KEYS.OPENAI_API_KEY](value: any) {
    validateConfig(CONFIG_KEYS.OPENAI_API_KEY, value, 'Cannot be empty');
    validateConfig(
      CONFIG_KEYS.OPENAI_API_KEY,
      value.startsWith('sk-'),
      'Must start with "sk-"'
    );
    validateConfig(
      CONFIG_KEYS.OPENAI_API_KEY,
      value.length === 51,
      'Must be 51 characters long'
    );

    return value;
  },
  [CONFIG_KEYS.model](value: any) {
    validateConfig(
      CONFIG_KEYS.model,
      ['gpt-4', 'gpt-3.5-turbo'].includes(value),
      `${value} model is not supported, use 'gpt-4' or 'gpt-3.5-turbo'`
    );
    return value;
  },
  [CONFIG_KEYS.maxTokens](value: any) {
    validateConfig(
      CONFIG_KEYS.maxTokens,
      // TODO: validate value <= max allowed tokens by openAI
      typeof value === 'number',
      `${value} model doesn't exist or is not supported`
    );
    return value;
  }
};

export type ConfigType = {
  [key in CONFIG_KEYS]?: any;
};

const configPath = pathJoin(homedir(), '.aitdd');

export const getConfig = (): ConfigType | null => {
  const configExists = existsSync(configPath);
  if (!configExists) return null;

  const configFile = readFileSync(configPath, 'utf8');
  const config = iniParse(configFile);

  for (const configKey of Object.keys(config)) {
    const validValue = configValidators[configKey as CONFIG_KEYS](
      config[configKey]
    );

    config[configKey] = validValue;
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

  writeFileSync(configPath, iniStringify(config), 'utf8');

  outro(`${chalk.green('✔')} config successfully set`);
};

export const configCommand = command(
  {
    name: COMMANDS.config,
    parameters: ['<mode>', '<key=values...>']
  },
  async (argv) => {
    intro('ai-tdd — config');
    try {
      const { mode, keyValues } = argv._;

      if (mode === CONFIG_MODES.get) {
        const config = getConfig() || {};
        for (const key of keyValues) {
          outro(`${key}=${config[key as keyof typeof config]}`);
        }
      } else if (mode === CONFIG_MODES.set) {
        await setConfig(
          keyValues.map((keyValue) => keyValue.split('=') as [string, string])
        );
      } else {
        throw new Error(
          `Unsupported mode: ${mode}. Valid modes are: "set" and "get"`
        );
      }
    } catch (error) {
      outro(`${chalk.red('✖')} ${error}`);
      process.exit(1);
    }
  }
);

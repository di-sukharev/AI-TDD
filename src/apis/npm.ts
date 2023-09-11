import { outro } from "@clack/prompts";
import { execa } from "execa";

const getLatestVersion = async (): Promise<string | undefined> => {
  try {
    const { stdout } = await execa("npm", ["view", "ai-tdd", "version"]);
    return stdout;
  } catch (_) {
    outro("Error while getting the latest version of ai-tdd");
    return undefined;
  }
};

const npmApi = {
  getLatestVersion,
};

export default npmApi;

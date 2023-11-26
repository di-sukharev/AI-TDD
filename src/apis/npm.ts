import { outro } from "@clack/prompts";
import { exe } from "src/utils/shell";

const getLatestVersion = async (): Promise<string | undefined> => {
  try {
    const { stdout } = await exe(["npm", "view", "ai-tdd", "version"]);
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

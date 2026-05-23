export type SurgeCommands = {
  hostname: string;
  teardown: string;
  rename: string;
};

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export function buildSurgeCommands(url: string): SurgeCommands {
  const hostname = extractHostname(url);
  return {
    hostname,
    teardown: `npx surge teardown ${hostname}`,
    rename: "npx surge ./ <new-domain>.surge.sh",
  };
}

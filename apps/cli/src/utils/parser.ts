/**
 * Command Line Argument Parser
 * Parses CLI arguments into structured command options
 */

export interface IParsedCommand {
  command: string;
  subcommand?: string;
  options: Record<string, string | boolean | string[]>;
  tags: Array<{ key: string; value: string }>;
  tagMatch: "AND" | "OR";
}

export function parseArgs(args: string[]): IParsedCommand {
  const result: IParsedCommand = {
    command: "",
    options: {},
    tags: [],
    tagMatch: "AND",
  };

  let i = 0;
  const tags: Array<{ key: string; value: string }> = [];

  // Parse command and subcommand
  if (i < args.length && !args[i].startsWith("--")) {
    result.command = args[i++];
  }
  if (i < args.length && !args[i].startsWith("--")) {
    result.subcommand = args[i++];
  }

  // Parse options and tags
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--tag" || arg === "-t") {
      // Next two args should be KEY and VALUE
      if (i + 2 >= args.length) {
        throw new Error("--tag requires KEY and VALUE arguments");
      }
      const key = args[++i];
      const value = args[++i];
      tags.push({ key, value });
      i++;
    } else if (arg === "--tagMatch") {
      if (i + 1 >= args.length) {
        throw new Error("--tagMatch requires AND or OR argument");
      }
      const match = args[++i].toUpperCase();
      if (match !== "AND" && match !== "OR") {
        throw new Error("--tagMatch must be AND or OR");
      }
      result.tagMatch = match as "AND" | "OR";
      i++;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        result.options[key] = args[++i];
      } else {
        result.options[key] = true;
      }
      i++;
    } else {
      // Unknown argument
      i++;
    }
  }

  result.tags = tags;
  return result;
}


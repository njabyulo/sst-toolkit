/**
 * Confirmation Utility
 * Handles user confirmation prompts (SRP)
 */

import { logger } from "./logger.js";

export async function askConfirmation(message: string): Promise<boolean> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(`${message} (yes/no): `, resolve);
  });
  rl.close();

  return answer.toLowerCase() === "yes" || answer.toLowerCase() === "y";
}

export function requireConfirmation(resourceCount: number, isDryRun: boolean): Promise<boolean> {
  if (isDryRun) {
    return Promise.resolve(true);
  }

  logger.warn(`⚠️  This will delete ${resourceCount} resource(s)`);
  return askConfirmation("Are you sure you want to continue?");
}


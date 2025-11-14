/**
 * Concurrency Control Utilities
 * Manages parallel execution with rate limiting
 */

/**
 * Execute promises in parallel with concurrency limit
 * @param items Array of items to process
 * @param fn Function to execute for each item
 * @param concurrency Maximum number of concurrent operations
 * @returns Array of results in the same order as input
 */
export async function pLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 10
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Promise<void>[] = [];
  let index = 0;

  const execute = async (item: T, itemIndex: number): Promise<void> => {
    try {
      results[itemIndex] = await fn(item);
    } catch (error) {
      results[itemIndex] = error as R;
    }
  };

  for (const item of items) {
    const itemIndex = index++;
    const promise = execute(item, itemIndex).then(() => {
      executing.splice(executing.indexOf(promise), 1);
    });
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Batch items into chunks of specified size
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}


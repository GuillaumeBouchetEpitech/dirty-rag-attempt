
export const runWithProgress = async <T>(action: () => Promise<T>): Promise<T> => {

  const startTime = Date.now();

  const handle = setInterval(() => {

    const stopTime = Date.now();
    const deltaTime = stopTime - startTime;
    process.stdout.write(`\r -> time elapsed: ${deltaTime}ms (${(deltaTime / 1000).toFixed(1)}s)`);

  }, 500);

  const result = await action();

  const stopTime = Date.now();
  const deltaTime = stopTime - startTime;
  process.stdout.write(`\r -> time elapsed: ${deltaTime}ms (${(deltaTime / 1000).toFixed(1)}s)`);
  process.stdout.write(`\n`);

  clearInterval(handle);

  return result;
};


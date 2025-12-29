export const setupConsoleFilter = () => {
  if (process.env.NODE_ENV === 'production') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  const shouldFilter = (message) => {
    const msg = message?.toString().toLowerCase() || '';
    return (
      msg.includes('webgl') ||
      msg.includes('groupmarkernotset') ||
      msg.includes('svg') && msg.includes('attribute') ||
      msg.includes('swiftshader') ||
      msg.includes('crbug.com')
    );
  };

  console.error = (...args) => {
    if (!shouldFilter(args[0])) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args) => {
    if (!shouldFilter(args[0])) {
      originalWarn.apply(console, args);
    }
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
};

export const cleanupConsoleFilter = setupConsoleFilter;

const EnabledLevels = [
  // 'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
];

const createLogger = (level: string, outFunc: (...data: any[]) => void) => {
  if (!EnabledLevels.includes(level)) {
    return () => undefined;
  }
  return (message: string, data: any) => {
    outFunc(`${new Date().toISOString()} ${level}: ${message}`, data);
  }
}

const log = {
  debug: createLogger('DEBUG', console.debug),
  info: createLogger('INFO', console.info),
  warn: createLogger('WARN', console.warn),
  error: createLogger('ERROR', console.error),
};

export default log;

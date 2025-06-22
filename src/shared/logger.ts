// 定义日志级别
export const LogLevel = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5, // A level to disable all logging
} as const;

type LogLevelName = keyof typeof LogLevel;
type LogLevelValue = typeof LogLevel[LogLevelName];

// --- Logger 配置 ---
// 默认级别。在生产环境中，可以将其设置为 'INFO'
let currentLogLevel: LogLevelValue = LogLevel.DEBUG;
const LOG_PREFIX = '[Ghost Downloader]';

/**
 * A simple, Loguru-inspired logger for the browser extension.
 * It provides leveled and formatted logging using the standard console API.
 */
class Logger {
  /**
   * Sets the current logging level. Messages below this level will not be printed.
   * @param level The new log level, e.g., 'INFO' or LogLevel.INFO.
   */
  public setLevel(level: LogLevelName | LogLevelValue) {
    if (typeof level === 'string' && level in LogLevel) {
      currentLogLevel = LogLevel[level];
      this.info(`Logger level set to ${level}`);
    } else if (typeof level === 'number') {
      currentLogLevel = level as LogLevelValue;
      const levelName = Object.keys(LogLevel).find(key => LogLevel[key as LogLevelName] === level);
      this.info(`Logger level set to ${levelName || 'UNKNOWN'}`);
    }
  }

  private _log(level: LogLevelValue, levelName: LogLevelName, message: any, ...optionalParams: any[]) {
    if (level < currentLogLevel) {
      return;
    }

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    const levelColor = {
      DEBUG: 'blue',
      INFO: 'green',
      WARN: 'orange',
      ERROR: 'red',
    };

    const consoleMethod = levelName.toLowerCase() as keyof Omit<Console, 'setLevel'>;

    // 使用 console 的分组功能来美化输出，并应用颜色
    // @ts-ignore
    const logFunction = console[consoleMethod] || console.log;

    logFunction(
      `%c${LOG_PREFIX} %c${timestamp} %c[${levelName}]`,
      'color: purple; font-weight: bold;',
      'color: gray;',
      `color: ${levelColor[levelName as keyof typeof levelColor]}; font-weight: bold;`,
      message,
      ...optionalParams
    );
  }

  public debug(message: any, ...optionalParams: any[]) {
    this._log(LogLevel.DEBUG, 'DEBUG', message, ...optionalParams);
  }

  public info(message: any, ...optionalParams: any[]) {
    this._log(LogLevel.INFO, 'INFO', message, ...optionalParams);
  }

  public warn(message: any, ...optionalParams: any[]) {
    this._log(LogLevel.WARN, 'WARN', message, ...optionalParams);
  }

  public error(message: any, ...optionalParams: any[]) {
    this._log(LogLevel.ERROR, 'ERROR', message, ...optionalParams);
  }
}

// 导出一个单例 logger 实例，供整个应用使用
export const logger = new Logger();

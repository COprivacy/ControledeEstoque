
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  requestId?: string;
}

class Logger {
  private logsDir: string;
  private currentLogFile: string;
  private maxLogSize = 10 * 1024 * 1024; // 10MB
  private logLevel: LogLevel;

  constructor() {
    this.logsDir = path.join(__dirname, 'logs');
    this.ensureLogsDirectory();
    this.currentLogFile = this.getLogFileName();
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  private ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logsDir, `app-${date}.log`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private rotateLogIfNeeded() {
    const newLogFile = this.getLogFileName();
    if (newLogFile !== this.currentLogFile) {
      this.currentLogFile = newLogFile;
    }

    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size > this.maxLogSize) {
        const timestamp = new Date().getTime();
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);
      }
    }
  }

  private writeLog(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return;

    this.rotateLogIfNeeded();
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFileSync(this.currentLogFile, logLine, 'utf-8');

    // Também exibe no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const consoleMsg = `[${entry.timestamp}] ${entry.level} ${entry.context ? `[${entry.context}]` : ''} ${entry.message}`;
      console.log(consoleMsg, entry.data || '');
    }
  }

  error(message: string, context?: string, data?: any, userId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      data,
      userId
    });
  }

  warn(message: string, context?: string, data?: any, userId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      data,
      userId
    });
  }

  info(message: string, context?: string, data?: any, userId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      data,
      userId
    });
  }

  debug(message: string, context?: string, data?: any, userId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      data,
      userId
    });
  }

  // Método para buscar logs (útil para admin)
  async getLogs(date?: string, level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    const logFile = date 
      ? path.join(this.logsDir, `app-${date}.log`)
      : this.currentLogFile;

    if (!fs.existsSync(logFile)) {
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let logs = lines
      .map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is LogEntry => log !== null);

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    return logs.slice(-limit);
  }

  // Limpar logs antigos (manter últimos 30 dias)
  async cleanOldLogs(daysToKeep: number = 30) {
    const files = fs.readdirSync(this.logsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      if (!file.startsWith('app-') || !file.endsWith('.log')) continue;

      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        this.info('Log antigo removido', 'CLEANUP', { file });
      }
    }
  }
}

export const logger = new Logger();

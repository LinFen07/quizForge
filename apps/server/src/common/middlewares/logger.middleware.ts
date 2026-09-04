import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly logDir: string;
  private readonly logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'access.log');
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatTime(ms: number): string {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  }

  private getLogLevel(status: number): string {
    if (status >= 500) return 'ERROR';
    if (status >= 400) return 'WARN';
    return 'INFO';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '-';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const logLevel = this.getLogLevel(statusCode);
      const timestamp = new Date().toISOString();

      const logEntry = {
        timestamp,
        level: logLevel,
        method,
        url: originalUrl,
        status: statusCode,
        duration: this.formatTime(duration),
        ip: ip || req.socket.remoteAddress || '-',
        userAgent,
      };

      if (statusCode >= 400) {
        this.logger.warn(
          `${method} ${originalUrl} ${statusCode} ${this.formatTime(duration)} [${ip}]`,
        );
      } else {
        this.logger.log(`${method} ${originalUrl} ${statusCode} ${this.formatTime(duration)}`);
      }

      try {
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
      } catch (e) {
        this.logger.error(`Failed to write log: ${e}`);
      }
    });

    next();
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };

  private getStatusColor(status: number): string {
    if (status >= 500) return this.colors.red;
    if (status >= 400) return this.colors.yellow;
    if (status >= 300) return this.colors.cyan;
    return this.colors.green;
  }

  private formatTime(ms: number): string {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const color = this.getStatusColor(statusCode);
      const { reset, gray } = this.colors;

      const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
      const methodStr = method.padEnd(7);
      const statusStr = `${color}${statusCode}${reset}`;
      const durationStr = `${gray}${this.formatTime(duration)}${reset}`;

      console.log(`[${timestamp}] ${methodStr} ${originalUrl} ${statusStr} ${durationStr}`);
    });

    next();
  }
}

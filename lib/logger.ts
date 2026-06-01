/**
 * Centralized Observability & Logging Utility
 * Ensures logs are structured and trace IDs are present, preventing messy console spam.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
  traceId?: string;
}

const generateTraceId = () => Math.random().toString(36).substring(2, 15);

function formatLog(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const traceId = payload.traceId || generateTraceId();
  
  const logObject = {
    timestamp,
    level: level.toUpperCase(),
    traceId,
    message: payload.message,
    ...(payload.context ? { context: payload.context } : {}),
    ...(payload.error ? { error: payload.error instanceof Error ? payload.error.stack || payload.error.message : payload.error } : {})
  };

  return JSON.stringify(logObject);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(formatLog('info', { message, context }));
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(formatLog('warn', { message, context }));
    }
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(formatLog('error', { message, error, context }));
    }
  }
};

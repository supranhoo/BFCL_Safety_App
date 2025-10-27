import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AuditLog {
  userId?: string;
  action: string;
  resource: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export const auditLogger = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auditLog: AuditLog = {
      userId: (req as any).user?.id,
      action,
      resource,
      details: {
        body: req.body,
        params: req.params,
        query: req.query,
      },
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
    };

    logger.info('AUDIT_LOG', auditLog);

    // TODO: Save to database audit_logs table
    // await prisma.auditLog.create({ data: auditLog });

    next();
  };
};

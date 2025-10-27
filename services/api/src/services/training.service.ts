import { PrismaClient, TrainingType, TrainingSessionStatus } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class TrainingService {
  /**
   * Create training program
   */
  async createProgram(data: any, createdById: string) {
    const program = await prisma.trainingProgram.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    await this.logAudit(createdById, 'CREATE', 'training_programs', program.id);
    return program;
  }

  /**
   * Get all programs
   */
  async getPrograms(filters: { trainingType?: TrainingType; isActive?: boolean; isMandatory?: boolean }) {
    return await prisma.trainingProgram.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Schedule training session
   */
  async scheduleSession(data: any, createdById: string) {
    const sessionNumber = await this.generateSessionNumber();

    const session = await prisma.trainingSession.create({
      data: {
        sessionNumber,
        ...data,
        status: TrainingSessionStatus.SCHEDULED,
      },
      include: { program: true },
    });

    await this.logAudit(createdById, 'CREATE', 'training_sessions', session.id);
    await this.notifyParticipants(session);

    return session;
  }

  /**
   * Get all sessions
   */
  async getSessions(filters: {
    status?: TrainingSessionStatus;
    programId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.programId) where.programId = filters.programId;
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledDate = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    return await prisma.trainingSession.findMany({
      where,
      include: { program: true, attendances: true },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  /**
   * Record attendance
   */
  async recordAttendance(sessionId: string, attendances: any[], userId: string) {
    const session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('Session not found', 404);

    for (const attendance of attendances) {
      await prisma.trainingAttendance.upsert({
        where: {
          sessionId_userId: {
            sessionId,
            userId: attendance.userId,
          },
        },
        create: {
          sessionId,
          userId: attendance.userId,
          attended: attendance.attended,
          quizScore: attendance.quizScore,
          passed: attendance.passed,
          remarks: attendance.remarks,
        },
        update: {
          attended: attendance.attended,
          quizScore: attendance.quizScore,
          passed: attendance.passed,
          remarks: attendance.remarks,
        },
      });

      // Issue certification if passed
      if (attendance.passed) {
        await this.issueCertification(sessionId, attendance.userId, userId);
      }
    }

    await this.logAudit(userId, 'RECORD_ATTENDANCE', 'training_sessions', sessionId);
    return { message: 'Attendance recorded successfully' };
  }

  /**
   * Issue certification
   */
  private async issueCertification(sessionId: string, userId: string, issuedById: string) {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { program: true },
    });

    if (!session) return;

    const certNumber = await this.generateCertNumber();
    const expiryDate = session.program.validityPeriod
      ? new Date(Date.now() + session.program.validityPeriod * 24 * 60 * 60 * 1000)
      : null;

    await prisma.certification.create({
      data: {
        certNumber,
        userId,
        sessionId,
        title: session.program.title,
        issuedDate: new Date(),
        expiryDate,
        isValid: true,
      },
    });

    await this.logAudit(issuedById, 'ISSUE_CERT', 'certifications', certNumber);
  }

  /**
   * Get expiring certifications
   */
  async getExpiringCertifications(daysAhead: number = 30) {
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    return await prisma.certification.findMany({
      where: {
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
        isValid: true,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  private async generateSessionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRN-${year}-`;
    const last = await prisma.trainingSession.findFirst({
      where: { sessionNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.sessionNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async generateCertNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CERT-${year}-`;
    const last = await prisma.certification.findFirst({
      where: { certNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
    });
    const nextNumber = last ? parseInt(last.certNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async notifyParticipants(session: any) {
    // Implementation for notifying enrolled users
  }

  private async logAudit(userId: string, action: string, resource: string, resourceId: string) {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, changes: null },
    });
  }
}

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ReportService } from '../services/report.service';

const reportService = new ReportService();

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dashboard = await reportService.getDashboard();
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
};

export const getIncidentReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, departmentId, incidentType, severity } = req.query;
    const report = await reportService.getIncidentReport({
      startDate: startDate as string,
      endDate: endDate as string,
      departmentId: departmentId as string,
      incidentType: incidentType as string,
      severity: severity as string,
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getOSHALog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const log = await reportService.getOSHALog({ year: Number(year) });
    res.json(log);
  } catch (error) {
    next(error);
  }
};

export const getCAPAAgeing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status, sourceType, assignedToId } = req.query;
    const report = await reportService.getCAPAReport({
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
      sourceType: sourceType as string,
      assignedToId: assignedToId as string,
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getKPIReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.getKPIReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getComplianceReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, departmentId, category, riskLevel } = req.query;
    const report = await reportService.getHazardReport({
      startDate: startDate as string,
      endDate: endDate as string,
      departmentId: departmentId as string,
      category: category as string,
      riskLevel: riskLevel as string,
    });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

import { PrismaClient, IncidentType, Severity, IncidentStatus, HazardCategory, RiskLevel, HazardStatus, CAPAStatus, Priority, CAPASourceType, AuditType, AuditStatus, TrainingType, TrainingSessionStatus, PPECategory, PPEIssuanceStatus, DrillType, DrillStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Roles
  const roles = [
    { name: 'Safety Head', level: 5 },
    { name: 'Assistant Safety Manager', level: 4 },
    { name: 'Senior Safety Officer', level: 3 },
    { name: 'Safety Officer', level: 2 },
    { name: 'Assistant Safety Officer', level: 1 },
    { name: 'Worker', level: 0 },
    { name: 'Contractor', level: 0 },
  ];

  const roleRecords: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        description: `${r.name} role`,
        permissions: [],
        level: r.level,
      },
    });
    roleRecords[r.name] = role.id;
  }

  // Departments
  const departments = [
    { name: 'Safety', code: 'SAF' },
    { name: 'Production', code: 'PROD' },
    { name: 'Maintenance', code: 'MAINT' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Quality Control', code: 'QC' },
  ];

  const deptRecords: Record<string, string> = {};
  for (const d of departments) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { name: d.name, code: d.code },
    });
    deptRecords[d.code] = dept.id;
  }

  // Users
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const hashed = await bcrypt.hash(defaultPassword, 10);

  const users = [
    { email: 'admin@bfcl.com', username: 'admin', firstName: 'System', lastName: 'Admin', role: 'Safety Head', dept: 'SAF', employeeId: 'EMP001' },
    { email: 'asm@bfcl.com', username: 'asm', firstName: 'John', lastName: 'Smith', role: 'Assistant Safety Manager', dept: 'SAF', employeeId: 'EMP002' },
    { email: 'sso@bfcl.com', username: 'sso', firstName: 'Sarah', lastName: 'Johnson', role: 'Senior Safety Officer', dept: 'SAF', employeeId: 'EMP003' },
    { email: 'so1@bfcl.com', username: 'so1', firstName: 'Mike', lastName: 'Williams', role: 'Safety Officer', dept: 'SAF', employeeId: 'EMP004' },
    { email: 'so2@bfcl.com', username: 'so2', firstName: 'Emily', lastName: 'Davis', role: 'Safety Officer', dept: 'SAF', employeeId: 'EMP005' },
    { email: 'worker1@bfcl.com', username: 'worker1', firstName: 'David', lastName: 'Brown', role: 'Worker', dept: 'PROD', employeeId: 'EMP006' },
    { email: 'worker2@bfcl.com', username: 'worker2', firstName: 'Lisa', lastName: 'Garcia', role: 'Worker', dept: 'PROD', employeeId: 'EMP007' },
    { email: 'contractor1@bfcl.com', username: 'contractor1', firstName: 'Robert', lastName: 'Martinez', role: 'Contractor', dept: 'MAINT', employeeId: 'CONT001' },
  ];

  const userRecords: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        password: hashed,
        firstName: u.firstName,
        lastName: u.lastName,
        employeeId: u.employeeId,
        roleId: roleRecords[u.role],
        departmentId: deptRecords[u.dept],
        isActive: true,
      },
    });
    userRecords[u.username] = user.id;
  }

  console.log('✅ Users and roles created');

  // Incidents
  const incidents = [
    {
      incidentNumber: 'INC-2025-0001',
      reportedById: userRecords['worker1'],
      incidentDate: new Date('2025-01-15'),
      incidentTime: '10:30',
      location: 'Production Floor A, Machine #5',
      departmentId: deptRecords['PROD'],
      incidentType: IncidentType.INJURY,
      severity: Severity.HIGH,
      injuryType: 'Cut',
      bodyPartAffected: 'Hand',
      description: 'Worker sustained a deep cut on right hand while operating cutting machine. Machine guard was not properly installed.',
      immediateAction: 'First aid administered. Worker sent to medical facility. Machine shut down for inspection.',
      status: IncidentStatus.UNDER_INVESTIGATION,
      investigationRequired: true,
    },
    {
      incidentNumber: 'INC-2025-0002',
      reportedById: userRecords['worker2'],
      incidentDate: new Date('2025-01-18'),
      incidentTime: '14:45',
      location: 'Production Floor B',
      departmentId: deptRecords['PROD'],
      incidentType: IncidentType.NEAR_MISS,
      severity: Severity.MEDIUM,
      description: 'Overhead crane load swung unexpectedly near worker. No contact made.',
      immediateAction: 'Area cordoned off. Crane operator retrained.',
      status: IncidentStatus.UNDER_REVIEW,
      investigationRequired: false,
    },
    {
      incidentNumber: 'INC-2025-0003',
      reportedById: userRecords['contractor1'],
      incidentDate: new Date('2025-01-20'),
      incidentTime: '09:15',
      location: 'Maintenance Workshop',
      departmentId: deptRecords['MAINT'],
      incidentType: IncidentType.PROPERTY_DAMAGE,
      severity: Severity.LOW,
      propertyDamage: true,
      damageDescription: 'Tool cabinet fell over due to improper anchoring',
      description: 'Heavy tool cabinet tipped over when drawer was fully extended. Minor damage to equipment.',
      immediateAction: 'Cabinet secured properly. All cabinets inspected.',
      status: IncidentStatus.CLOSED,
      investigationRequired: false,
    },
    {
      incidentNumber: 'INC-2025-0004',
      reportedById: userRecords['so1'],
      incidentDate: new Date('2025-01-22'),
      incidentTime: '11:00',
      location: 'Chemical Storage Area',
      departmentId: deptRecords['PROD'],
      incidentType: IncidentType.ENVIRONMENTAL,
      severity: Severity.CRITICAL,
      description: 'Small chemical spill detected in storage area. Containment procedures activated immediately.',
      immediateAction: 'Spill response team activated. Area evacuated and secured. Cleanup completed.',
      status: IncidentStatus.UNDER_INVESTIGATION,
      investigationRequired: true,
    },
    {
      incidentNumber: 'INC-2025-0005',
      reportedById: userRecords['worker1'],
      incidentDate: new Date('2025-01-25'),
      incidentTime: '16:30',
      location: 'Assembly Line 3',
      departmentId: deptRecords['PROD'],
      incidentType: IncidentType.NEAR_MISS,
      severity: Severity.MEDIUM,
      description: 'Forklift nearly collided with pedestrian at intersection. Both following proper procedures but visibility was poor.',
      immediateAction: 'Additional warning signs and mirrors installed at intersection.',
      status: IncidentStatus.SUBMITTED,
      investigationRequired: false,
    },
  ];

  const incidentRecords: string[] = [];
  for (const inc of incidents) {
    const incident = await prisma.incident.create({
      data: inc,
    });
    incidentRecords.push(incident.id);
  }

  console.log('✅ Incidents created');

  // Hazards
  const hazards = [
    {
      hazardNumber: 'HAZ-2025-0001',
      reportedById: userRecords['so1'],
      location: 'Production Floor A',
      departmentId: deptRecords['PROD'],
      category: HazardCategory.MECHANICAL,
      description: 'Exposed moving parts on conveyor belt system',
      potentialImpact: 'Risk of entanglement or crush injuries to workers',
      riskLevel: RiskLevel.HIGH,
      likelihood: 4,
      consequence: 4,
      riskScore: 16,
      existingControls: 'Warning signs posted',
      suggestedControls: 'Install proper guarding and interlocks',
      status: HazardStatus.UNDER_REVIEW,
    },
    {
      hazardNumber: 'HAZ-2025-0002',
      reportedById: userRecords['worker2'],
      location: 'Electrical Room B',
      departmentId: deptRecords['ENG'],
      category: HazardCategory.ELECTRICAL,
      description: 'Electrical panel door not closing properly',
      potentialImpact: 'Potential electrical shock hazard',
      riskLevel: RiskLevel.EXTREME,
      likelihood: 5,
      consequence: 5,
      riskScore: 25,
      existingControls: 'Restricted access, warning signs',
      suggestedControls: 'Immediate repair of door mechanism, lockout until fixed',
      status: HazardStatus.OPEN,
    },
    {
      hazardNumber: 'HAZ-2025-0003',
      reportedById: userRecords['so2'],
      location: 'Chemical Storage',
      departmentId: deptRecords['PROD'],
      category: HazardCategory.CHEMICAL,
      description: 'Inadequate ventilation in chemical storage area',
      potentialImpact: 'Exposure to chemical fumes',
      riskLevel: RiskLevel.MEDIUM,
      likelihood: 3,
      consequence: 3,
      riskScore: 9,
      existingControls: 'PPE required for entry',
      suggestedControls: 'Install additional exhaust fans and air monitoring',
      status: HazardStatus.CONTROLS_IMPLEMENTED,
    },
  ];

  const hazardRecords: string[] = [];
  for (const haz of hazards) {
    const hazard = await prisma.hazard.create({
      data: haz,
    });
    hazardRecords.push(hazard.id);
  }

  console.log('✅ Hazards created');

  // Investigations for high-severity incidents
  const investigation1 = await prisma.investigation.create({
    data: {
      investigationNumber: 'INV-2025-0001',
      incidentId: incidentRecords[0],
      investigatorId: userRecords['sso'],
      investigationDate: new Date('2025-01-16'),
      findings: 'Investigation revealed that machine guard was removed for maintenance and not properly reinstalled. Work permit system not followed.',
      rootCause: 'Failure to follow lockout/tagout procedures and inadequate supervision',
      fiveWhys: {
        why1: 'Why did the injury occur? - Machine guard was not installed',
        why2: 'Why was guard not installed? - It was removed for maintenance',
        why3: 'Why was it not reinstalled? - Worker forgot after completing maintenance',
        why4: 'Why was there no check? - No verification step in the procedure',
        why5: 'Why is there no verification? - Procedure gap identified',
      },
      recommendations: 'Update maintenance procedures to include mandatory guard verification. Retrain all maintenance staff on LOTO procedures.',
      status: 'SUBMITTED' as any,
    },
  });

  console.log('✅ Investigations created');

  // Corrective Actions (CAPAs)
  const capas = [
    {
      capaNumber: 'CAPA-2025-0001',
      title: 'Install proper machine guarding on Machine #5',
      description: 'Install and verify proper machine guarding with interlock system on cutting machine #5',
      sourceType: CAPASourceType.INVESTIGATION,
      sourceId: investigation1.id,
      investigationId: investigation1.id,
      assignedToId: userRecords['so1'],
      createdById: userRecords['sso'],
      dueDate: new Date('2025-02-15'),
      status: CAPAStatus.IN_PROGRESS,
      priority: Priority.HIGH,
    },
    {
      capaNumber: 'CAPA-2025-0002',
      title: 'Conduct LOTO training for maintenance team',
      description: 'Comprehensive lockout/tagout training for all maintenance personnel',
      sourceType: CAPASourceType.INVESTIGATION,
      sourceId: investigation1.id,
      investigationId: investigation1.id,
      assignedToId: userRecords['asm'],
      createdById: userRecords['sso'],
      dueDate: new Date('2025-02-01'),
      status: CAPAStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
    },
    {
      capaNumber: 'CAPA-2025-0003',
      title: 'Repair electrical panel door in Room B',
      description: 'Repair door latch mechanism on electrical panel',
      sourceType: CAPASourceType.HAZARD,
      sourceId: hazardRecords[1],
      hazardId: hazardRecords[1],
      assignedToId: userRecords['contractor1'],
      createdById: userRecords['so1'],
      dueDate: new Date('2025-01-20'),
      status: CAPAStatus.OVERDUE,
      priority: Priority.CRITICAL,
    },
    {
      capaNumber: 'CAPA-2025-0004',
      title: 'Install guarding on conveyor belt',
      description: 'Install physical guards on exposed moving parts of conveyor system',
      sourceType: CAPASourceType.HAZARD,
      sourceId: hazardRecords[0],
      hazardId: hazardRecords[0],
      assignedToId: userRecords['so2'],
      createdById: userRecords['so1'],
      dueDate: new Date('2025-01-25'),
      status: CAPAStatus.OVERDUE,
      priority: Priority.HIGH,
    },
    {
      capaNumber: 'CAPA-2025-0005',
      title: 'Install additional ventilation in chemical storage',
      description: 'Install two additional exhaust fans in chemical storage area',
      sourceType: CAPASourceType.HAZARD,
      sourceId: hazardRecords[2],
      hazardId: hazardRecords[2],
      assignedToId: userRecords['contractor1'],
      createdById: userRecords['so2'],
      dueDate: new Date('2025-03-01'),
      status: CAPAStatus.PENDING,
      priority: Priority.MEDIUM,
    },
  ];

  for (const capa of capas) {
    await prisma.correctiveAction.create({
      data: capa,
    });
  }

  console.log('✅ CAPAs created');

  // Training Programs
  const trainingPrograms = [
    {
      title: 'Safety Induction Training',
      description: 'Comprehensive safety induction for all new employees covering basic safety rules, emergency procedures, and PPE requirements',
      trainingType: TrainingType.INDUCTION,
      duration: 240,
      validityPeriod: 365,
      isMandatory: true,
      hasQuiz: true,
      passingScore: 80,
      isActive: true,
    },
    {
      title: 'Lockout/Tagout (LOTO) Certification',
      description: 'Energy isolation and lockout/tagout procedures for maintenance personnel',
      trainingType: TrainingType.COMPLIANCE,
      duration: 180,
      validityPeriod: 730,
      isMandatory: true,
      hasQuiz: true,
      passingScore: 90,
      isActive: true,
    },
    {
      title: 'Fire Safety and Emergency Response',
      description: 'Fire prevention, firefighting equipment usage, and emergency evacuation procedures',
      trainingType: TrainingType.EMERGENCY_RESPONSE,
      duration: 120,
      validityPeriod: 365,
      isMandatory: true,
      hasQuiz: true,
      passingScore: 75,
      isActive: true,
    },
    {
      title: 'Forklift Operation Safety',
      description: 'Safe operation of forklifts and material handling equipment',
      trainingType: TrainingType.EQUIPMENT_OPERATION,
      duration: 300,
      validityPeriod: 1095,
      isMandatory: true,
      hasQuiz: true,
      passingScore: 85,
      isActive: true,
    },
  ];

  const trainingProgramRecords: string[] = [];
  for (const program of trainingPrograms) {
    const tp = await prisma.trainingProgram.create({
      data: program,
    });
    trainingProgramRecords.push(tp.id);
  }

  console.log('✅ Training programs created');

  // Training Sessions
  const trainingSessions = [
    {
      sessionNumber: 'TRN-2025-0001',
      programId: trainingProgramRecords[0],
      scheduledDate: new Date('2025-02-10'),
      startTime: '09:00',
      endTime: '13:00',
      location: 'Training Room A',
      trainerName: 'John Smith',
      maxParticipants: 20,
      status: TrainingSessionStatus.SCHEDULED,
    },
    {
      sessionNumber: 'TRN-2025-0002',
      programId: trainingProgramRecords[1],
      scheduledDate: new Date('2025-02-15'),
      startTime: '10:00',
      endTime: '13:00',
      location: 'Training Room B',
      trainerName: 'Sarah Johnson',
      maxParticipants: 15,
      status: TrainingSessionStatus.SCHEDULED,
    },
    {
      sessionNumber: 'TRN-2025-0003',
      programId: trainingProgramRecords[2],
      scheduledDate: new Date('2025-02-20'),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Conference Hall',
      trainerName: 'Mike Williams',
      maxParticipants: 50,
      status: TrainingSessionStatus.SCHEDULED,
    },
  ];

  for (const session of trainingSessions) {
    await prisma.trainingSession.create({
      data: session,
    });
  }

  console.log('✅ Training sessions created');

  // Audits
  const audits = [
    {
      auditNumber: 'AUD-2025-0001',
      title: 'Q1 PPE Compliance Inspection',
      auditType: AuditType.PPE_INSPECTION,
      scheduledDate: new Date('2025-02-05'),
      auditorId: userRecords['sso'],
      location: 'All Production Areas',
      departmentId: deptRecords['PROD'],
      scope: 'Verify proper PPE usage across all production floors',
      status: AuditStatus.SCHEDULED,
      nonConformances: 0,
      observations: 0,
    },
    {
      auditNumber: 'AUD-2025-0002',
      title: 'Fire Safety Equipment Check',
      auditType: AuditType.FIRE_SAFETY,
      scheduledDate: new Date('2025-02-12'),
      auditorId: userRecords['so1'],
      location: 'Entire Facility',
      departmentId: deptRecords['SAF'],
      scope: 'Inspect all fire extinguishers, alarms, and emergency exits',
      status: AuditStatus.SCHEDULED,
      nonConformances: 0,
      observations: 0,
    },
  ];

  for (const audit of audits) {
    await prisma.audit.create({
      data: audit,
    });
  }

  console.log('✅ Audits created');

  // PPE Items
  const ppeItems = [
    {
      name: 'Safety Helmet - White',
      category: PPECategory.HEAD_PROTECTION,
      description: 'Standard industrial safety helmet',
      stockQuantity: 150,
      reorderLevel: 30,
      unitPrice: 15.50,
      manufacturer: 'SafetyFirst Inc.',
      isActive: true,
    },
    {
      name: 'Safety Goggles - Clear',
      category: PPECategory.EYE_PROTECTION,
      description: 'Impact-resistant safety goggles',
      stockQuantity: 200,
      reorderLevel: 50,
      unitPrice: 8.75,
      manufacturer: 'VisionProtect',
      isActive: true,
    },
    {
      name: 'Ear Plugs - Disposable',
      category: PPECategory.HEARING_PROTECTION,
      description: 'Disposable foam ear plugs, NRR 32dB',
      stockQuantity: 1000,
      reorderLevel: 200,
      unitPrice: 0.50,
      manufacturer: 'HearShield',
      isActive: true,
    },
    {
      name: 'Safety Gloves - Leather',
      category: PPECategory.HAND_PROTECTION,
      description: 'Heavy-duty leather work gloves',
      stockQuantity: 80,
      reorderLevel: 20,
      unitPrice: 12.00,
      size: 'L',
      manufacturer: 'GripMaster',
      isActive: true,
    },
    {
      name: 'Safety Boots - Steel Toe',
      category: PPECategory.FOOT_PROTECTION,
      description: 'Steel toe safety boots with slip-resistant sole',
      stockQuantity: 45,
      reorderLevel: 15,
      unitPrice: 85.00,
      size: '10',
      manufacturer: 'ToughStep',
      isActive: true,
    },
  ];

  const ppeItemRecords: string[] = [];
  for (const ppe of ppeItems) {
    const item = await prisma.pPEItem.create({
      data: ppe,
    });
    ppeItemRecords.push(item.id);
  }

  console.log('✅ PPE items created');

  // PPE Issuances
  const ppeIssuances = [
    {
      issuanceNumber: 'PPE-2025-0001',
      ppeItemId: ppeItemRecords[0],
      userId: userRecords['worker1'],
      quantity: 1,
      issuedDate: new Date('2025-01-10'),
      status: PPEIssuanceStatus.ACTIVE,
    },
    {
      issuanceNumber: 'PPE-2025-0002',
      ppeItemId: ppeItemRecords[3],
      userId: userRecords['worker2'],
      quantity: 2,
      issuedDate: new Date('2025-01-12'),
      status: PPEIssuanceStatus.ACTIVE,
    },
  ];

  for (const issuance of ppeIssuances) {
    await prisma.pPEIssuance.create({
      data: issuance,
    });
  }

  console.log('✅ PPE issuances created');

  // Mock Drills
  const mockDrills = [
    {
      drillNumber: 'DRILL-2025-0001',
      drillType: DrillType.FIRE_DRILL,
      scheduledDate: new Date('2025-02-15'),
      startTime: '10:00',
      location: 'Entire Facility',
      scenario: 'Simulated fire in production area with smoke. Test evacuation procedures and assembly point protocols.',
      observers: [userRecords['admin'], userRecords['sso']],
      status: DrillStatus.SCHEDULED,
    },
    {
      drillNumber: 'DRILL-2025-0002',
      drillType: DrillType.CHEMICAL_SPILL,
      scheduledDate: new Date('2025-02-25'),
      startTime: '14:00',
      location: 'Chemical Storage Area',
      scenario: 'Simulated chemical spill. Test spill response team activation and containment procedures.',
      observers: [userRecords['asm'], userRecords['so1']],
      status: DrillStatus.SCHEDULED,
    },
  ];

  for (const drill of mockDrills) {
    await prisma.mockDrill.create({
      data: drill,
    });
  }

  console.log('✅ Mock drills created');

  // Certifications (including some expiring soon)
  const certifications = [
    {
      certNumber: 'CERT-2024-0015',
      userId: userRecords['worker1'],
      title: 'Forklift Operation Certification',
      issuedDate: new Date('2024-02-01'),
      expiryDate: new Date('2025-02-01'),
      isValid: true,
    },
    {
      certNumber: 'CERT-2024-0022',
      userId: userRecords['worker2'],
      title: 'First Aid Certification',
      issuedDate: new Date('2024-01-15'),
      expiryDate: new Date('2025-02-10'),
      isValid: true,
    },
    {
      certNumber: 'CERT-2024-0033',
      userId: userRecords['contractor1'],
      title: 'Confined Space Entry',
      issuedDate: new Date('2024-03-01'),
      expiryDate: new Date('2025-02-20'),
      isValid: true,
    },
  ];

  for (const cert of certifications) {
    await prisma.certification.create({
      data: cert,
    });
  }

  console.log('✅ Certifications created');

  console.log('✅ Seeding complete - Dashboard now has meaningful demo data!');
  console.log('\n📊 Summary:');
  console.log(`   - ${users.length} users across ${departments.length} departments`);
  console.log(`   - ${incidents.length} incidents (various severities and statuses)`);
  console.log(`   - ${hazards.length} hazards (including high-risk ones)`);
  console.log(`   - ${capas.length} CAPAs (${capas.filter(c => c.status === CAPAStatus.OVERDUE).length} overdue)`);
  console.log(`   - ${trainingPrograms.length} training programs with ${trainingSessions.length} scheduled sessions`);
  console.log(`   - ${audits.length} scheduled audits`);
  console.log(`   - ${ppeItems.length} PPE items with ${ppeIssuances.length} issuances`);
  console.log(`   - ${mockDrills.length} scheduled emergency drills`);
  console.log(`   - ${certifications.length} certifications (some expiring soon)`);
  console.log('\n🔑 Login credentials:');
  console.log('   Email: admin@bfcl.com');
  console.log('   Password: Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

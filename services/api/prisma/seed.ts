import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  const roleRecords = [] as string[];
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
    roleRecords.push(role.id);
  }

  // Department
  const department = await prisma.department.upsert({
    where: { code: 'SAF' },
    update: {},
    create: { name: 'Safety', code: 'SAF' },
  });

  // Admin user
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const hashed = await bcrypt.hash(adminPassword, 10);
  const safetyHead = await prisma.role.findUnique({ where: { name: 'Safety Head' } });

  if (safetyHead) {
    await prisma.user.upsert({
      where: { email: 'admin@bfcl.com' },
      update: {},
      create: {
        email: 'admin@bfcl.com',
        username: 'admin',
        password: hashed,
        firstName: 'System',
        lastName: 'Admin',
        roleId: safetyHead.id,
        departmentId: department.id,
        isActive: true,
      },
    });
  }

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

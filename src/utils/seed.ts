import * as bcrypt from 'bcrypt';
import { env } from './config';
import { PrismaClient } from '../../generated/prisma';
import { UserRole } from '../types/index';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
   const roles = Object.values(UserRole);

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }
  // 1. Check if admin role exists
  let adminRole = await prisma.role.findFirst({
      where: {name: 'ADMIN'}
  });

  if (!adminRole) {
    console.log('🔑 Creating ADMIN role...');
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN' },
    });
  } else {
    console.log('✅ ADMIN role already exists');
  }

  const adminEmail = env.ADMIN_EMAIL;
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        name: 'Admin User',
        phoneNumber: '0000000000',
        status: 'ACTIVE'
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
  }
}

main()
  .then(async () => {
    console.log('🎉 Seeding finished.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

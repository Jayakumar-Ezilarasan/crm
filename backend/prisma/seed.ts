import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const hashedPassword = await hashPassword('password123');
  
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      password: hashedPassword,
      name: 'Alice Smith',
      role: 'admin',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      password: hashedPassword,
      name: 'Bob Johnson',
      role: 'manager',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'user',
    },
  });

  console.log('Created users:', { user1, user2, user3 });

  // Create lead stages
  const leadStages = await Promise.all([
    prisma.leadStage.create({
      data: { name: 'Lead', order: 1 },
    }),
    prisma.leadStage.create({
      data: { name: 'Qualified', order: 2 },
    }),
    prisma.leadStage.create({
      data: { name: 'Proposal', order: 3 },
    }),
    prisma.leadStage.create({
      data: { name: 'Closed', order: 4 },
    }),
  ]);

  console.log('Created lead stages:', leadStages);

  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '123-456-7890',
      company: 'Acme Corp',
      address: '123 Main St',
      ownerId: user1.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Beta LLC',
      email: 'info@beta.com',
      phone: '555-555-5555',
      company: 'Beta LLC',
      address: '456 Elm St',
      ownerId: user2.id,
    },
  });

  console.log('Created customers:', { customer1, customer2 });

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      customerId: customer1.id,
      stageId: leadStages[0].id, // Lead stage
      value: 10000,
      source: 'Referral',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      customerId: customer2.id,
      stageId: leadStages[1].id, // Qualified stage
      value: 5000,
      source: 'Website',
    },
  });

  console.log('Created leads:', { lead1, lead2 });

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      userId: user1.id,
      customerId: customer1.id,
      leadId: lead1.id,
      title: 'Follow up call',
      description: 'Call Acme Corp to discuss proposal',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      completed: false,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      userId: user2.id,
      customerId: customer2.id,
      leadId: lead2.id,
      title: 'Send contract',
      description: 'Send contract to Beta LLC',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      completed: false,
    },
  });

  console.log('Created tasks:', { task1, task2 });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
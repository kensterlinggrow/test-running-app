// scripts/createPlan.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure there is a user with ID 1, or change this to a valid userId in your DB
  // You can also create a user if none exists yet.
  const user = await prisma.user.findUnique({ where: { id: 1 } });
  if (!user) {
    console.log('No user with id=1 found. Please create a user or update the userId here.');
    return;
  }

  // Create a WeeklyPlan record
  const newPlan = await prisma.weeklyPlan.create({
    data: {
      userId: user.id,
      start: new Date('2025-01-01'),
      end: new Date('2025-01-07'),
      planData: {
        targetDistance: 20,
        runs: [
          { distance: 5 },
          { distance: 5 },
          { distance: 10 },
        ],
      },
    },
  });
  console.log('Plan created:', newPlan);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
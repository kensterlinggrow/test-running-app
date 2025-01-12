import { PrismaClient } from '@prisma/client';
import { generateNextWeekPlan } from '../../../utils/aiLogic';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    // 1. Get all users
    const allUsers = await prisma.user.findMany();

    const updatedPlans = [];

    // 2. For each user, find current plan, logs, then create a new plan
    for (const user of allUsers) {
      const currentWeekPlan = await prisma.weeklyPlan.findFirst({
        where: { userId: user.id },
        orderBy: { end: 'desc' },
      });

      // Skip if no current plan
      if (!currentWeekPlan) continue;

      const performanceLogs = await prisma.performanceLog.findMany({
        where: {
          userId: user.id,
          date: { gte: currentWeekPlan.start, lte: currentWeekPlan.end },
        },
      });

      const nextWeekPlanData = generateNextWeekPlan(currentWeekPlan, performanceLogs);

      const newPlan = await prisma.weeklyPlan.create({
        data: {
          userId: user.id,
          start: nextWeekPlanData.start,
          end: nextWeekPlanData.end,
          planData: nextWeekPlanData.planData,
        },
      });

      updatedPlans.push(newPlan);
    }

    return res.status(200).json({
      message: `Updated ${updatedPlans.length} user plans.`,
      updatedPlans,
    });
  } catch (error) {
    console.error('Error during scheduled plan update:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
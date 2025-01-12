// pages/api/ai/adjustPlan.js
import { PrismaClient } from '@prisma/client';
import { generateNextWeekPlan } from '../../../utils/aiLogic';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, currentWeekPlanId } = req.body;

    // 1. Retrieve the currentWeekPlan from the DB
    const currentWeekPlan = await prisma.weeklyPlan.findUnique({
      where: { id: currentWeekPlanId },
    });
    if (!currentWeekPlan) {
      return res.status(404).json({ error: 'Current weekly plan not found.' });
    }

    // 2. Retrieve performance logs for that plan’s date range
    const performanceLogs = await prisma.performanceLog.findMany({
      where: {
        userId,
        date: {
          gte: currentWeekPlan.start,
          lte: currentWeekPlan.end,
        },
      },
    });

    // 3. Generate next week's plan using our AI logic
    const nextWeekPlanData = generateNextWeekPlan(currentWeekPlan, performanceLogs);

    // 4. Create a new WeeklyPlan record
    const newPlan = await prisma.weeklyPlan.create({
      data: {
        userId,
        start: nextWeekPlanData.start,
        end: nextWeekPlanData.end,
        planData: nextWeekPlanData.planData, // JSON data
      },
    });

    // 5. Return the new plan as JSON
    return res.status(201).json(newPlan);
  } catch (error) {
    console.error('Error adjusting plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
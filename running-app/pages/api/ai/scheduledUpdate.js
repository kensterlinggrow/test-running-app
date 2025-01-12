// pages/api/ai/scheduledUpdate.js

import { PrismaClient } from '@prisma/client';
import { generateNextWeekPlan } from '../../../utils/aiLogic';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- BEGIN TOKEN CHECK ---
  const authHeader = req.headers.authorization; // e.g., "Bearer mySecretToken123"
  const providedToken = authHeader?.split(' ')[1]; // split at space -> [0]="Bearer", [1]=<token>
  const expectedToken = process.env.CRON_SECRET;  // your secret from .env or Vercel Env Variables

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(403).json({ error: 'Forbidden: invalid token' });
  }
  // --- END TOKEN CHECK ---

  try {
    // 1. Fetch all users (or filter for active users only)
    const allUsers = await prisma.user.findMany();

    const updatedPlans = [];

    // 2. Loop through each user, get their current plan + logs, generate next plan
    for (const user of allUsers) {
      const currentWeekPlan = await prisma.weeklyPlan.findFirst({
        where: { userId: user.id },
        orderBy: { end: 'desc' },
      });

      // Skip if no plan exists for user
      if (!currentWeekPlan) {
        continue;
      }

      // Performance logs for the plan’s date range
      const performanceLogs = await prisma.performanceLog.findMany({
        where: {
          userId: user.id,
          date: {
            gte: currentWeekPlan.start,
            lte: currentWeekPlan.end,
          },
        },
      });

      // AI logic to determine the next week's plan
      const nextWeekPlanData = generateNextWeekPlan(currentWeekPlan, performanceLogs);

      // Create the new WeeklyPlan
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
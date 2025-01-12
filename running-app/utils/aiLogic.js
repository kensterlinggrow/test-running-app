// utils/aiLogic.js

/**
 * Adjust the user's plan based on performance logs (rule-based approach).
 * @param {object} currentWeekPlan - The current week's plan record from the database.
 * @param {object[]} performanceLogs - Array of performance logs for the current week.
 * @returns {object} - The recommended plan for next week (contains new dates and planData).
 */
export function generateNextWeekPlan(currentWeekPlan, performanceLogs) {
    // 1. Aggregate performance
    let totalDistance = 0;
    let totalTime = 0;
    performanceLogs.forEach((log) => {
      totalDistance += log.distance;
      totalTime += log.time;
    });
  
    // 2. Extract the planned distance from the current planData
    //    (Assume you stored it in planData.targetDistance)
    const plannedDistance = currentWeekPlan?.planData?.targetDistance || 0;
    const runsPlanned = currentWeekPlan?.planData?.runs?.length || 0;
    const runsCompleted = performanceLogs.length;
  
    // 3. Calculate how much of the planned distance was actually covered
    const distanceRatio = plannedDistance > 0 ? totalDistance / plannedDistance : 0;
  
    // 4. Decide on next week's distance
    let nextWeekDistance = plannedDistance;
    if (distanceRatio > 1.0) {
      // Exceeded planned distance => Increase by up to 10%
      nextWeekDistance = Math.round(plannedDistance * 1.10);
    } else if (distanceRatio >= 0.8) {
      // Met most of the plan => Increase by 5%
      nextWeekDistance = Math.round(plannedDistance * 1.05);
    } else {
      // Fell below 80% => Decrease slightly
      nextWeekDistance = Math.round(plannedDistance * 0.95);
    }
  
    // 5. Decide on next week's number of runs
    let nextWeekRuns = runsPlanned;
    // If the user completed fewer than half their runs, reduce runs by 1 (basic example)
    if (runsCompleted < runsPlanned / 2 && runsPlanned > 1) {
      nextWeekRuns = runsPlanned - 1;
    }
  
    // 6. Generate new plan data (runs array, etc.)
    const newPlanData = {
      ...currentWeekPlan.planData,
      targetDistance: nextWeekDistance,
      runs: buildRunsArray(nextWeekDistance, nextWeekRuns),
    };
  
    // 7. Build new start/end dates for next week (shift by 7 days, as an example)
    const newStart = getNextWeekStart(currentWeekPlan.end);
    const newEnd = getNextWeekEnd(currentWeekPlan.end);
  
    // 8. Return an object that we can use to create a new WeeklyPlan record
    return {
      start: newStart,
      end: newEnd,
      planData: newPlanData,
    };
  }
  
  // Helper functions (examples)
  function getNextWeekStart(prevWeekEnd) {
    const date = new Date(prevWeekEnd);
    // day after the previous week's end
    date.setDate(date.getDate() + 1);
    return date;
  }
  
  function getNextWeekEnd(prevWeekEnd) {
    const date = new Date(prevWeekEnd);
    // 7 days after the previous week's end
    date.setDate(date.getDate() + 7);
    return date;
  }
  
  function buildRunsArray(distance, runsCount) {
    const runs = [];
    const perRunDistance = distance / runsCount;
    for (let i = 0; i < runsCount; i++) {
      runs.push({
        distance: Math.round(perRunDistance * 10) / 10, // rounding to 1 decimal place
        // Optionally, you can add pace, intervals, rest days, etc. 
      });
    }
    return runs;
  }
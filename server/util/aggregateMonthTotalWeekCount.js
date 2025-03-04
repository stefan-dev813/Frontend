const { getDateRangesForMonth } = require("./getDateRangesForMonth");


module.exports.aggregateMonthsWeekData = async ({
    model,
  }) => {
    try {
        const currentMonthDates = getDateRangesForMonth(true);
        const lastMonthDates = getDateRangesForMonth(false);
      
        const currentMonthPromises = currentMonthDates.map(async (val, index) => {
          const count = await model.countDocuments({
            createdAt: {
              $gte: new Date(val.startDate),
              $lte: new Date(val.endDate),
            },
          });
          return { weekNumber: "week" + (index + 1), count };
        });
      
        const lastMonthPromises = lastMonthDates.map(async (val, index) => {
          const count = await model.countDocuments({
            createdAt: {
              $gte: new Date(val.startDate),
              $lte: new Date(val.endDate),
            },
          });
          return { week:"week"+ (index + 1), count };
        });
      
        const [currentMonthData, lastMonthData] = await Promise.all([
          Promise.all(currentMonthPromises),
          Promise.all(lastMonthPromises),
        ]);
      
        const mergedData = currentMonthData.map((current) => ({
          weekNumber: current.weekNumber,
          currentCount: current.count,
          lastCount:
            lastMonthData.find((last) => last.weekNumber === current.weekNumber)
              ?.count || 0,
        }));
      
        return mergedData;
    } catch (error) {
      console.error("Error fetching invitations comparison by month:", error);
      throw error;
    }
  };
  



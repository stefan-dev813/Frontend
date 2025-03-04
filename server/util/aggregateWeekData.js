module.exports.aggregateWeekData = async ({
    model,
    matchCondition,
    groupFieldName,
  }) => {
    try {
        const finalResult = await model.aggregate([
            {
              $match: {
                ...matchCondition
            
              },
            },
            {
              $group: {
                _id: {
                  dayOfWeek: { $dayOfWeek: groupFieldName },
                },
                count: { $sum: 1 },
              },
            },
            {
              $addFields: {
                day: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$_id.dayOfWeek", 1] }, then: "Mon" },
                      { case: { $eq: ["$_id.dayOfWeek", 2] }, then: "Tue" },
                      { case: { $eq: ["$_id.dayOfWeek", 3] }, then: "Wed" },
                      { case: { $eq: ["$_id.dayOfWeek", 4] }, then: "Thu" },
                      { case: { $eq: ["$_id.dayOfWeek", 5] }, then: "Fri" },
                      { case: { $eq: ["$_id.dayOfWeek", 6] }, then: "Sat" },
                      { case: { $eq: ["$_id.dayOfWeek", 0] }, then: "Sun" },
                    ],
                  },
                },
                currentWeek: 1,
                count: 1,
              },
            },
          ]);
          return finalResult
    } catch (error) {
      console.error("Error fetching invitations comparison by month:", error);
      throw error;
    }
  };
  



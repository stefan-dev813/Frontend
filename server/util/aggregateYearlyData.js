module.exports.aggregateYearlyData = async ({
  model,
  matchCondition,
  groupFieldName,
}) => {
  try {
    const allMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const result = await model.aggregate([
      {
        $match: {
          ...matchCondition,
        },
      },
      {
        $group: {
          _id: {
            month: { $month: groupFieldName },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                    { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                    { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                    { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                    { case: { $eq: ["$_id.month", 5] }, then: "May" },
                    { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                    { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                    { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                    { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                    { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                    { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                    { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                  ],
                  default: "Unknown",
                },
              },
            ],
          },
          count: 1,
        },
      },
      {
        $group: {
          _id: "$month",
          data: {
            $push: "$count",
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          yearCount: { $sum: "$data" },
        },
      },
      {
        $project: {
          month: 1,
          yearCount: 1,
        },
      },
    ]);

    const finalResult = allMonths.map((month) => {
      const entry = result.find((resultEntry) => resultEntry.month === month);
      return {
        month,
        currentYearCount: entry ? entry.yearCount : 0,
      };
    });
    return finalResult;
  } catch (error) {
    console.error("Error fetching invitations comparison by month:", error);
    throw error;
  }
};

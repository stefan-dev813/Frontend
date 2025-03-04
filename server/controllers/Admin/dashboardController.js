const { aggregateUser } = require("../../util/aggregateUserWithProject");
const UserSubscription = require("../../models/User/userSubscription");
const PartnerSubscription = require("../../models/Partner/partnerSubscription");
const Partner = require("../../models/Partner/Partner");
const AppUser = require("../../models/User/User");
const PartnerBusiness = require("../../models/Partner/partnerBusiness");
const moment = require("moment");
const { getDateRangesForMonth } = require("../../util/getDateRangesForMonth");
const Stamp = require("../../models/User/stamp");
const { aggregateYearlyData } = require("../../util/aggregateYearlyData");
const { aggregateWeekData } = require("../../util/aggregateWeekData");

module.exports.getPartnerDashboardData = async (req, res) => {
  try {
    const { graphFilter, startDate, endDate } = req.query;
    let obj = {};
    let result;
    if (startDate) {
      obj["createdAt"] = {
        $gte: new Date(startDate),
      };
    }
    if (endDate) {
      obj["createdAt"] = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }
    if (startDate && endDate) {
      obj["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }

    const stats = await Partner.aggregate([
      {
        $match: { ...obj },
      },
      {
        $group: {
          _id: null,
          totalPartners: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$deleted", false] }],
                },
                1,
                0,
              ],
            },
          },
          totalRequestedPartner: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$deleted", false] },
                    { $eq: ["$status", "Requested"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    const statsCount = stats[0];
    const totalPartners = statsCount ? statsCount.totalPartners : 0;
    const totalRequestedPartner = statsCount
      ? statsCount.totalRequestedPartner
      : 0;

    const topCities = await PartnerBusiness.aggregate([
      {
        $match: {
          ...obj,
          city: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20,
      },
      {
        $project: {
          _id: 0,
          city: "$_id",
          count: 1,
        },
      },
    ]);

    const categories = await PartnerBusiness.aggregate([
      {
        $match: {
          ...obj,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ]);

    if (graphFilter === "YEARLY") {
      result = await getPartnerYearlySubscriptionData();
    }
    if (graphFilter === "WEEKLY") {
      result = await getWeekCounts(PartnerSubscription);
    }
    if (graphFilter === "MONTHLY") {
      result = await getMonthTotalWeekCounts(PartnerSubscription);
    }

    const mostScanned = await getTopBusinesses(obj);
    res.status(200).json({
      totalPartners,
      mostScanned,
      totalRequestedPartner,
      topCities,
      categories,
      chartsData: result,
    });
  } catch (err) {
    console.log(err, 'err');
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.getUserrDashboardData = async (req, res) => {
  try {
    const { graphFilter } = req.query;
    const topCities = await aggregateUser({
      match: { city: { $ne: null } },
      _id: "$city",
      project: { city: "$_id" },
    });
    const genders = await aggregateUser({
      match: { gender: { $ne: null } },
      _id: "$gender",
      project: { gender: "$_id" },
    });
    const categories = await PartnerBusiness.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ]);
    let result = [];
    if (graphFilter === "YEARLY") {
      result = await getYearlySubscriptionData();
    }
    if (graphFilter === "WEEKLY") {
      result = await getWeekCounts(UserSubscription);
    }
    if (graphFilter === "MONTHLY") {
      result = await getMonthTotalWeekCounts(UserSubscription);
    }
    const stats = await AppUser.aggregate([
      //   {
      //     $match: { ...obj },
      //   },
      {
        $group: {
          _id: null,
          standardUser: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$deleted", false] },
                    { $eq: ["$isPremium", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          premiumUser: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$deleted", false] },
                    { $eq: ["$isPremium", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    const statsResult = stats[0];
    const standardUser = statsResult ? statsResult.standardUser : 0;
    const premiumUser = statsResult ? statsResult.premiumUser : 0;
    const totalUser = standardUser + premiumUser;
    res.status(200).json({
      standardUser,
      genders,
      categories,
      premiumUser,
      totalUser,
      topCities,
      chartsData: result,
    });
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};
async function getYearlySubscriptionData() {
  const currentYearPremium = await aggregateYearlyData({
    model: UserSubscription,
    matchCondition: {
      createdAt: {
        $gte: new Date(moment().startOf("year")),
        $lt: new Date(moment().endOf("year")),
      },
    },
    groupFieldName: "$createdAt",
  });
  const lastYear = moment().subtract(1, "year");

  const lastYearPremium = await aggregateYearlyData({
    model: UserSubscription,
    matchCondition: {
      createdAt: {
        $gte: new Date(moment(lastYear).startOf("year")),
        $lt: new Date(moment(lastYear).endOf("year")),
      },
    },
    groupFieldName: "$createdAt",
  });
  const result = currentYearPremium.map((currentYearData, index) => {
    const lastYearPremiumData = lastYearPremium[index];

    return {
      month: currentYearData.month,
      currentYearCount: currentYearData.currentYearCount,
      previousYearCount: lastYearPremiumData
        ? lastYearPremiumData.currentYearCount
        : 0,
    };
  });
  return result;
}
async function getPartnerYearlySubscriptionData() {
  const currentYearPremium = await findPartnerPurchaseSubscriptionYearly(
    new Date(moment().startOf("year")),
    new Date(moment().endOf("year"))
  );
  const lastYear = moment().subtract(1, "year");
  const lastYearPremium = await findPartnerPurchaseSubscriptionYearly(
    new Date(moment(lastYear).startOf("year")),
    new Date(moment(lastYear).endOf("year"))
  );

  const result = currentYearPremium.map((currentYearData, index) => {
    const lastYearPremiumData = lastYearPremium[index];

    return {
      month: currentYearData.month,
      currentYearCount: currentYearData.currentYearCount,
      previousYearCount: lastYearPremiumData
        ? lastYearPremiumData.currentYearCount
        : 0,
    };
  });
  return result;
}
async function findPartnerPurchaseSubscriptionYearly(start, end) {
  try {
    const finalResult = await aggregateYearlyData({
      model: PartnerSubscription,
      matchCondition: {
        createdAt: {
          $gte: new Date(moment().startOf("year")),
          $lt: new Date(moment().endOf("year")),
        },
      },
      groupFieldName: "$createdAt",
    });
    return finalResult;
  } catch (error) {
    console.error("Error fetching invitations comparison by month:", error);
    throw error;
  }
}

async function getTopBusinesses(obj) {
  try {
    const result = await Stamp.aggregate([
      {
        $match: {
          ...obj,
        },
      },
      {
        $group: {
          _id: "$businessId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "partnerbusinesses",
          localField: "_id",
          foreignField: "_id",
          as: "business",
        },
      },
      {
        $unwind: "$business",
      },
      {
        $lookup: {
          from: "partners",
          localField: "business.partnerId",
          foreignField: "_id",
          as: "partners",
        },
      },
      {
        $unwind: "$partners",
      },
      {
        $project: {
          businessId: "$_id",
          count: 1,
          business: 1,
          partners: 1,

          // Add more fields as needed
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error("Error getting top businesses:", error);
    throw error;
  }
}

async function getWeekCounts(UserSubscription) {
  const currentWeekResult = await aggregateWeekData({
    model:UserSubscription,
    matchCondition: {
      createdAt: {
        $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    groupFieldName:"$createdAt"
  });

  const lastWeekResult = await aggregateWeekData({
    model:UserSubscription,
    matchCondition: {
      createdAt: {
        $gte: new Date(new Date() - 14 * 24 * 60 * 60 * 1000),
        $lt: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    groupFieldName:"$createdAt"
  });

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const combinedResults = [];

  const mergeResults = (result, currentWeek) => {
    result.forEach(({ _id, count, day }) => {
      const existingEntry = combinedResults.find((entry) => entry.day === day);

      if (existingEntry) {
        existingEntry[currentWeek ? "currentWeek" : "lastWeek"] = count;
        // Set the other week count to 0 if not already set
        existingEntry[currentWeek ? "lastWeek" : "currentWeek"] ||= 0;
      } else {
        const newEntry = {
          day,
          [currentWeek ? "currentWeek" : "lastWeek"]: count,
          [currentWeek ? "lastWeek" : "currentWeek"]: 0,
        };
        combinedResults.push(newEntry);
      }
    });
  };

  mergeResults(currentWeekResult, true);
  mergeResults(lastWeekResult, false);

  // Check for missing days and add them to combinedResults
  allDays.forEach((day) => {
    const existingDay = combinedResults.find((entry) => entry.day === day);
    if (!existingDay) {
      combinedResults.push({
        day,
        currentWeek: 0,
        lastWeek: 0,
      });
    }
  });
  combinedResults.sort((a, b) => {
    return allDays.indexOf(a.day) - allDays.indexOf(b.day);
  });
  return combinedResults;
}

async function getMonthTotalWeekCounts(UserType) {
  const currentMonthDates = getDateRangesForMonth(true);
  const lastMonthDates = getDateRangesForMonth(false);

  const currentMonthPromises = currentMonthDates.map(async (val, index) => {
    const count = await UserType.countDocuments({
      createdAt: {
        $gte: new Date(val.startDate),
        $lte: new Date(val.endDate),
      },
    });
    return { weekNumber: "week" + (index + 1), count };
  });

  const lastMonthPromises = lastMonthDates.map(async (val, index) => {
    const count = await UserType.countDocuments({
      createdAt: {
        $gte: new Date(val.startDate),
        $lte: new Date(val.endDate),
      },
    });
    return { weekNumber: index + 1, count };
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
}

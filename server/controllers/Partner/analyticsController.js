const Analytics = require("../../models/Partner/analytics");
const User = require("../../models/User/User");
const Invitation = require("../../models/User/invitations");
const Business = require("../../models/Partner/partnerBusiness");
const mongoose = require("mongoose");
const { aggregateYearlyData } = require("../../util/aggregateYearlyData");
const { getDateRangesForMonth } = require("../../util/getDateRangesForMonth");

module.exports.getDailyAnalytics = [
  async (req, res) => {
    try {
      const { adId } = req.query;
      const partnerId = req.user._id;
      let obj = {};
      if (adId) {
        obj["adId"] = mongoose.Types.ObjectId(adId);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await Analytics.aggregate([
        {
          $match: {
            ...obj,
            partnerId,
            actionTime: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            totalTodayImpression: {
              $sum: {
                $cond: [{ $eq: ["$actionType", "CLICK"] }, 1, 0],
              },
            },
            totalTodayClicks: {
              $sum: {
                $cond: [{ $eq: ["$actionType", "IMPRESSION"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalTodayImpression: 1,
            totalTodayClicks: 1,
          },
        },
      ]);
      const result = stats[0];
      const totalTodayImpression = result ? result.totalTodayImpression : 0;
      const totalTodayClicks = result ? result.totalTodayClicks : 0;
      // const totalTodayImpression = await Analytics.countDocuments({
      //   partnerId,
      //   actionType: "CLICK",
      //   actionTime: { $gte: today },
      // });
      // const totalTodayClicks = await Analytics.countDocuments({
      //   partnerId,
      //   actionTime: { $gte: today },
      //   actionType: "IMPRESSION",
      // });
      const findBusiness = await Business.findOne({ partnerId });
      const totalInvitaion = await Invitation.countDocuments({
        businessId: findBusiness._id,
        createdAt: { $gte: today },
        ...obj,
      });
      const findDailyUsers = await Analytics.find({
        actionTime: { $gte: today },
        ...obj,
      });
      const userIdsArray = findDailyUsers.map((doc) => doc.userId);
      const customersAge = await getDailyUsersAge(userIdsArray);
      const lastWeekImpression = await getLastWeekAnalytics(
        "IMPRESSION",
        partnerId,
        obj
      );
      const businessId = findBusiness._id;
      const lastWeekClick = await getLastWeekAnalytics("CLICK", partnerId, obj);
      const lastWeekInvitation = await getLastWeekInvitation(businessId, obj);
      const mergedArray = new Map();

      lastWeekImpression.forEach((item) => {
        mergedArray.set(item._id, {
          _id: item._id,
          impressionCount: item.count,
        });
      });

      lastWeekClick.forEach((item) => {
        const existingItem = mergedArray.get(item._id) || { _id: item._id };
        existingItem.clickCount = item.count;
        mergedArray.set(item._id, existingItem);
      });

      lastWeekInvitation.forEach((item) => {
        const existingItem = mergedArray.get(item._id) || { _id: item._id };
        existingItem.inviteCount = item.count;
        mergedArray.set(item._id, existingItem);
      });

      // Convert the Map values to an array
      const lastWeekData = Array.from(mergedArray.values());
      res.status(200).json({
        lastWeekData,
        customersAge,

        totalInvitaion,
        totalTodayClicks,
        totalTodayImpression,
      });
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getDashboardAnalytics = [
  async (req, res) => {
    try {
      const { graphFilter, timePeriod } = req.query;
      const partnerId = req.user._id;
      const findBusiness = await Business.findOne({ partnerId });
      let result = [];
      if (graphFilter === "Yearly") {
        result = await getYearlyCountForGraph(findBusiness._id, partnerId);
      }
      if (graphFilter === "Weekly") {
        result = await getWeeklyCountsForGraph(findBusiness._id, partnerId);
      }
      if (graphFilter === "Monthly") {
        result = await getMonthTotalWeekCountsForGraph(
          findBusiness._id,
          partnerId
        );
      }
      const finalData = await getTotalCount({
        businessId: findBusiness._id,
        timePeriod,
        partnerId,
      });
      res.status(200).json({
        chartData: result,
        ...finalData,
        businessId: findBusiness._id,
      });
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

function getTimeInterval(timeInterval) {
  let dateFilter;
  let currentDate = new Date();
  switch (timeInterval) {
    case "Yearly":
      dateFilter = {
        $gte: new Date(currentDate.getFullYear(), 0, 1),
        $lt: new Date(currentDate.getFullYear() + 1, 0, 1),
      };
      break;
    case "Monthly":
      dateFilter = {
        $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        $lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      };
      break;
    case "Weekly":
      dateFilter = {
        $gte: new Date(
          currentDate.getTime() -
            (currentDate.getDay() - 1) * 24 * 60 * 60 * 1000
        ),
        $lt: new Date(
          currentDate.getTime() +
            (7 - currentDate.getDay()) * 24 * 60 * 60 * 1000
        ),
      };
      break;
    default:
      throw new Error(
        "Invalid time interval. Supported values: 'Yearly', 'Monthly', 'Weekly'."
      );
  }
  return dateFilter;
}

async function getDailyUsersAge(users) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const eighteenYearsAgo = new Date(currentDate);
  eighteenYearsAgo.setFullYear(currentDate.getFullYear() - 18);
  const ageRanges = [
    { start: currentYear - 23, end: currentYear - 18, label: "18-23" },
    { start: currentYear - 28, end: currentYear - 24, label: "24-28" },
    { start: currentYear - 40, end: currentYear - 29, label: "28-40" },
  ];
  const totalUsers = await User.countDocuments({
    _id: { $in: users },
    dob: { $exists: true, $ne: null, $type: "date", $lte: eighteenYearsAgo },
  });

  const usersByAgeRanges = await Promise.all(
    ageRanges.map(async (range) => {
      const count = await User.countDocuments({
        _id: { $in: users },
        dob: {
          $exists: true,
          $ne: null,
          $gte: new Date(`${range.start}-01-01`),
          $lt: new Date(`${range.end + 1}-01-01`),
        },
      });
      return {
        ageRange: range.label,
        percentage: ((count / totalUsers) * 100).toFixed(2),
      };
    })
  );

  return usersByAgeRanges;
}

async function getLastWeekAnalytics(actionType, partnerId, obj) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await Analytics.aggregate([
    {
      $match: {
        partnerId: new mongoose.Types.ObjectId(partnerId),
        actionType,
        actionTime: { $gte: sevenDaysAgo },
        ...obj,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$actionTime" } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return result;
}
async function getLastWeekInvitation(businessId, obj) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await Invitation.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        createdAt: { $gte: sevenDaysAgo },
        ...obj,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return result;
}

async function getWeeklyCountsForGraph(businessId = "", partnerId) {
  const currentWeekResult = await Analytics.aggregate([
    {
      $match: {
        partnerId: new mongoose.Types.ObjectId(partnerId),
        actionType: { $in: ["IMPRESSION", "CLICK"] },
        actionTime: { ...getTimeInterval("Weekly") },
      },
    },
    {
      $group: {
        _id: {
          actionType: "$actionType",
          dayOfWeek: { $dayOfWeek: "$actionTime" },
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
        actionType: "$_id.actionType",
      },
    },
    {
      $group: {
        _id: "$day",
        actionTypeImpressionCount: {
          $sum: {
            $cond: [{ $eq: ["$actionType", "IMPRESSION"] }, "$count", 0],
          },
        },
        actionTypeClickCount: {
          $sum: { $cond: [{ $eq: ["$actionType", "CLICK"] }, "$count", 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        day: "$_id",
        actionTypeImpressionCount: 1,
        actionTypeClickCount: 1,
      },
    },
  ]);

  const currentWeekInvitation = await Invitation.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        createdAt: { ...getTimeInterval("Weekly") },
      },
    },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: "$createdAt" },
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
  const mergedResult = {};

  currentWeekResult.forEach((dayStat) => {
    const dayKey = dayStat.day;
    const actionStat = currentWeekInvitation.find(
      (actionStat) => actionStat.day === dayStat.day
    );

    mergedResult[dayKey] = {
      day: dayStat.day,
      invitationCount: actionStat ? actionStat.count : 0,
      actionTypeImpressionCount: dayStat
        ? dayStat.actionTypeImpressionCount
        : 0,
      actionTypeClickCount: dayStat ? dayStat.actionTypeClickCount : 0,
    };
  });

  // Convert the mergedResult object into an array
  const finalResult = Object.values(mergedResult);
  console.log(finalResult);
  return finalResult;
}

async function getYearlyCountForGraph(businessId, partnerId) {
  try {
    const yearlyInvitationCount = await aggregateYearlyData({
      model: Invitation,
      matchCondition: {
        createdAt: {
          businessId: new mongoose.Types.ObjectId(businessId),
          ...getTimeInterval("Yearly"),
        },
      },
      groupFieldName: "$createdAt",
    });
    const yearlyImpressionCount = await aggregateYearlyData({
      model: Analytics,
      matchCondition: {
        partnerId: new mongoose.Types.ObjectId(partnerId),
        actionType: { $in: ["IMPRESSION"] },
        actionTime: { ...getTimeInterval("Yearly") },
      },
      groupFieldName: "$actionTime",
    });
    const yearlyClickCount = await aggregateYearlyData({
      model: Analytics,
      matchCondition: {
        partnerId: new mongoose.Types.ObjectId(partnerId),
        actionType: { $in: ["CLICKS"] },
        actionTime: { ...getTimeInterval("Yearly") },
      },
      groupFieldName: "$actionTime",
    });
    console.log(yearlyInvitationCount, yearlyImpressionCount, yearlyClickCount);
    // return yearlyCount;
  } catch (error) {
    console.error("Error fetching invitations comparison by month:", error);
    throw error;
  }
}

function findCountByActionType(dataArray, actionType) {
  return dataArray.reduce((total, current) => {
    if (current.actionType === actionType) {
      return total + current.count;
    }
    return total;
  }, 0);
}

async function getMonthTotalWeekCountsForGraph(businessId, partnerId) {
  const currentMonthDates = getDateRangesForMonth(true);

  const currentMonthPromises = currentMonthDates.map(async (val, index) => {
    const stats = await Analytics.aggregate([
      {
        $match: {
          partnerId: new mongoose.Types.ObjectId(partnerId),
          actionType: { $in: ["IMPRESSION", "CLICK"] },
          actionTime: {
            $gte: new Date(val.startDate),
            $lte: new Date(val.endDate),
          },
        },
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          actionType: "$_id",
          count: 1,
        },
      },
    ]);
    const findInvitaionCount = await Invitation.countDocuments({
      createdAt: { $gte: new Date(val.startDate), $lte: new Date(val.endDate) },
      businessId: new mongoose.Types.ObjectId(businessId),
    });
    return {
      weekNumber: index + 1,
      impressionCount: findCountByActionType(stats, "IMPRESSION"),
      clickCount: findCountByActionType(stats, "CLICK"),
      invitationCount: findInvitaionCount,
    };
  });

  const result = await Promise.all(currentMonthPromises);

  console.log(result);
}

async function getTotalCount({ businessId, partnerId, timePeriod }) {
  const totalAnalyticsCount = await Analytics.aggregate([
    {
      $match: {
        actionType: { $in: ["IMPRESSION", "CLICK"] },
        partnerId: new mongoose.Types.ObjectId(partnerId),
        actionTime: { ...getTimeInterval(timePeriod) },
      },
    },
    {
      $group: {
        _id: null,
        actionTypeImpressionCount: {
          $sum: { $cond: [{ $eq: ["$actionType", "IMPRESSION"] }, 1, 0] },
        },
        actionTypeClickCount: {
          $sum: { $cond: [{ $eq: ["$actionType", "CLICK"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        actionTypeImpressionCount: 1,
        actionTypeClickCount: 1,
      },
    },
  ]);
  const totalInvitationCount = await Invitation.countDocuments({
    businessId: new mongoose.Types.ObjectId(businessId),
    createdAt: { ...getTimeInterval(timePeriod) },
  });
  const findDailyUsers = await Analytics.find({
    actionTime: { ...getTimeInterval(timePeriod) },
  });
  const userIdsArray = findDailyUsers.map((doc) => doc.userId);
  const totalAgeCount = await getDailyUsersAge(userIdsArray);

  return {
    totalAgeCount,
    actionTypeImpressionCount:
      totalAnalyticsCount[0]?.actionTypeImpressionCount,
    actionTypeClickCount: totalAnalyticsCount[0]?.actionTypeClickCount,
    totalInvitationCount,
  };
}

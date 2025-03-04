const User = require("../../models/User/User");
const { aggregateUser } = require("../../util/aggregateUserWithProject");
const Invitation = require("../../models/User/invitations");
const moment = require("moment");
const { aggregateYearlyData } = require("../../util/aggregateYearlyData");
const { aggregateWeekData } = require("../../util/aggregateWeekData");
const {
  aggregateMonthsWeekData,
} = require("../../util/aggregateMonthTotalWeekCount");

async function getUsersPercentageByAgeRanges(filter) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const eighteenYearsAgo = new Date(currentDate);
  eighteenYearsAgo.setFullYear(currentDate.getFullYear() - 18);
  const ageRanges = [
    { start: currentYear - 24, end: currentYear - 18, label: "18-24" },
    { start: currentYear - 34, end: currentYear - 25, label: "25-34" },
    { start: currentYear - 44, end: currentYear - 35, label: "35-44" },
    { start: currentYear - 54, end: currentYear - 45, label: "45-54" },
    { start: currentYear - 64, end: currentYear - 55, label: "55-64" },
    { start: currentYear - 74, end: currentYear - 65, label: "65+" },
  ];
  const totalUsers = await User.countDocuments({
    ...filter,
    dob: { $exists: true, $ne: null, $type: "date", $lte: eighteenYearsAgo },
  });

  const usersByAgeRanges = await Promise.all(
    ageRanges.map(async (range) => {
      const count = await User.countDocuments({
        ...filter,
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

module.exports.getAnalysis = async (req, res) => {
  try {
    const { topStartDate, endStartDate, graphFilter } = req.query;
    let obj = {};
    if (topStartDate) {
      obj["createdAt"] = {
        $gte: new Date(topStartDate),
      };
    }
    if (endStartDate) {
      obj["createdAt"] = {
        $lte: new Date(moment(endStartDate).endOf("day")),
      };
    }
    if (topStartDate && endStartDate) {
      obj["createdAt"] = {
        $gte: new Date(topStartDate),
        $lte: new Date(moment(endStartDate).endOf("day")),
      };
    }
    const topCities = await aggregateUser({
      match: { city: { $ne: null }, ...obj },
      _id: "$city",
      project: { city: "$_id" },
    });

    const genders = await aggregateUser({
      match: { gender: { $ne: null }, ...obj },
      _id: "$gender",
      project: { gender: "$_id" },
    });
    const ageRanges = await getUsersPercentageByAgeRanges(obj);

    const pipeline = [
      {
        $match: {
          ...obj,
        },
      },
      {
        $facet: {
          totalInvites1On1: [
            {
              $match: { isGroup: false },
            },
            {
              $count: "count",
            },
          ],
          totalGroupInvites: [
            {
              $match: { isGroup: true },
            },
            {
              $count: "count",
            },
          ],
          totalInvitesAcceptedGroup: [
            {
              $match: {
                isGroup: true,
                "users.status": "Accepted",
              },
            },
            {
              $count: "count",
            },
          ],
          totalInvitesAccepted1On1: [
            {
              $match: {
                isGroup: false,
                "users.status": "Accepted",
              },
            },
            {
              $count: "count",
            },
          ],
        },
      },
    ];

    const results = await Invitation.aggregate(pipeline);

    const {
      totalInvites1On1,
      totalGroupInvites,
      totalInvitesAcceptedGroup,
      totalInvitesAccepted1On1,
    } = results[0];

    const pipeline2 = [
      {
        $match: {
          ...obj,
        },
      },
      {
        $facet: {
          totalInvites1On1: [
            {
              $match: { isGroup: false },
            },
            {
              $count: "count",
            },
          ],
          totalGroupInvites: [
            {
              $match: { isGroup: true },
            },
            {
              $count: "count",
            },
          ],
        },
      },
      {
        $project: {
          totalInvites1On1: { $arrayElemAt: ["$totalInvites1On1.count", 0] },
          totalGroupInvites: { $arrayElemAt: ["$totalGroupInvites.count", 0] },
        },
      },
      {
        $group: {
          _id: null,
          averageInvites1On1: { $avg: "$totalInvites1On1" },
          averageGroupInvites: { $avg: "$totalGroupInvites" },
        },
      },
    ];

    const averageInvitation = await Invitation.aggregate(pipeline2);
    let result = [];
    if (graphFilter === "YEARLY") {
      result = await getYearlyInvitationData();
    }
    if (graphFilter === "WEEKLY") {
      result = await getWeekCounts();
    }
    if (graphFilter === "MONTHLY") {
      result = await getMonthTotalWeekCounts();
    }

  
    res.status(200).json({
      invites: result,
      ageRanges,
      genders,
      topCities,
      avgInvitation1On1: averageInvitation[0].averageInvites1On1 ?? 0,
      avgInvitationGroup:averageInvitation[0].averageGroupInvites ?? 0,
      totalInvites1On1:
        totalInvites1On1.length > 0 ? totalInvites1On1[0].count : 0,
      totalGroupInvites:
        totalGroupInvites.length > 0 ? totalGroupInvites[0].count : 0,
      totalInvitesAcceptedGroup:
        totalInvitesAcceptedGroup.length > 0
          ? totalInvitesAcceptedGroup[0].count
          : 0,
      totalInvitesAccepted1On1:
        totalInvitesAccepted1On1.length > 0
          ? totalInvitesAccepted1On1[0].count
          : 0,
    });
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

async function getWeekCounts() {
  const currentWeekResult = await aggregateWeekData({
    model: Invitation,
    matchCondition: {
      createdAt: {
        $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    groupFieldName: "$createdAt",
  });

  const lastWeekResult = await aggregateWeekData({
    model: Invitation,
    matchCondition: {
      createdAt: {
        $gte: new Date(new Date() - 14 * 24 * 60 * 60 * 1000),
        $lt: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    groupFieldName: "$createdAt",
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

async function getInvitationsComparisonByMonth(start, end) {
  try {
    const finalResult = await aggregateYearlyData({
      model: Invitation,
      matchCondition: {
        createdAt: {
          $gte: start,
          $lt: end,
        },
      },
      groupFieldName: "$createdAt",
    });
    return finalResult;
  } catch (error) {
    console.error("Error fetching invitations comparison by yearly:", error);
    throw error;
  }
}

async function getYearlyInvitationData() {
  const currentYearInvite = await getInvitationsComparisonByMonth(
    new Date(moment().startOf("year")),
    new Date(moment().endOf("year"))
  );
  const lastYear = moment().subtract(1, "year");
  const lastYearInvite = await getInvitationsComparisonByMonth(
    new Date(moment(lastYear).startOf("year")),
    new Date(moment(lastYear).endOf("year"))
  );
  const result = currentYearInvite.map((currentYearEntry, index) => {
    const lastYearEntry = lastYearInvite[index];

    return {
      month: currentYearEntry.month,
      currentYearCount: currentYearEntry.currentYearCount,
      previousYearCount: lastYearEntry ? lastYearEntry.currentYearCount : 0,
      growthPercentFromPreviousYear: lastYearEntry
        ? ((currentYearEntry.currentYearCount -
            lastYearEntry.currentYearCount) /
            (lastYearEntry.currentYearCount || 1)) *
          100
        : 0,
    };
  });
  return result;
}

async function getMonthTotalWeekCounts(UserType) {
  const mergedData = aggregateMonthsWeekData({
    model: Invitation,
  });

  return mergedData;
}

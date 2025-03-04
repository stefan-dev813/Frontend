const Invitation = require("../models/User/invitations");

module.exports.getAggregatedInvitaion = async ({
  skipValue,
  limit,
  aggObj = {},
}) => {
  const data = await Invitation.aggregate([
    {
      $match: {
        deleted: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "rescheduleBy",
        foreignField: "_id",
        as: "rescheduleBy",
      },
    },
    {
      $unwind: {
        path: "$rescheduleBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "feedbacks",
        localField: "feedbackId",
        foreignField: "_id",
        as: "feedbackId",
      },
    },
    {
      $unwind: {
        path: "$feedbackId",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "invitationBy",
        foreignField: "_id",
        as: "invitationBy",
      },
    },
    {
      $unwind: {
        path: "$invitationBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "partnerbusinesses",
        localField: "businessId",
        foreignField: "_id",
        as: "businessData",
      },
    },
    {
      $unwind: {
        path: "$businessData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$users",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "users.userId",
        foreignField: "_id",
        as: "users.userId",
      },
    },
    {
      $unwind: {
        path: "$users.userId",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        businessId: {
          $ifNull: ["$businessData", "$googleBusiness"],
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        users: { $push: "$users" },
        groupName: { $first: "$groupName" },
        dob: { $first: "$dob" },
        isSeen: { $first: "$isSeen" },
        invitationBy: { $first: "$invitationBy" },
        feedbackId: { $first: "$feedbackId" },
        businessId: { $first: "$businessId" },
        date: { $first: "$date" },
        time: { $first: "$time" },
        isGroup: { $first: "$isGroup" },
        isRescheduled: { $first: "$isRescheduled" },
        rescheduleBy: { $first: "$rescheduleBy" },
        status: { $first: "$status" },
        reschedule: { $first: "$reschedule" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $match: {
        ...aggObj,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skipValue,
    },
    {
      $limit: limit,
    },
  ]);

  return data;
};

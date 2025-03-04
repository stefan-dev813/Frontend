const User = require("../models/User/User")

module.exports.aggregateUser = async ({ match, _id, project }) => {
  const data = await User.aggregate([
    {
      $match: {
        ...match,
      },
    },
    {
      $group: {
        _id,
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
        ...project,
        count: 1,
      },
    },
  ]);
  return data;
};

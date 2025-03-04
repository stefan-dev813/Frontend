const PartnerAds = require("../../models/Partner/partnerAds");
const ExternalAds = require("../../models/Partner/externanAd");

module.exports.getAllAds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { city } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const externalAdsQuery = {
      releaseDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      city: new RegExp(city, "i"),
    };
    const partnerAdsQuery = {
      releaseDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      cities: {
        $in: [new RegExp(city, "i")],
      },
    };
    console.log(partnerAdsQuery)

    const externalAds = await ExternalAds.find(externalAdsQuery)
      .skip(skip)
      .limit(limit)
      .lean();
    const partnerAds = await PartnerAds.aggregate([
      {
        $match: partnerAdsQuery,
      },

      {
        $lookup: {
          from: "partners",
          localField: "partnerId",
          foreignField: "_id",
          as: "partnerId",
        },
      },
      {
        $unwind: {
          path: "$partnerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "partnerbusinesses",
          localField: "partnerId._id",
          foreignField: "partnerId",
          as: "businessDetails",
        },
      },
      {
        $unwind: {
          path: "$businessDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const allAds = [...externalAds, ...partnerAds];
    const totalExternalAds = await ExternalAds.countDocuments(externalAdsQuery);
    const totalPartnerAds = await PartnerAds.countDocuments(partnerAdsQuery);
    const totalCount = totalExternalAds + totalPartnerAds;

    res.json({
      data: allAds,
      total: totalCount,
      limit: limit,
      totalPage: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

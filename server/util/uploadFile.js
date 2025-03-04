const fs = require("fs/promises");
const { S3 } = require("aws-sdk");
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3 = new S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

module.exports.uploadFileToS3 = async (file, fileName) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function (err, data) {
      if (err) {
        console.log(err);
        reject(err);
      }
      console.log(data);
      resolve(data.Location);
    });
  });
};

module.exports.getSignedUrl = async (fileName) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Expires: Number(process.env.SIGNED_URL_EXPIRY_TIME),
  };
  const url = await s3.getSignedUrl("getObject", params);

  return url;
};

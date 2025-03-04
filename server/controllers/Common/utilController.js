const { uploadFileToS3, getSignedUrl } = require("../../util/uploadFile");
const { generateOTP } = require("../../util/generateOtp");
const OtpManager = require("../../models/Common/OtpManager");
const Partner = require("../../models/Partner/Partner");
const Admin = require("../../models/Admin/Admin");
const User = require("../../models/User/User");
const { sendEmail } = require("../../util/sendEmail");

module.exports.sendOtp = async (req, res) => {
  try {
    const { email, admin, user } = req.body;
    await OtpManager.deleteOne({
      email,
    });
    let sendReq = true;
    let otp = generateOTP();

    let findUser;

    if (admin) {
      findUser = await Admin.findOne({ email });
    } else if (user) {
      findUser = await User.findOne({ email });
    } else {
      findUser = await Partner.findOne({ email });
    }
    if (!findUser) {
      sendReq = false;
      res.status(400).json({ error: "Email id is not connected to any user." });
    }

    if (sendReq) {
      let newOtp = await OtpManager.findOneAndUpdate(
        {
          email,
        },
        { email, otp },
        { new: true, upsert: true }
      );

      if (newOtp) {
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "OTP for Netme Verification",
          text: `Please use this otp to verify ${otp}`,
        };
        await sendEmail(mailOptions);
        res.status(200).json({ message: "Otp Generated Successfully" });
      } else throw Error("Something Went Wrong");
    }
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    let findOtp = await OtpManager.findOne({ email, otp }).sort({
      createdAt: -1,
    });
    if (findOtp) {
      await OtpManager.deleteOne({ email, otp });
      res.status(200).json({ message: "Verification Successfull" });
    } else throw Error("Not Valid Otp");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.getOtp = async (req, res) => {
  try {
    const { email } = req.query;

    let findOtp = await OtpManager.findOne({ email }).sort({
      createdAt: -1,
    });
    if (findOtp) {
      res.status(200).json({ message: "Verification Successfull", findOtp });
    } else throw Error("OTP not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};
module.exports.uploadFile = [
  async (req, res) => {
    try {
      if (req.files) {
        const imageFile = req.files.file;
        const extension = imageFile.name.split(".").pop();
        const fileName = `Img${Math.random() * 9999999}.${extension}`;

        let imgUrl = await uploadFileToS3(imageFile.data, fileName);
        if (imgUrl) {
          imgUrl;
          res.status(200).json({ url: imgUrl });
        }
      } else {
        res.status(400).json({ error: "File Not Found" });
      }
    } catch (err) {
      // console.log(err)
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.generateSignerUrl = [
  async (req, res) => {
    try {
      if (req.query.fileName) {
        let fileName = req.query.fileName;

        let imgUrl = await getSignedUrl(fileName);
        if (imgUrl) {
          res.status(200).json({ signerUrl: imgUrl });
        }
      } else {
        res.status(400).json({ error: "File Not Found" });
      }
    } catch (err) {
      // console.log(err)
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
// const check = async () => {
//   const final = await getSignedUrl("Img4974219.9329182785.png")
//   console.log(final)
// }
// check()

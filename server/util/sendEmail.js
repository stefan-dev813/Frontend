const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SES_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SES_USER,
    pass: process.env.SES_PASS,
  },
});

module.exports.sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info);
  } catch (error) {
    console.log("Error sending email:", error);
  }
};

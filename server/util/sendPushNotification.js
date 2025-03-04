const { getMessaging } = require("firebase-admin/messaging");
const admin = require("firebase-admin");
const userServiceAccount = require("../config/service.json");
const partnerServiceAccount = require("../config/partner_service.json");
const userApp = admin.initializeApp({
  credential: admin.credential.cert(userServiceAccount),
});
const partnerApp = admin.initializeApp(
  {
    credential: admin.credential.cert(partnerServiceAccount),
  },
  "Partner"
);
module.exports.sendPushNotification = async ({
  title,
  body,
  fcmToken,
  data = {},
  userType,
}) => {
  const message = {
    data: {
      ...data,
    },
    notification: {
      title: title ? title : "",
      body: body ? body : "",
    },
    token: fcmToken ? fcmToken : "",
  };

  try {
    const response = await getMessaging(
      userType === "USER" ? userApp : partnerApp
    ).send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    // console.log("Error sending message:", error);
    throw error;
  }
};

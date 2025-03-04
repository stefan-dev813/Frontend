const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const httpLogger = require("./util/createLogger");
const subscriptionCron = require("./cron/subscriptionCron");
//USER_ROUTE
const authRoute = require("./routes/User/authRoute");
const reviewRoute = require("./routes/User/reviewRoute");
const userAdsRoute = require("./routes/User/adsRoute");
const stampRoute = require("./routes/User/stampRoute");
const userRoute = require("./routes/User/userRoute");
const voucherRoute = require("./routes/User/voucherRoute");
const invitationRoute = require("./routes/User/invitationRoute");
const utilRoute = require("./routes/Common/utilRoute");
const userSubscriptionRoute = require("./routes/User/subscriptionRoute");

//PARTNER_ROUTER
const authPartnerRoute = require("./routes/Partner/authRoute");
const userPartnerRoute = require("./routes/Partner/userRoute");
const partnerAnalyticsRoute = require("./routes/Partner/analyticsRoute");
const businessRoute = require("./routes/Partner/businessRoute");
const adsRoute = require("./routes/Partner/adsRoute");
const partnerSubscriptionRoute = require("./routes/Partner/subscriptionRoute");

//ADMIN
const dashboardRoute = require("./routes/Admin/dashboardRoute");
const authAdminRoute = require("./routes/Admin/Auth/authAdminRoute");
const userAdminRoute = require("./routes/Admin/Auth/adminUserRoute");
const userAdminPartnerRoute = require("./routes/Admin/partnerRoute");
const userAdminUserrRoute = require("./routes/Admin/userRoute");
const userAnalysisRoute = require("./routes/Admin/analysisRoute");
const userAdminVoucherRoute = require("./routes/Admin/voucherRoute");
const subscriptionRoute = require("./routes/Admin/subscriptionRoute");

//COMMON
const notificationRoute = require("./routes/Common/notificationRoute");

//middleware
const { checkPermission } = require("./middleware/checkPermission");
const {
  CheckPartnerPermission,
} = require("./middleware/checkPartnerPermission");
const { checkGuestAccess } = require("./middleware/checkGuestAccess");
const { checkAdminPermission } = require("./middleware/checkAdminPermission");
const { listenWebhook } = require("./util/stripe");

app.get("/", (req, res) => res.send("Working!!!"));
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(httpLogger);

const dbURI = process.env.DB_URI;
const PORT = process.env.PORT;

mongoose.set("strictQuery", true);
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(PORT, () => {
      console.log("Application Started in Port " + PORT);
    });
  })
  .catch((err) => console.log(err));

// ROUTES
//WEBHOOK
app.post("/stripe/webhook", async (req, res) => {
  const event = req.body;
  try {
    console.log(event, "EVENT_WEBHOOK");
    await listenWebhook(event);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
//USER
app.use("/api/auth", checkGuestAccess(), authRoute);
app.use("/user/ads", checkPermission(["USER"]), userAdsRoute);
app.use("/api/stamp", checkPermission(["USER"]), stampRoute);
app.use("/api/user", checkPermission(["USER"]), userRoute);
app.use("/api/user/review", checkPermission(["USER"]), reviewRoute);
app.use("/api/user/voucher", checkPermission(["USER"]), voucherRoute);
app.use(
  "/api/userSubscription",
  checkPermission(["USER"]),
  userSubscriptionRoute
);
app.use("/api/invitation", invitationRoute);

//PARTNER
app.use("/partner/auth", checkGuestAccess(), authPartnerRoute);
app.use(
  "/api/partnerSubscription",
  checkPermission(["PARTNER"]),
  partnerSubscriptionRoute
);
app.use("/partner/user", CheckPartnerPermission(["PARTNER"]), userPartnerRoute);
app.use(
  "/partner/analytics",
  CheckPartnerPermission(["PARTNER"]),
  partnerAnalyticsRoute
);
app.use(
  "/partner/business",
  CheckPartnerPermission(["PARTNER"]),
  businessRoute
);
app.use("/partner/ads", adsRoute);

//ADMIN
app.use("/api/authAdmin", 
  // checkGuestAccess(), 
  authAdminRoute
);
app.use(
  "/api/userAdmin",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  userAdminRoute
);

app.use(
  "/admin/partner",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  userAdminPartnerRoute
);
app.use(
  "/admin/dashboard",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  dashboardRoute
);

app.use(
  "/admin/user",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  userAdminUserrRoute
);
app.use(
  "/admin/voucher",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  userAdminVoucherRoute
);

app.use(
  "/admin/analysis",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  userAnalysisRoute
);
app.use(
  "/admin/subscription",
  checkAdminPermission(["SUPER-ADMIN", "SUB-ADMIN"]),
  subscriptionRoute
);
//COMMON
app.use("/api/util", utilRoute);
app.use("/api/notification", notificationRoute);

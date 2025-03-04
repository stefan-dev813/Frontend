module.exports.getNotificationText = () => {
  const notification = {
    //@INFO:INVITATION NOTIFICATION TEXT
    Sent_Invitation: "Sent you a invitaion",
    Accepted_Invitation: "Accepted your invitaion",
    Rejected_Invitation: "Rejected your invitaion",
    //@INFO:ADS TEXT
    Approved_Ads: "Your Ads request is approved",
    Rejected_Ads: "Your Ads request is rejected",
    //@INFO:NOTIFICATION REQUEST TEXT
    Accepted_Notification: "Your notification request is accepted",
    Rejected_Notification: "Your notification request is rejected",
  };

  return notification;
};

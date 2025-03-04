const { getUser } = require("../util/getAdminUser");

module.exports.checkAdminPermission = (permission) => {
  return async (req, res, next) => {
    let token = req.headers.authorization;
    console.log(token);
    if (token) {
      token = token.replace("Bearer ", "");

      await getUser(token, (user) => {
        if (user && permission.includes(user.userType)) {
          req.user = user;
          next();
        } else {
          res.status(403).json({
            message: "Forbidden: you don't have enough access to this content",
          });
        }
      });
    } else {
      res.status(401).json({ message: "Unauthorised Request" });
    }
  };
};

// module.exports.checkAdminPermission = () => {
//   return async (req, res, next) => {
//     let token = req.headers.authorization;

//     if (token) {
//       token = token.replace("Bearer ", "");
//       await getUser(token, (user) => {
//         if (user) {
//           req.user = user;
//           next();
//         } else {
//           res.status(403).json({
//             message: "Forbidden: you don't have enough access to this content",
//           });
//         }
//       });
//     } else {
//       res.status(401).json({ message: "Unauthorised Request" });
//     }
//   };
// };

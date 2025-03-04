const jwt = require("jsonwebtoken");

const { TOKEN_SECRET } = require("./../config/config");;

// Middleware function to check if a token exists and is not expired
module.exports.checkToken=(req, res, next)=> {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ message: "Unauthorized Request" });
  } else {
    try {
      const decoded = jwt.verify(
        token.replace("Bearer ", ""),
        TOKEN_SECRET
      );
      req.tokenData = decoded; // Attach token data to the request object
      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized Request" });
    }
  }
}



module.exports.checkGuestAccess = () => {
  return async (req, res, next) => {
    const auth = {
      username: process.env.BASIC_AUTH_USERNAME,
      password: process.env.BASIC_AUTH_PASSWORD,
    };

    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
    const [username, password] = Buffer.from(b64auth, "base64")
      .toString()
      .split(":");

    if (
      username &&
      password &&
      username === auth.username &&
      password === auth.password
    ) {
      return next();
    }
    res.status(401).json({ error: "Unauthorized Request" });
  };
};

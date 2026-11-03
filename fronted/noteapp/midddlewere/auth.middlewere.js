
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).send({
        msg: "Login First"
      });
    }

    const decoded = jwt.verify(token, "coding");

    console.log("Decoded JWT:", decoded);

    req.userId = decoded.userId || decoded._id || decoded.id;

    if (!req.userId) {
      return res.status(401).send({
        msg: "User ID missing in token"
      });
    }

    next();

  } catch (error) {
    console.log("Auth Error:", error.message);

    return res.status(401).send({
      msg: "Login First"
    });
  }
};

module.exports = { auth };

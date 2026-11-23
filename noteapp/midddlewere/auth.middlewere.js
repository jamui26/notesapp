const jwt = require("jsonwebtoken");
const auth = (req, res, next) => {
  // Logic

  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ msg: "Login First" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "coding");
    req.userId = decoded.userId;

    if (!req.userId) {
      return res.status(401).send({ msg: "Login First" });
    }

    next();
  } catch (error) {
    return res.status(401).send({ msg: "Login First" });
  }
};

module.exports = { auth };

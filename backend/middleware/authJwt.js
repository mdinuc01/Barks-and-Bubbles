const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) => {
  // Set headers
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token , Origin, Content-Type, Accept"
  );

  // Get token from headers
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized user",
      });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;

const User = require("../models/User.js")
let jwt = require("jsonwebtoken");
let bcrypt = require("bcryptjs");

class AuthController {
  async signup(req, res) {
    try {
      let user = {};
      let userExists = await User.findOne({ username: req.body.username });
      if (!userExists) {
        userExists = await User.findOne({ email: req.body.username });
      }

      const salt = await bcrypt.genSalt(10);
      if (!userExists) {
        user = new User({
          username: req.body.username,
          email: req.body.email,
          password: await bcrypt.hash(req.body.password, salt)
        });

        await user.save();
      } else {
        return res.status(401).json({ message: "User is already created" });
      }

      if (user)
        return res.status(200).json({ message: `User created`, data: user });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error })
    }
  };

  async signIn(req, res) {
    let user = await User.findOne({
      username: req.body.username
    });

    if (!user) {
      user = await User.findOne({
        email: req.body.username
      });

      if (!user) return res.status(404).send({ message: "Invalid user, please try again" });
    }
    if (!user.active) return res.status(401).send({ message: "Unauthorized user" });

    const passwordIsValid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid credentials, please try again"
      });
    }

    const token = jwt.sign({ id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).send({
      message: "Sign in successful",
      id: user._id,
      username: user.username,
      token
    });
  }

  async signout(req, res) {

    res.clearCookie('aj');
    res.clearCookie('un');

    return res.status(200).json({ message: 'Logged out successfully' });
  };
}

module.exports = new AuthController();
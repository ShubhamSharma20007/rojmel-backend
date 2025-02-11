const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  if(req.user.current_subscription_id == null) {
    return res.status(401).json({ error: "You don't have any active subscription please purchase" });
  }
  next()

};
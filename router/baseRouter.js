const baseRouter = require('express').Router();

baseRouter.get('/', (req, res) => {
  res.send("visit /api/movies or /api/users")
});

module.exports = baseRouter;

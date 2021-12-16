const moviesRouter = require('./moviesRouter');
const usersRouter = require('./usersRouter');
const baseRouter = require('./baseRouter')

const setupRoutes = (app) => {
    app.use(baseRouter);
    app.use('/api/movies', moviesRouter);
    app.use('/api/users', usersRouter);
};

module.exports = setupRoutes;

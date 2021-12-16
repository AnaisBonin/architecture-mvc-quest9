const express = require('express');
require('dotenv').config();

const setupRoutes = require('./router/routes');

const app = express();
const port = process.env.SERVER_PORT;
app.use(express.json());

setupRoutes(app);

app.listen(port, () => {
    console.log(`serveur is running on port ${port}`)
});

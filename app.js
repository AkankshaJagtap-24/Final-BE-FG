const express = require('express');
const app = express();
const alertsRouter = require('./routes/alerts');
const sosRoutes = require('./routes/sos');

app.use(express.json());
app.use('/api', alertsRouter);
app.use('/api/weather', weatherRoutes);
app.use('/api/sos', sosRoutes);

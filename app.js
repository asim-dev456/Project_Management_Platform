const express = require('express');
require('dotenv').config();
const connectDB = require('./config/dbConnection.js');
const errorHandler = require('./middleware/globalErrorHandler.js');
const userRouter = require('./routes/userRoute.js');
const projectRoute = require('./routes/projectRoute.js');
const taskRoute = require('./routes/taskRoute.js');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const writeStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
  flags: 'a',
});
const app = express();
connectDB();
app.use(morgan('combined', { stream: writeStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.PRIVATE));
app.use('/api', userRouter);
app.use('/api', projectRoute);
app.use('/api', taskRoute);

app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log(`Server Started at http://localhost:${process.env.PORT}`);
});

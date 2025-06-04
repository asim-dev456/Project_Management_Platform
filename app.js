const express = require('express');
require('dotenv').config();
const connectDB = require('./config/dbConnection.js');
const errorHandler = require('./middleware/globalErrorHandler.js');
const userRouter = require('./routes/userRoute.js');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const writeStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
  flags: 'a',
});
const app = express();

app.use(morgan('combined', { stream: writeStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.PRIVATE));
app.use('/api', userRouter);

app.use(errorHandler);
(async () => {
  await connectDB();
  app.listen(process.env.PORT, () => {
    console.log(`Server Started at http://localhost:${process.env.PORT}`);
  });
})();

const express = require('express');
require('dotenv').config();
const connectDB = require('./config/dbConnection.js');
const errorHandler = require('./middleware/globalErrorHandler.js');
const userRouter = require('./routes/userRoute.js');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const swaggerDocs = require('./swagger');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const { limiter } = require('./utils/rateLimit.js');
const xssSanitizer = require('./middleware/xssSanitizer.js');
const mongoSanitize = require('./middleware/mongoSanitize.js');

const writeStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
  flags: 'a',
});
const app = express();

// helmet
app.use(helmet());

// enable cors
app.use(
  cors({
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// rate limit
app.use(limiter);

//prevent xss attacks
app.use(xssSanitizer);

// sanitize mongoDB operators
app.use(mongoSanitize);

app.use(morgan('combined', { stream: writeStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.PRIVATE));
app.use('/uploads', express.static('uploads'));
app.use('/api', userRouter);
swaggerDocs(app);
app.use(errorHandler);
(async () => {
  await connectDB();
  app.listen(process.env.PORT, () => {
    console.log(`Server Started at http://localhost:${process.env.PORT}`);
  });
})();

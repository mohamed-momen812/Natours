const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger'); // for logger in console

require('dotenv').config();

if (!process.env.DATABASE_PASSWORD) {
  logger.error('DATABASE_PASSWORD environment variable is not defined');
  process.exit(1);
}

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

let server;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    dbName: 'natours'
  })
  .then(() => {
    logger.info('DB Connection successful');

    const port = process.env.PORT || 3000;
    server = app.listen(port, () => {
      logger.info(`App running on port ${port}`);
    });
  })
  .catch(err => {
    logger.error(`Error connecting to database: ${err.message}`);
    process.exit(1);
  });

// Handel UncaughtException (console.log(Undefined variable))
process.on('uncaughtException', error => {
  logger.error(error);
  logger.info('uncaught Exception  Shuting down...');
  process.exit(1);
});

// Handel unhandledRejection
process.on('unhandledRejection', err => {
  logger.error(err);
  logger.info('Unhandeled Rejection  Shuting down...');
  server.close(() => {
    process.exit(1);
  });
});

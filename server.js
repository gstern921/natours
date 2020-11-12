process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception! 💥 ${err.name}, ${err.message}`);

  process.exit(1);
});
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const app = require('./app');

const {
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_CONNECTION_URI_TEMPLATE,
} = process.env;

const DATABASE_CONNECTION_URI =
  typeof DATABASE_CONNECTION_URI_TEMPLATE === 'string'
    ? DATABASE_CONNECTION_URI_TEMPLATE.replace('<DBUSER>', DATABASE_USER)
        .replace('<DBPASSWORD>', DATABASE_PASSWORD)
        .replace('<DBHOST>', DATABASE_HOST)
        .replace('<DBNAME>', DATABASE_NAME)
    : '';
const DATABASE_OPTIONS = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

const connectToDB = (db, dbConnectionURI, dbOptions) => async () => {
  await db.connect(dbConnectionURI, dbOptions);
  console.log('Connected to DB');
};

const startServer = async (port, preConnectFn, postConnectFn) => {
  if (typeof preConnectFn === 'function') {
    await preConnectFn();
  }

  return app.listen(port, postConnectFn);
};

const PORT = +process.env.PORT || 8080;

const server = startServer(
  PORT,
  connectToDB(mongoose, DATABASE_CONNECTION_URI, DATABASE_OPTIONS),
  () => console.log(`App running on port ${PORT}...`)
);

process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection! 💥 ${err.name}, ${err.message}`);
  if (server && typeof server.close === 'function') {
    server.close(() => process.exit(1));
  }
});

process.on('SIGTERM', (err) => {
  console.log(`👋 SIGTERM RECEIVED! Shutting down gracefully`);
  if (server && typeof server.close === 'function') {
    server.close(() => console.log(`💥 Process terminated!`));
  }
});

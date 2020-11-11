const fs = require('fs');
const path = require('path');
require('dotenv').config(path.join(__dirname, '..', '..', 'config.env'));

const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const importTours = async () => {
  try {
    const tours = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'tours.json'), 'utf8')
    );
    console.log('Adding tours');
    await Tour.create(tours);
    console.log('Tours successfully added');
  } catch (err) {
    console.log(err);
  }
};

const importUsers = async () => {
  try {
    const users = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8')
    );
    console.log('Adding users');
    await User.create(users);
    console.log('Users successfully added');
  } catch (err) {
    console.log(err);
  }
};

const importReviews = async () => {
  try {
    const reviews = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'reviews.json'), 'utf8')
    );
    console.log('Adding reviews');
    await Review.create(reviews);
    console.log('Reviews successfully added');
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    console.log('Deleting tours');
    await Tour.deleteMany();

    console.log('Deleting users');
    await User.deleteMany();

    console.log('Deleting reviews');
    await Review.deleteMany();
  } catch (err) {
    console.log(err);
  }
};

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
const importData = async () => {
  try {
    await mongoose.connect(DATABASE_CONNECTION_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');
    const action = process.argv[2];
    if (action === '--delete') {
      await deleteData();
    }
    await importUsers();
    await importReviews();
    await importTours();
    console.log('Disconnecting');
    await mongoose.disconnect();
  } catch (err) {
    console.log(err);
  }
};

importData();

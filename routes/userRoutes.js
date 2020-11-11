const express = require('express');
const userController = require('../controllers/userController');
const authenticationController = require('../controllers/authenticationController');
const authorizationController = require('../controllers/authorizationController');
const { ROLE_ADMIN } = require('../constants/constants');

const router = express.Router();

router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.post('/forgot-password', authorizationController.forgotPassword);
router.patch('/reset-password/:token', authorizationController.resetPassword);

router.use(authenticationController.protect);

router.patch('/update-my-password', authenticationController.changePassword);

router
  .route('/me')
  .get(userController.setCurrentUserId, userController.handleGetUserById)
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  )
  .delete(userController.handleDeactivateMe);

router.use(authorizationController.restrictTo(ROLE_ADMIN));

router
  .route('/')
  .get(userController.handleGetAllUsers)
  .post(userController.handleCreateUser);

router
  .route('/:id')
  .get(userController.handleGetUserById)
  .patch(userController.handleUpdateUserById)
  .delete(userController.handleDeleteUserById);

module.exports = router;

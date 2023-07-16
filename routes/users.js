const router = require('express').Router();

const {
  validationUpdateProfile,
} = require('../middlewares/validations');

const {
  getCurrentUser,
  updateProfile,
} = require('../controllers/users');

router.get('/me', getCurrentUser);
router.patch('/me', validationUpdateProfile, updateProfile);

module.exports = router;

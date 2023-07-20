const router = require('express').Router();
const userRoutes = require('./users');
const movieRoutes = require('./movies');
const { validationLogin, validationCreateUser } = require('../middlewares/validations');
const { login, createUser, logout } = require('../controllers/users');
const auth = require('../middlewares/auth');
const NotFoundError = require('../errors/not-found-err');

router.post('/signin', validationLogin, login);
router.post('/signup', validationCreateUser, createUser);
router.use(auth);
router.post('/signout', logout);
router.use('/users', userRoutes);
router.use('/movies', movieRoutes);

router.use('*', () => {
  throw new NotFoundError('Страница не существует');
});

module.exports = router;

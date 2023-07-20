const bcrypt = require('bcryptjs');
const jsonWebToken = require('jsonwebtoken');
const User = require('../models/user');

const { NODE_ENV, JWT_SECRET } = process.env;
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad_request_err');
const DuplicateError = require('../errors/duplicate_err');
const AuthError = require('../errors/auth_err');

// создаёт пользователя с переданными в теле данными
const createUser = (req, res, next) => {
  const { name, email } = req.body;
  bcrypt.hash(String(req.body.password), 10)
    .then((hashedPassword) => {
      User.create({ name, email, password: hashedPassword })
        .then((user) => res.status(201).send({ data: user }))
        .catch((err) => {
          if (err.name === 'ValidationError') {
            next(new BadRequestError('Переданы некорректные данные'));
          } else if (err.code === 11000) {
            next(new DuplicateError('Пользователь с таким email уже существует'));
          } else {
            next(err);
          }
        });
    });
};

// проверяет переданные в теле почту и пароль и возвращает JWT
const login = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .select('+password')
    .orFail(() => {
      throw new AuthError('Необходимо авторизоваться');
    })
    .then((user) => {
      bcrypt.compare(String(password), user.password)
        .then((isValidUser) => {
          if (isValidUser) {
            const jwt = jsonWebToken.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'SECRET');
            res
              .cookie('jwt', jwt, {
                expiresIn: '7d',
                httpOnly: true,
                sameSite: true,
              })
              .send({ jwt });
          } else {
            throw new AuthError('Необходимо авторизоваться');
          }
        })
        .catch(next);
    })
    .catch(next);
};

// удаляет JWT из куков
const logout = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        return next(new NotFoundError('Запрашиваемый пользователь не найден'));
      }
      return res
        .clearCookie('jwt')
        .send({ message: 'JWT из куков удален' });
    })
    .catch(next);
};

// возвращает информацию о пользователе
const getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(() => {
      throw new NotFoundError('Запрашиваемый пользователь не найден');
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Переданы некорректные данные'));
      } else if (err.message === 'NotFound') {
        next(new NotFoundError('Запрашиваемый пользователь не найден'));
      } else {
        next(err);
      }
    });
};

// обновляет информацию о пользователе
const updateProfile = (req, res, next) => {
  const { email, name } = req.body;

  User.findByIdAndUpdate(req.user._id, { email, name }, { new: true, runValidators: true })
    .orFail(() => {
      throw new NotFoundError('Запрашиваемый пользователь не найден');
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
      } else if (err.message === 'Not Found') {
        next(new NotFoundError('Запрашиваемый пользователь не найден'));
      } else if (err.code === 11000) {
        next(new DuplicateError('Пользователь с таким email уже существует'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  createUser,
  login,
  logout,
  getCurrentUser,
  updateProfile,
};

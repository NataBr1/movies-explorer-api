const Movie = require('../models/movie');
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad_request_err');
const AccessDeniedError = require('../errors/access_denied_err');

// возвращает все сохранённые текущим  пользователем фильмы
const getMovies = (req, res, next) => {
  Movie.find({ owner: req.user._id })
    .then((movie) => res.status(200).send(movie))
    .catch(next);
};

// создаёт фильм с переданными в теле значениями
const createMovies = (req, res, next) => {
  Movie.create({ owner: req.user._id, ...req.body })
    .then((movie) => res.status(201).send(movie))
    .catch((err) => {
      if (err.message.includes('validation failed')) {
        next(new BadRequestError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

// удаляет сохранённый фильм по id
const deleteMovies = (req, res, next) => {
  Movie.findById(req.params.movieId)
    .orFail(() => {
      throw new NotFoundError('Передан несуществующий _id фильма');
    })
    .then((movie) => {
      if (String(movie.owner) === req.user._id) {
        return Movie.findByIdAndRemove(req.params.movieId).then(() => res.status(200).send(movie));
      } throw new AccessDeniedError('Нет прав на удаление этого фильма');
    })
    .catch(next);
};

module.exports = {
  getMovies,
  createMovies,
  deleteMovies,
};

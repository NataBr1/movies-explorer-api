const router = require('express').Router();
const {
  validationCreateMovie,
  validationMovieId,
} = require('../middlewares/validations');

const {
  getMovies,
  createMovies,
  deleteMovies,
} = require('../controllers/movies');

router.get('/', getMovies);
router.post('/', validationCreateMovie, createMovies);
router.delete('/:movieId', validationMovieId, deleteMovies);

module.exports = router;

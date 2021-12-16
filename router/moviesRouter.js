const moviesRouter = require('express').Router();
const {
  findOneMovie,
  findManyMovies,
  findMovieById,
  postMovie,
  putMovie,
} = require('../models/moviesModel');

const Joi = require('joi');

const movieValidation = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  director: Joi.string().min(1).max(255).required(),
  year: Joi.number().integer().min(1887).required(),
  color: Joi.boolean().truthy(1).falsy(0).required(),
  duration: Joi.number().integer().min(0).required()
});

const movieEditValidation = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  director: Joi.string().min(1).max(255).optional(),
  year: Joi.number().integer().min(1887).optional(),
  color: Joi.boolean().truthy(1).falsy(0).optional(),
  duration: Joi.number().integer().min(0).optional()
});

moviesRouter.get('/', (req, res) => {
  const { max_duration, color } = req.query;
  findManyMovies({ max_duration, color })
    .then(([movies]) => res.json(movies))
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error retrieving movies from db');
    });
});

moviesRouter.get('/:id', (req, res) => {
  const movieId = req.params.id;
  findOneMovie(movieId)
    .then(([results]) => {
      if (results.length) res.json(results);
      else res.status(404).send('movie not found');
    })
    .catch((err) =>
      res.status(500).send('Error retrieving movies from database')
    );
});

moviesRouter.post('/', (req, res) => {
  const { error, value: validMovie } = movieValidation.validate(req.body);

  if (error) {
    res.status(400).json({message: error});
    return Promise.reject('INVALID_DATA');
  };

  postMovie(validMovie)
    .then(([result]) => {
      const id = result.insertId;
      res.status(201).json({ id, ...validMovie });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'INVALID_DATA') res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving Movie');
    });
});

moviesRouter.put('/:id', (req, res) => {
  const { error, value: validMovie } = movieEditValidation.validate(req.body);
  let existingMovie = null;

  if (error) {
    res.status(422).json({message: error});
    return Promise.reject('INVALID_DATA');
  };

  const movieId = req.params.id;

  findMovieById(movieId)
  .then(([result]) => {
    if (!result.length) {
      res.status(404).send(`Movie with id ${movieId} not found`);
      return  Promise.reject('RECORD_NOT_FOUND');
    } else {
      existingMovie = result;
    }

  putMovie(movieId, validMovie)
    .then((result) => {
      res.status(200).json({ ...movieId, ...validMovie });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('Error updating a movie');
    });
  });
});

module.exports = moviesRouter;

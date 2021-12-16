const connection = require('./db-config');

const express = require('express');
const { restart } = require('nodemon');
const Joi = require('joi');
require('dotenv').config();

const app = express();

app.use(express.json());

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
  } else {
    console.log(
      'connected to database with threadId :  ' + connection.threadId
    );
  }
});



app.get('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  connection.query(
    'SELECT * FROM movies WHERE id = ?',
    [movieId],
    (err, results) => {
      if (err) {
        res.status(500).send('Error retrieving movies from database');
      } else {
        if (results.length) res.json(results[0]);
        else res.status(404).send('movie not found');
      }
    }
  );
});

app.get('/api/users', (req, res) => {
  let sql = 'SELECT * FROM users';
  const sqlValues = [];

  if (req.query.language) {
    sql += ' WHERE language = ?';
    sqlValues.push(req.query.language);
  }

  connection.query(sql, sqlValues, (err, result) => {
    if (err) {
      res.status(500).send(`An error occurred: ${err.message}`);
    } else {
      res.status(200).json(result);
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  connection.query(
    'SELECT * FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        res.status(500).send('Error retrieving users from database');
      } else {
        if (results.length) res.json(results[0]);
        else res.status(404).send('user not found');
      }
    }
  );
});

app.post('/api/movies', (req, res) => {
  const { title, director, year, color, duration } = req.body;
  let validationErrors = null;

  db.query('USE movies')
    .then(() => {
      validationErrors = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        director: Joi.string().min(1).max(255).required(),
        year: Joi.number().integer().min(1887).required(),
        color: Joi.boolean().truthy(1).falsy(0).required(),
        duration: Joi.number().integer().min(0).required(),
      }).validate(
        { title, director, year, color, duration },
        { abortEarly: false }
      ).error;

      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query(
        'INSERT INTO movies(title, director, year, color, duration) VALUES ( ?, ?, ?, ?, ?)',
        [title, director, year, color, duration]
      );
    })
    .then(([result]) => {
      const id = result.insertId;
      res.status(201).json({ id, title, director, year, color, duration });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'INVALID_DATA') res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving Movie');
    });
});

app.post('/api/users', (req, res) => {
  const { firstname, lastname, email, city, language } = req.body;
  let validationErrors = null;

  db.query('SELECT * FROM users WHERE email = ?', [email])
    .then(([result]) => {
      if (result[0]) return Promise.reject('DUPLICATE_EMAIL');
      validationErrors = Joi.object({
        email: Joi.string().email().max(255).required(),
        firstname: Joi.string().max(255).required(),
        lastname: Joi.string().max(255).required(),
        city: Joi.string().allow(null, '').max(255).optional(),
        language: Joi.string().allow(null, '').max(255).optional(),
      }).validate(
        { firstname, lastname, email, city, language },
        { abortEarly: false }
      ).error;

      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query(
        'INSERT INTO users (firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)',
        [firstname, lastname, email, city, language]
      );
    })
    .then(([{ insertId }]) => {
      res
        .status(201)
        .json({ id: insertId, firstname, lastname, email, city, language });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'DUPLICATE_EMAIL')
        res.status(409).json({ message: 'This email is already used' });
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving the user');
    });
});

// This route will update a user in the DB
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { email, firstname, lastname, city, language } = req.body;
  let validationErrors = null;
  const infoToUpdate = req.body;

  console.log(infoToUpdate);

  db.query('SELECT * FROM users WHERE email = ?', [email])
    .then(([result]) => {
      console.log('result email');
      console.log(result[0]);
      if (result[0]) return Promise.reject('DUPLICATE_EMAIL');
      validationErrors = Joi.object({
        email: Joi.string().email().max(255).optional(),
        firstname: Joi.string().max(255).optional(),
        lastname: Joi.string().max(255).optional(),
        city: Joi.string().allow(null, '').max(255).optional(),
        language: Joi.string().allow(null, '').max(255).optional(),
      }).validate(
        { firstname, lastname, email, city, language },
        { abortEarly: false }
      ).error;
      if (validationErrors) return Promise.reject('INVALID_DATA');
      return db.query('UPDATE users SET ? WHERE id = ?', [
        infoToUpdate,
        userId,
      ]);
    })
    .then(({ insertId }) => {
      res
        .status(201)
        .send(`The user with the id ${insertId} just updated his profile`);
    })
    .catch((err) => {
      console.error(err);
      if (err === 'DUPLICATE_EMAIL')
        res.status(409).json({ message: 'email already used' });
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving user');
    });
});

app.put('/api/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const { title, director, year, color, duration } = req.body;
  let existingMovie = null;
  let validationErrors = null;

  db.query('SELECT * FROM movies WHERE id = ?', [movieId])
    .then(([results]) => {
      existingMovie = results[0];
      if (!existingMovie) return Promise.reject('RECORD_NOT_FOUND');

      validationErrors = Joi.object({
        title: Joi.string().min(1).max(255).optional(),
        director: Joi.string().min(1).max(255).optional(),
        year: Joi.number().integer().min(1887).optional(),
        color: Joi.boolean().truthy(1).falsy(0).optional(),
        duration: Joi.number().integer().min(0).optional(),
      }).validate(
        { title, director, year, color, duration },
        { abortEarly: false }
      ).error;

      if (validationErrors) return Promise.reject('INVALID_DATA');

      return db.query('UPDATE movies SET ? WHERE id = ?', [req.body, movieId]);
    })
    .then(() => {
      res.status(200).json({ ...existingMovie, ...req.body });
    })
    .catch((err) => {
      console.log(err);
      if (err === 'RECORD_NOT_FOUND')
        res.status(404).send(`Movie with id ${movieId} not found`);
      else if (err === 'INVALID_DATA') {
        res.status(422).json({ validationErrors });
      } else res.status(500).send('Error updating a movie');
    });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  connection.query(
    'DELETE FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('😱 Error deleting an user');
      } else {
        res.status(200).send('🎉 User deleted!');
      }
    }
  );
});

app.get('/', (request, response) => {
  response.send('Welcome to Express');
});

app.get('/users/:name', (request, response) => {
  response.send(`Welcome, ${request.params.name}`);
});

app.listen(port, () => {
  console.log(`Server is runing on ${port}`);
});

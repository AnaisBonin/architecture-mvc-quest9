const connection = require('../db-config');
const db = connection.promise()

const findOneMovie = (id) => db.query('SELECT * FROM movies WHERE id = ?', [id]);

const findManyMovies = ({ color, max_duration }) => {
  let sql = 'SELECT * FROM movies ';
  const sqlValues = [];

  if (color && max_duration) {
    sql += 'WHERE color = ? AND duration <= ?';
    sqlValues.push(color, max_duration);
  } else if (color) {
    sql += 'WHERE color = ?';
    sqlValues.push(color);
  } else if (max_duration) {
    sql += 'WHERE duration <= ?';
    sqlValues.push(max_duration);
  } else {
    sql;
  }
  return db.query(sql, sqlValues);
};

const postMovie = ({ title, director, year, color, duration }) => db.query(
  'INSERT INTO movies(title, director, year, color, duration) VALUES ( ?, ?, ?, ?, ?)',
  [title, director, year, color, duration]);

const findMovieById = (movieId) => db.query(
  'SELECT * FROM movies WHERE id = ?',
  [movieId]);
  
const putMovie = (movieId, validMovie) => db.query('UPDATE movies SET ? WHERE id = ?', [validMovie, movieId]);

module.exports = {
    findOneMovie,
    findManyMovies,
    findMovieById,
    postMovie,
    putMovie,
};

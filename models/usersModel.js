const { valid } = require('joi');
const connection = require('../db-config');
const db = connection.promise();

const findAllUsers = (language) => {
  let sql = 'SELECT * FROM users';
  const sqlValues = [];

  if (language) {
    sql += ' WHERE language = ?';
    sqlValues.push(language);
  }

  return db.query(sql, sqlValues);
};

const findOneUser = (userId) => db.query('SELECT * FROM users WHERE id = ?', [userId]);

const findUserByEmail = (email) => db.query('SELECT * FROM users WHERE email = ?', [email]);

const postUser = ({ firstname, lastname, email, city, language }) => db.query(
  'INSERT INTO users (firstname, lastname, email, city, language) VALUES (?, ?, ?, ?, ?)',
  [firstname, lastname, email, city, language]
);

const putUser = (userId, validUser) => db.query('UPDATE users SET ? WHERE id = ?', [validUser, userId]);

const deleteUser = (userId) =>
  db.query('DELETE FROM users WHERE id = ?', [userId]);

module.exports = {
  findOneUser,
  findAllUsers,
  findUserByEmail,
  postUser,
  putUser,
  deleteUser,
};

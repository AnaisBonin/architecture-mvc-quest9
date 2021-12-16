const usersRouter = require('express').Router();
const {
  findOneUser,
  findAllUsers,
  findUserByEmail,
  postUser,
  putUser,
  deleteUser,
} = require('../models/usersModel');

const Joi = require('joi');

const userValidation = Joi.object({
  email: Joi.string().email().max(255).required(),
  firstname: Joi.string().max(255).required(),
  lastname: Joi.string().max(255).required(),
  city: Joi.string().allow(null, '').max(255).optional(),
  language: Joi.string().allow(null, '').max(255).optional(),
});

const userEditValidation = Joi.object({
  email: Joi.string().email().max(255).optional(),
  firstname: Joi.string().max(255).optional(),
  lastname: Joi.string().max(255).optional(),
  city: Joi.string().allow(null, '').max(255).optional(),
  language: Joi.string().allow(null, '').max(255).optional(),
});

usersRouter.get('/', (req, res) => {
  const language = req.query.language;

  findAllUsers(language)
    .then(([result]) => {
      if (!result.length) {
        return res.status(404).json({ message: `No user found with the language ${language}`})
      }
      res.status(200).json(result)
    })
    .catch((err) => res.status(500).send(`An error occurred: ${err.message}`));
});

usersRouter.get('/:id', (req, res) => {
  const userId = req.params.id;

  findOneUser(userId)
    .then(([result]) => {
      if (result.length) res.json(result);
      else res.status(404).send(`user with the ID ${userId} not found`);
    })
    .catch((err) =>
      res.status(500).send('Error retrieving users from database')
    );
});

usersRouter.post('/', (req, res) => {
  const { error, value: validUser} = userValidation.validate(req.body);

  if (error) {
    res.status(422).json({message: error});
    return Promise.reject('INVALID_DATA');
  }

  findUserByEmail(validUser.email)
  .then(([result]) => {
    if (result.length) {
      res.status(409).json({ message: 'This email is already used' });
      return Promise.reject('DUPLICATE_EMAIL');
    }
  })

  postUser(validUser)
    .then(([{ insertId }]) => {
      res
        .status(201)
        .json({ id: insertId, ...validUser});
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send('Error saving the user');
    });
});

usersRouter.put('/:id', (req, res) => {
  const { error, value: validUser} = userEditValidation.validate(req.body);

  if (error) {
    res.status(422).json({message: error});
    return Promise.reject('INVALID_DATA');
  }

  findUserByEmail(validUser.email)
  .then(([result]) => {
    if (result.length) {
      res.status(409).json({ message: 'This email is already used' });
      return Promise.reject('DUPLICATE_EMAIL');
    }
  })

  const userId = req.params.id;
  findOneUser(userId)
  .then(([result]) => {
    if (!result.length) res.status(404).send(`user with the ID ${userId} not found`);
  })

  putUser(userId, validUser)
    .then((result) => {
      res
        .status(201)
        .json({ userId, ...validUser});
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send('Error saving user');
    });
});

usersRouter.delete('/:id', (req, res) => {
  const userId = req.params.id;

  deleteUser(userId)
    .then((results) => res.status(200).send('🎉 User deleted!'))
    .catch((err) => {
      console.log(err);
      res.status(500).send('😱 Error deleting an user');
    });
});

module.exports = usersRouter;

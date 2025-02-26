const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken')

async function requireToken(req, res, next) {
  try{
  let user = await User.byToken(req.headers.authorization);
  req.user = user;
  next()
  } catch(error) {
    next(error);
  }
}

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requireToken, async(req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});
app.get('/api/users/:id/notes', requireToken, async(req, res, next)=> {
  try {
    if(req.params.id == req.user.dataValues.id){
    const notes = await Note.findAll({where: {userId: req.params.id}})
    res.send(notes);
    } else {
      res.sendStatus(404);
    }
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
'use strict';
const express = require('express');
const line_login = require('./line-login');
const path = require('path');
const session = require("express-session");

const session_options = {
  secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
  resave: false,
  saveUninitialized: false
}

const config = {
  channel_id: process.env.LINE_LOGIN_CHANNEL_ID,
  channel_secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
  callback_url: process.env.LINE_LOGIN_CALLBACK_URL,
  scope: "openid profile",
  prompt: "consent",
  bot_prompt: "normal"
}

const lineLogin = new line_login(config)

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session(session_options));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  if (req.session.authPass) {
    const profile = req.session.profile;
    res.render('success', profile)
  } else {
    res.render('login', { title: 'page' })
  }
})

app.get("/auth/line", lineLogin.authDirect());
app.get("/auth/line/cb", lineLogin.authcb(
  (req, res, token) => {
    req.session.authPass = true;
    req.session.profile = token.id_token;
    res.redirect('/');
  }, (req, res, next, error) => {
    res.status(400).json(error.message);
  }
));
app.get("/auth/line/logout", (req,res)=>{
  req.session.destroy();
  res.redirect('/');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

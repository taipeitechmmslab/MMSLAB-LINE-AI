'use strict';
const express = require('express');
const line_login = require('./line-login');
const path = require('path');
const session = require('express-session');

//設定session參數
const session_options = {
  secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
  resave: false,
  saveUninitialized: false
};
//設定LINE Login參數
const loginConfig = {
  channel_id: process.env.LINE_LOGIN_CHANNEL_ID,
  channel_secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
  callback_url: process.env.LINE_LOGIN_CALLBACK_URL,
  scope: 'openid profile',
  prompt: 'consent',
  bot_prompt: 'normal'
};

const lineLogin = new line_login(loginConfig);
const app = express();

app.set('views', path.join(__dirname, 'views'));  //設定Template目錄，畫面樣板
app.set('view engine', 'pug');  //設定Template引擎，用於產生畫面
app.use(session(session_options));  //設定使用Session
app.use(express.static(path.join(__dirname, 'public'))); //設定可以取得的檔案

//自訂的畫面路由
app.get('/', (req, res) => {    
  if (req.session.authPass) {
    const profile = req.session.profile;
    res.render('success', profile); //自訂成功登入頁面
  } else if (req.session.errMsg) {
    res.render('login', {  //自訂尚未登入頁面，顯示錯誤訊息
      ErrMsg: req.session.errMsg
    });
  } else {
    res.render('login');  //自訂尚未登入頁面，沒有錯誤訊息
  }
});

//LINE Login相關的API
app.get('/auth/line', lineLogin.authDirect()); //產生跳轉到LINE的登入網址
app.get('/auth/line/cb', lineLogin.authcb( //從LINE登入後接收訊息
  (req, res, token) => {
    req.session.authPass = true;
    req.session.profile = token.id_token;
    res.redirect('/');
  }, (req, res, next, error) => {
    req.session.authPass = false;
    req.session.errMsg = error.message;
    res.redirect('/');
  }
));

//清除session API
app.get('/auth/line/logout', (req, res) => { //登出帳號清除session
  req.session.destroy();
  res.redirect('/');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
'use strict';
const express = require('express');
const line_notify = require('./line-notify');
const path = require('path');
const session = require('express-session');
const moment = require('moment');

//設定session參數
const session_options = {
  secret: process.env.LINE_NOTIFY_CHANNEL_SECRET,
  resave: false,
  saveUninitialized: false
};
//設定LINE Notify參數
const notifyConfig = {
  channel_id: process.env.LINE_NOTIFY_CHANNEL_ID,
  channel_secret: process.env.LINE_NOTIFY_CHANNEL_SECRET,
  callback_url: process.env.LINE_NOTIFY_CALLBACK_URL,
};

const lineNotify = new line_notify(notifyConfig);
const app = express();

app.set('views', path.join(__dirname, 'views'));  //設定Template目錄，畫面樣板
app.set('view engine', 'pug');  //設定Template引擎，用於產生畫面
app.use(session(session_options));  //設定使用Session
app.use(express.static(path.join(__dirname, 'public'))); //設定可以取得的檔案

//自訂的畫面路由
app.get('/', (req, res) => {
  if (req.session.authPass) {
    const name = req.session.notify_info.target;
    const schNotify = req.session.schNotify;
    res.render('success', { name, schNotify }); //自訂成功登入頁面LINE Notify功能
  } else if (req.session.errMsg) {
    res.render('login', {  //自訂尚未登入頁面，顯示錯誤訊息
      ErrMsg: req.session.errMsg
    });
  } else {
    res.render('login');  //自訂尚未登入頁面，沒有錯誤訊息
  }
});

//LINE Notify相關的API
app.get('/auth/notify', lineNotify.authDirect()); //產生跳轉到LINE Notify的授權網址
app.get('/auth/notify/cb', lineNotify.authcb( //Notify API端點接收授權訊息
  (req, res) => { //登入成功
    req.session.authPass = true;  
    res.redirect('/');
  }, (req, res, error) => {  //登入失敗
    req.session.authPass = false;
    req.session.errMsg = error.message;
    res.redirect('/');
  }
));

//預定通知Notify API
app.get('/auth/notify/me', (req, res) => {
  const notifySeconds = req.query.n_s || 5;
  const scheduleTime = moment().add(notifySeconds, 's').format('LTS');
  const msg = `${scheduleTime} 通知訊息`;
  setTimeout(() => {  //設定一個延遲的訊息推播
    lineNotify.sendMsg(req.session.access_token, msg);
    delete req.session.schNotify;
  }, notifySeconds * 1000);
  req.session.schNotify = scheduleTime;  //儲存推播的時間
  res.redirect('/');
});

//清除session API
app.get('/auth/notify/logout', (req, res) => { //登出帳號清除session
  req.session.destroy();
  res.redirect('/');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
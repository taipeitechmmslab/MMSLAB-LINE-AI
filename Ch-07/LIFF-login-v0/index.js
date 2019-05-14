'use strict';
const express = require('express');
const path = require('path');

const app = express();

app.set('views', path.join(__dirname, 'views'));  //設定Template目錄，畫面樣板
app.set('view engine', 'pug');  //設定Template引擎，用於產生畫面
app.use(express.static(path.join(__dirname, 'public'))); //設定可以取得的檔案

//自訂的畫面路由
app.get('/', (req, res) => {    
  res.render('index'); //自訂登入的首頁
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
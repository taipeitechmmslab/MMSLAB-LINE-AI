'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const querystring = require('querystring');
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const menuConfig = {
   'default' : '<首頁的RichMenuId>',
   'menu-1' : '<選單1的RichMenuId>',
   'menu-2' : '<選單2的RichMenuId>'
}
const client = new line.Client(config);
const app = express();
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});
function handleEvent(event) {
  if (event.replyToken === "00000000000000000000000000000000" ||
    event.replyToken === "ffffffffffffffffffffffffffffffff") { //判斷事件類型是否為Webhook URL測試
    return Promise.resolve(null);
  }
  if (event.type === 'postback') { 
    const data = querystring.parse(event.postback.data); //抓取查詢的參數
    switch (data.action) {
      case 'menu-default': //回到首頁
        client.linkRichMenuToUser(event.source.userId,menuConfig['default']); //設定此使用者的richmenu為首頁
        break;
      case 'menu-1':
        client.linkRichMenuToUser(event.source.userId,menuConfig['menu-1']); //設定此使用者的richmenu為選單1
        break;
      case 'menu-2':
        client.linkRichMenuToUser(event.source.userId,menuConfig['menu-2']); //設定此使用者的richmenu為選單2
        break;
    }
  }    
  return Promise.resolve(null); 
}
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

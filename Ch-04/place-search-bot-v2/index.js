'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const gPlaceSearch = require('./gPlaceSearch');
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);
const gSearchMgr = new gPlaceSearch();
const app = express();
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent)) //使用handleEvent函數，分析事件
    .then((result) => res.json(result)) //回應給LINE Server
    .catch((err) => {
      console.error(`Event ${err}`); //印出錯誤的事件內容
      res.status(500).end();
    });
});
app.get('/', (req, res) => {
  res.json("ok");
});
let conversation = {};
function handleEvent(event) { 
  if (event.replyToken === "00000000000000000000000000000000" ||
    event.replyToken === "ffffffffffffffffffffffffffffffff") { //判斷事件類型是否為Webhook URL測試
    return Promise.resolve(null);
  }
  if (event.type === 'message' && event.message.type === 'location') {
    conversation[event.source.userId] = event.message;  //暫存使用者傳送的地點訊息
    const catReply = {  //詢問使用者要查詢的地點訊息
      type: 'text',  
      text: '輸入要查詢的地點類型與半徑範例:\r\n300restaruant\r\ncafe100\r\natm 300\r\n'
    };
    return client.replyMessage(event.replyToken, catReply);
  }
  else if (event.type === 'message' &&
    event.message.type === 'text' &&
    conversation[event.source.userId] !== undefined) { //已經傳送過地點訊息接著傳送文字訊息
    const lat = conversation[event.source.userId].latitude;  //取出地點訊息的緯度
    const lng = conversation[event.source.userId].longitude;  //取出地點訊息的經度
    let radius = event.message.text.match(/\d/g);  //取出文字訊息的數字部分
    if (radius === null) {  //如果沒有數字預設半徑則為1500公尺
      radius = 1500
    } else {
      radius = radius.join('');
      radius = radius < 5 ? 100 : radius;  //小於5的搜尋半徑也設為100公尺
    }
    let searchType = event.message.text.match(/[a-zA-z]+/g);  //取出文字訊息的文字部分
    searchType = searchType === null ? 'restaruant' : searchType.join("").toLowerCase();
    const searchParams = {
      location: `${lat},${lng}`,
      radius: radius,
      type: searchType,
      language: 'zh-TW'
    }
    delete conversation[event.source.userId];  //刪除使用者的地點暫存內容
    gSearchMgr.SearchResultImageTmp(searchParams)  //搜尋地點並產生樣板訊息
      .then((msgToUser) => {
        return client.replyMessage(event.replyToken, msgToUser);
      })      
  } else {
    const searchReply = { type: 'text', text: '傳送地址給我，我會幫你找附近的地點喔!' };
    return client.replyMessage(event.replyToken, searchReply);
  }
  return Promise.resolve(null);
}
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

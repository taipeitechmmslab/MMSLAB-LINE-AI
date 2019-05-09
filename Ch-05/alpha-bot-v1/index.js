'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const querystring = require('querystring');
const imgur = require('./imgur');
const gPlaceSearch = require('./gPlaceSearch');
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);
const imgurMrg = new imgur();
const gSearchMgr = new gPlaceSearch();
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
app.get('/', (req, res) => {
  res.json("ok");
});
let conversation = {};
function handleEvent(event) {
  if (event.replyToken === "00000000000000000000000000000000" ||
    event.replyToken === "ffffffffffffffffffffffffffffffff") { //判斷事件類型是否為Webhook URL測試
    return Promise.resolve(null);
  }
  if (event.type === 'message' && event.message.type === 'image') { 
    if (event.message.contentProvider.type === "line") { //上傳圖片小幫手功能：使用者傳送LINE圖片的訊息
      client.getMessageContent(event.message.id) //取得的檔案串流的data位元組
        .then((stream) => {
          let data = [];
          stream.on('data', (chunk) => {
            data.push(chunk)
          })
          stream.on('end', () => { //取得的檔案串流的stream結束end
            const image = `${Buffer.concat(data).toString('base64')}` //data位元組串接後用Base64格式編碼
            imgurMrg.uploadImg(image) //透過imgurMgr的自訂方法上傳圖片
              .then((body) => { //取得上傳的結果
                const resBody = JSON.parse(body); //取出將上傳結果資料轉為JSON
                const templateMsg = imgurMrg.ShareAndDeleteTmp(event.source.userId, resBody); //產生樣板訊息
                return client.replyMessage(event.replyToken, templateMsg); //發送樣板訊息給使用者
              });
          })
        })
    }
  } else if (event.type === 'postback') {  //上傳圖片小幫手功能：點擊了Postback按鈕
    const data = querystring.parse(event.postback.data); //抓取查詢的參數
    switch (data.action) {
      case 'img-delete': //刪除照片
        imgurMrg.deleteImg(data.hash)  //透過imgurMgr的自訂方法刪除圖片
          .then(() => {
            return client.replyMessage(event.replyToken, { type: 'text', text: 'Deleted' });
          })
        break;
    }
  } else if (event.type === 'message' && event.message.type === 'location') { //查詢地點小幫手功能：傳送地點
    conversation[event.source.userId] = event.message;  //暫存使用者傳送的地點訊息
    const catReply = {
      type: 'text',
      text: '輸入要查詢的地點類型與半徑範例:\r\n300restaruant\r\ncafe100\r\natm 300\r\n'
    };
    return client.replyMessage(event.replyToken, catReply); //回傳訊息給使用者
  }
  else if (event.type === 'message' &&
    event.message.type === 'text' &&
    conversation[event.source.userId] !== undefined) { //查詢地點小幫手功能傳送過地址，且回覆了查詢類型文字
    const lat = conversation[event.source.userId].latitude;  //取出地點訊息的緯度
    const lng = conversation[event.source.userId].longitude; //取出地點訊息的經度
    let radius = event.message.text.match(/\d/g); //取出文字訊息的數字部分
    if (radius === null) {  //如果沒有數字預設半徑則為1500公尺
      radius = 1500
    } else {
      radius = radius.join('');
      radius = radius < 5 ? 100 : radius;  //小於5的搜尋半徑也設為100公尺
    }
    let searchType = event.message.text.match(/[a-zA-z]+/g); //取出文字訊息的文字部分
    searchType = searchType === null ? 'restaruant' : searchType.join("").toLowerCase();
    const searchParams = {
      location: `${lat},${lng}`,
      radius: radius,
      type: searchType,
      language: 'zh-TW'
    }
    delete conversation[event.source.userId]; //刪除使用者的地點暫存內容
    gSearchMgr.SearchResultImageTmp(searchParams) //搜尋地點並產生樣板訊息
      .then((msgToUser) => {
        return client.replyMessage(event.replyToken, msgToUser);
      })
  }
  else {  //使用者沒有傳送過地址，也沒有傳送圖片，直接提示可以傳送的訊息
    const msgToUser = {
      type: 'text',
      text: '傳送相片或地點給我吧!!',
      quickReply: {
        items: [
          {  //第一個動作，開啟相機
            type: 'action',
            action: {
              type: 'camera',
              label: '開啟相機'
            }
          },
          {  //第二個動作，開啟相簿
            type: 'action',
            action: {
              type: 'cameraRoll',
              label: '開啟相簿'
            }
          },
          {  //第三個動作，開啟地圖
            type: 'action',
            action: {
              type: 'location',
              label: '開啟地圖'
            }
          }
        ]
      }
    }
    return client.replyMessage(event.replyToken, msgToUser);  //回傳訊息給使用者
  }
  return Promise.resolve(null); //未知的訊息種類，不做任何處理
}
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

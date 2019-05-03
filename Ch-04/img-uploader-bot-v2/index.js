'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const querystring = require('querystring');
const imgur = require('./imgur');
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);
const imgurMgr = new imgur();
const app = express();
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent)) //使用handleEvent函數，分析事件
    .then((result) => res.json(result)) //回應給LINE Server
    .catch((err) => {
      console.error(err); //印出錯誤的事件內容
      res.status(500).end();
    });
});
app.get('/', (req, res) => {
  res.json("ok");
});
function handleEvent(event) {
  if (event.replyToken === "00000000000000000000000000000000" || 
    event.replyToken === "ffffffffffffffffffffffffffffffff") {//判斷事件類型是否為Webhook URL測試
    return Promise.resolve(null);
  }
  if (event.type === 'message' && event.message.type === 'image') {
    if (event.message.contentProvider.type === "line") {
      client.getMessageContent(event.message.id) //取得LINE訊息的檔案
        .then((stream) => {
          let data = [];
          stream.on('data', (chunk) => {  //取得的檔案串流的data位元組
            data.push(chunk)
          })
          stream.on('end', () => {  //取得的檔案串流的stream結束end
            const image = `${Buffer.concat(data).toString('base64')}` //data位元組串接後用Base64格式編碼
            imgurMgr.uploadImg(image)  //透過imgurMgr的自訂方法上傳圖片
              .then((body) => {  //取得上傳的結果
                const resBody = JSON.parse(body);  //取出將上傳結果資料轉為JSON
                const templateMsg = imgurMgr.ShareAndDeleteTmp(event.source.userId, resBody); //產生樣板訊息
                return client.replyMessage(event.replyToken, templateMsg); //發送樣板訊息給使用者
              });
          })
        })
    }
  } else if (event.type === 'postback') {
    const data = querystring.parse(event.postback.data); //抓取查詢的參數
    switch (data.action) {
      case 'img-delete': //刪除照片
        imgurMgr.deleteImg(data.hash) //
          .then(() => {
            return client.replyMessage(event.replyToken, { type: 'text', text: 'Deleted' });
          })
        break;
    }
  }
  return Promise.resolve(null);
}
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

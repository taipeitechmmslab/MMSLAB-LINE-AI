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
function handleEvent(event) {
  if (event.replyToken === "00000000000000000000000000000000" || 
  event.replyToken === "ffffffffffffffffffffffffffffffff") {
    return Promise.resolve(null);
  }
  if (event.type === 'message' && event.message.type === 'image') {
    if (event.message.contentProvider.type === "line") {
      client.getMessageContent(event.message.id)
        .then((stream) => {
          let data = [];
          stream.on('data', (chunk) => {
            data.push(chunk)
          })
          stream.on('end', () => {
            const image = `${Buffer.concat(data).toString('base64')}`
            imgurMgr.uploadImg(image)
              .then((body) => {
                const resBody = JSON.parse(body);
                const templateMsg = imgurMgr.ShareAndDeleteTmp(event.source.userId, resBody);
                return client.replyMessage(event.replyToken, templateMsg);
              });
          })
        })
    }
  } else if (event.type === 'postback') {
    const data = querystring.parse(event.postback.data);
    switch (data.action) {
      case 'img-delete':
        imgurMgr.deleteImg(data.hash)
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

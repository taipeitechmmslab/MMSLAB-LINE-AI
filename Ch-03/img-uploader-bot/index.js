'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request');
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const imgrConfig = {
  imgurClientId: process.env.IMGUR_CLIENT_ID
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
app.get('/', (req, res) => {
  res.json("ok");
});
function handleEvent(event) {
  if (event.replyToken === "00000000000000000000000000000000" || event.replyToken === "ffffffffffffffffffffffffffffffff") {
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
            const uploadImg = {
              url: "https://api.imgur.com/3/image",
              headers: {
                'Authorization': `Client-ID ${imgrConfig.imgurClientId}`,
              },
              form: {
                'image': image
              }
            };
            request.post(uploadImg, (err, httpResponse, body) => {
              if (httpResponse.statusCode === 200) {
                const resBody = JSON.parse(body);
                const picLink = { type: 'text', text: resBody.data.link };
                return client.replyMessage(event.replyToken, picLink);
              } else {
                const uploadFail = { type: 'text', text: 'Send to Imgur Fail' };
                return client.replyMessage(event.replyToken, uploadFail);
              }
            })
          })
        })
    }
  }
  return Promise.resolve(null);
}
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

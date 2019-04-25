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
            imgurMrg.uploadImg(image)
              .then((body) => {
                const resBody = JSON.parse(body);
                const templateMsg = imgurMrg.ShareAndDeleteTmp(event.source.userId, resBody);
                return client.replyMessage(event.replyToken, templateMsg);
              });
          })
        })
    }
  } else if (event.type === 'postback') {
    const data = querystring.parse(event.postback.data);
    switch (data.action) {
      case 'img-delete':
        imgurMrg.deleteImg(data.hash)
          .then(() => {
            return client.replyMessage(event.replyToken, { type: 'text', text: 'Deleted' });
          })
        break;
    }
  } else if (event.type === 'message' && event.message.type === 'location') {
    conversation[event.source.userId] = event.message;
    const catReply = {
      type: 'text',
      text: '輸入要查詢的地點類型與半徑範例:\r\n300restaruant\r\ncafe100\r\natm 300\r\n'
    };
    return client.replyMessage(event.replyToken, catReply);
  }
  else if (event.type === 'message' &&
    event.message.type === 'text' &&
    conversation[event.source.userId] !== undefined) {
    const lat = conversation[event.source.userId].latitude;
    const lng = conversation[event.source.userId].longitude;
    let radius = event.message.text.match(/\d/g);
    if (radius === null) {
      radius = 1500
    } else {
      radius = radius.join('');
      radius = radius < 5 ? 100 : radius;
    }
    let searchType = event.message.text.match(/[a-zA-z]+/g);
    searchType = searchType === null ? 'restaruant' : searchType.join("").toLowerCase();
    const searchParams = {
      location: `${lat},${lng}`,
      radius: radius,
      type: searchType,
      language: 'zh-TW'
    }
    delete conversation[event.source.userId];
    gSearchMgr.SearchResultImageTmp(searchParams)
      .then((msgToUser) => {
        return client.replyMessage(event.replyToken, msgToUser);
      })
  }
  else {
    const msgToUser = {
      type: 'text',
      text: '傳送相片或地點給我吧!!',
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'camera',
              label: '開啟相機'
            }
          },
          {
            type: 'action',
            action: {
              type: 'cameraRoll',
              label: '開啟相簿'
            }
          },
          {
            type: 'action',
            action: {
              type: 'location',
              label: '開啟地圖'
            }
          }
        ]
      }
    }
    return client.replyMessage(event.replyToken, msgToUser);
  }
  return Promise.resolve(null);
}
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

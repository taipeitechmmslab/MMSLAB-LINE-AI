'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request');
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const gMapAPI = {
  key: process.env.GOOGLE_MAP_API_KEY
}
const client = new line.Client(config);
const app = express();
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(`Event ${err}`);
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
  if (event.type === 'message' && event.message.type === 'location') {
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
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?
            location=${lat},${lng}&
            radius=${radius}&
            type=${searchType}&
            language=zh-TW&
            key=${gMapAPI.key}`.replace(/\n/g, '').replace(/\s/g, '');
    request.get(searchUrl, (err, httpResponse, body) => {
      let msgToUser = { type: 'text', text: 'Searching' };
      if (httpResponse.statusCode === 200) {
        const resBody = JSON.parse(body);
        let places = resBody.results.map((p) => {
          return `${p.name}\r\nhttps://www.google.com/maps/place/?q=place_id:${p.place_id}`
        });
        places.unshift(`${radius}公尺內的${searchType}：`);
        msgToUser.text = places.join('\r\n');
      } else {
        msgToUser.text = `沒有找到${radius}公尺內的${searchType}地點。`;
      }
      return client.replyMessage(event.replyToken, msgToUser);
    })
    delete conversation[event.source.userId];
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

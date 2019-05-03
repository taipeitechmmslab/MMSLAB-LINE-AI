const request = require('request');
const querystring = require('querystring');
const authConfig = {
  GoogleKey: process.env.GOOGLE_MAP_API_KEY,
  ImgurClientId: process.env.IMGUR_CLIENT_ID
};
module.exports = class search {
  constructor() {
    this.authKey = authConfig.GoogleKey;
    this.nearBySearchAPIURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?';
    this.placeIdURL = 'https://www.google.com/maps/place/?q=place_id:';
    this.imgurAPIURL = 'https://api.imgur.com/3/upload';
    this.default = 'https://i.imgur.com/ukLRiR9.jpg';
    this.photoDB = {};
  }
  SearchResultImageTmp(params) {  //傳入搜尋的地點參數並產生搜尋結果的image carousel
    params.key = this.authKey; //設定Place API的授權
    const searchURL = this.nearBySearchAPIURL + querystring.stringify(params, '&');
    return new Promise((resolve, reject) => {
      request.get(searchURL, (err, httpResponse, body) => {
        let msgToUser = { type: 'text', text: 'Searching' };
        if (!err && httpResponse.statusCode === 200) {
          const resBody = JSON.parse(body); //成功搜尋地點
          Promise
            .all(resBody.results.slice(0, 10).map((p) => {
              let placeImgTmpMsg = {
                imageUrl: this.default,
                action: {  //單一URI動作，點擊後打開Google Map的網址
                  type: 'uri',
                  label: p.name.slice(0, 12), //image carousel的label只能有12個字
                  uri: `${this.placeIdURL}${p.place_id}`
                }
              };
              if (this.photoDB[p.place_id] === undefined) {  //是否曾上傳地圖的圖片至Imgur網站
                if (p.photos !== undefined) {  //有時候Place Photos API會拿不到圖片
                  return this.GetPlacePhoto(p.place_id, p.photos[0].photo_reference)  //取得第一個相片編號
                    .then((link) => { //圖片上傳至Imgur完成
                      placeImgTmpMsg.imageUrl = link;
                      return placeImgTmpMsg;
                    });
                }
                return Promise.resolve(placeImgTmpMsg);
              }
              else {
                placeImgTmpMsg.imageUrl = this.photoDB[p.place_id]; //曾經上傳過地點圖片至Imgur
                return Promise.resolve(placeImgTmpMsg);
              }
            }))
            .then((places) => { //所有搜尋的地點資訊被處裡轉換成column陣列
              msgToUser = { //使用image carousel的樣板訊息
                type: 'template', 
                altText: 'Show Places',
                template: {
                  type: 'image_carousel',
                  columns: places  //
                }
              };
              resolve(msgToUser);
            });
        } else {
          resolve(msgToUser);
        }
      })
    })
  }
  GetPlacePhoto(place_id, photoRefId) { //取得上傳至Imgur的地點圖片
    if (this.photoDB[place_id] === undefined) { //檢查有無暫存的圖片
      const searchURL = {
        url: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024'
          + `&photoreference=${photoRefId}`
          + `&key=${this.authKey}`,
        encoding: null
      };
      return new Promise((resolve, reject) => {
        request.get(searchURL, (err, httpResponse, body) => { //使用Place Photos API取得圖片
          if (!err && httpResponse.statusCode === 200) {
            this.upPhotoToImgur(body) //上傳地點圖片至Imgur
              .then((resolveBody) => {  //上傳圖片完成取得結果
                this.photoDB[place_id] = resolveBody.data.link;
                resolve(this.photoDB[place_id]); 
              })
              .catch((err) => {
                resolve(this.default);
              });
          } else {
            resolve(this.default);
          }
        })
      })
    } else {
      return Promise.resolve(this.photoDB[place_id]);
    }
  }
  upPhotoToImgur(image) {
    const uploadImg = {
      url: this.imgurAPIURL,
      headers: {
        'Authorization': `Client-ID ${authConfig.ImgurClientId}`
      },
      form: {
        'image': image.toString('base64')  //直接將取得的影像轉換為base64的影像格式
      }
    };
    return new Promise((resolve, reject) => {
      request.post(uploadImg, (err, httpResponse, body) => {
        if (httpResponse.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(err);
        }
      })
    })
  }
}

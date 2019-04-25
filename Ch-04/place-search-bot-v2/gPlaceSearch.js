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
  SearchResultImageTmp(params) {
    params.key = this.authKey;
    const searchURL = this.nearBySearchAPIURL + querystring.stringify(params, '&');
    return new Promise((resolve, reject) => {
      request.get(searchURL, (err, httpResponse, body) => {
        let msgToUser = { type: 'text', text: 'Searching' };
        if (!err && httpResponse.statusCode === 200) {
          const resBody = JSON.parse(body);
          Promise
            .all(resBody.results.slice(0, 10).map((p) => {
              let placeImgTmpMsg = {
                imageUrl: this.default,
                action: {
                  type: 'uri',
                  label: p.name.slice(0, 12),
                  uri: `${this.placeIdURL}${p.place_id}`
                }
              };
              if (this.photoDB[p.place_id] === undefined) {
                if (p.photos !== undefined) {
                  return this.GetPlacePhoto(p.place_id, p.photos[0].photo_reference)
                    .then((link) => {
                      placeImgTmpMsg.imageUrl = link;
                      return placeImgTmpMsg;
                    });
                }
                return Promise.resolve(placeImgTmpMsg);
              }
              else {
                placeImgTmpMsg.imageUrl = this.photoDB[p.place_id];
                return Promise.resolve(placeImgTmpMsg);
              }
            }))
            .then((places) => {
              msgToUser = {
                type: 'template',
                altText: 'Show Places',
                template: {
                  type: 'image_carousel',
                  columns: places
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
  GetPlacePhoto(place_id, photoRefId) {
    if (this.photoDB[place_id] === undefined) {
      const searchURL = {
        url: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024'
          + `&photoreference=${photoRefId}`
          + `&key=${this.authKey}`,
        encoding: null
      };
      return new Promise((resolve, reject) => {
        request.get(searchURL, (err, httpResponse, body) => {
          if (!err && httpResponse.statusCode === 200) {
            this.upPhotoToImgur(body)
              .then((resolveBody) => {
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
        'image': image.toString('base64')
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

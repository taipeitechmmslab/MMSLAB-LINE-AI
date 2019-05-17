const request = require('request');
const crypto = require('crypto');
const Promise = require('bluebird');

Promise.promisifyAll(request);

class LineNotify {
  constructor(opts) { //預設參數
    const required_params = ['channel_id', 'channel_secret', 'callback_url'];
    required_params.map((params) => {
      if (!opts[params]) {
        throw new Error(`${params} missing.`);
      }
    });
    this.channel_id = opts.channel_id;
    this.channel_secret = opts.channel_secret;
    this.callback_url = opts.callback_url;
    this.scope = 'notify';
    this.baseURL = 'https://notify-bot.line.me/';
    this.token_db = {}; //暫存所有使用者的Token
  }

  authDirect() { //產生LINE Notify的授權網址
    return (req, res) => {
      const state = req.session.line_login_state = LineNotify._random();
      const url = this.secure_auth_url(state); //取得與LINE Notify相關參數的網址
      return res.redirect(url);
    };
  }

  secure_auth_url(state) { //產生與LINE Notify相關參數的網址
    const client_id = encodeURIComponent(this.channel_id);
    const redirect_uri = encodeURIComponent(this.callback_url);
    const scope = encodeURIComponent(this.scope);
    let url = `${this.baseURL}oauth/authorize?response_type=code&` +
      `client_id=${client_id}&redirect_uri=${redirect_uri}` +
      `&scope=${scope}&state=${state}`;
    return url;
  }

  authcb(succ, fail) { //處理LINE Server的跳轉授權，並取得Access Token
    return (req, res, next) => {
      const { code } = req.query;
      const { state } = req.query;
      if (req.session.line_login_state !== state) { //驗證是否為相同使用者的瀏覽器
        return fail(req, res, next, new Error('Authorization failed. State does not match.'));
      }
      this.issue_line_access_token(code).then((token_response) => { //取得Access Token
        req.session.access_token = token_response;
        this.checkToken(token_response).then(
          result =>{
            this.token_db[result.target] = token_response; //暫存使用者的Token
            req.session.notify_info = {
              'target':result.target,
              'targetType': result.targetType
            };
            succ(req, res); //將Access Token傳給succ的函數
          }
        );        
      }).catch((error) => {
        fail(req, res, error); //將error傳給fail的函數
      });
    };
  }

  issue_line_access_token(code) { //取得使用者的Access Token
    const url = this.baseURL + 'oauth/token';
    const form = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.callback_url,
      client_id: this.channel_id,
      client_secret: this.channel_secret,
    };
    return request.postAsync({
      url,
      form,
    }).then((response) => {
      if (response.statusCode == 200) {
        return JSON.parse(response.body).access_token;
      }
      return Promise.reject(new Error(response.statusMessage));
    });
  }
  sendMsg(target, message) {  //發送文字訊息
    const url = 'https://notify-api.line.me/api/notify';
    const headers = {
      'Authorization': 'Bearer ' + target,
    };
    const form = {
      'message': message
    };
    return request.postAsync({
      url,
      headers,
      form,
    });
  }
  checkToken(token){  //檢查憑證狀態
    const checkTokenReq = {
      url: 'https://notify-api.line.me/api/status',
      headers: {
         'Authorization': 'Bearer ' + token
      }
    };
    return request.getAsync(checkTokenReq).then((response) => {
      if (response.statusCode == 200) {
        return JSON.parse(response.body);
      }
      return Promise.reject(new Error(response.statusMessage));
    });
  }
  static _random() { //產生亂數40位的16進制字串
    return crypto.randomBytes(20).toString('hex');
  }
}
module.exports = LineNotify;
const request = require('request');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Promise = require('bluebird');

Promise.promisifyAll(request);

class LineLogin {
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
    this.scope = opts.scope || 'profile openid';
    this.prompt = opts.prompt;
    this.bot_prompt = opts.bot_prompt || 'normal';
    this.baseURL = 'https://access.line.me/oauth2/';
  }

  authDirect() { //產生使用LINE Loign的網址
    return (req, res) => {
      const state = req.session.line_login_state = LineLogin._random();
      const nonce = req.session.line_login_nonce = LineLogin._random();
      const url = this.secure_auth_url(state, nonce); //取得與第三方應用的相關參數的網址
      return res.redirect(url);
    };
  }

  secure_auth_url(state, nonce) { //產生與第三方應用的相關參數的網址
    const client_id = encodeURIComponent(this.channel_id);
    const redirect_uri = encodeURIComponent(this.callback_url);
    const scope = encodeURIComponent(this.scope);
    const bot_prompt = encodeURIComponent(this.bot_prompt);
    let url = `${this.baseURL}v2.1/authorize?response_type=code&`+
              `client_id=${client_id}&redirect_uri=${redirect_uri}`+
              `&scope=${scope}&bot_prompt=${bot_prompt}&state=${state}`;
    if (this.prompt) url += `&prompt=${encodeURIComponent(this.prompt)}`;
    if (nonce) url += `&nonce=${encodeURIComponent(nonce)}`;
    return url;
  }

  authcb(succ, fail) {  //處理LINE Server的跳轉授權，並取得Aceesk Token
    return (req, res, next) => {
      const { code } = req.query;
      const { state } = req.query;
      if (req.session.line_login_state !== state) { //驗證是否為相同使用者的瀏覽器
        return fail(req, res, next, new Error('Authorization failed. State does not match.'));
      }
      this.issue_line_access_token(code).then((token_response) => { //取得Aceesk Token
        if (token_response.id_token) {
          let decoded_id_token;
          try {
            decoded_id_token = jwt.verify( //JWT 解碼與驗證
              token_response.id_token,
              this.channel_secret,
              {
                audience: this.channel_id,
                issuer: 'https://access.line.me',
                algorithms: ['HS256'],
              },
            );
            if (decoded_id_token.nonce !== req.session.line_login_nonce) { //驗證JWT是否有被修改過
              throw new Error('nonce not match.');
            }
            token_response.id_token = decoded_id_token; //
          } catch (exception) {
            fail(new Error('Verification of id token failed.'));
          }
        }
        delete req.session.line_login_state;
        delete req.session.line_login_nonce;
        succ(req, res, token_response); //將Acess Token傳給succ的函數
      }).catch((error) => {
        fail(req, res, next, error); //將error傳給傳給fail的函數
      });
    };
  }

  issue_line_access_token(code) { //取得使用者的Access Token
    const url = 'https://api.line.me/oauth2/v2.1/token';
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
        return JSON.parse(response.body);
      }
      return Promise.reject(new Error(response.statusMessage));
    });
  }

  static _random() {  //產生亂數40位的16進制字串
    return crypto.randomBytes(20).toString('hex');
  }
}
module.exports = LineLogin;

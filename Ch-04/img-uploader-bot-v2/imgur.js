const request = require('request');
const imgrConfig = {
    imgurClientId: process.env.IMGUR_CLIENT_ID  //imgur授權ID
}
module.exports = class Imgur {
    constructor() {  //參數初始化
        this.clientId = imgrConfig.imgurClientId;  //imgur授權ID設定
        this.url = 'https://api.imgur.com/3/image';  //imgur API網址設定
        this.db = {}  //暫存使用者的buttons template訊息
    }
    ShareAndDeleteTmp(id, resBody) {  //產生兩種樣板訊息，樣板訊息中包含2個動作按鈕
        let tmpMsg = {
            type: 'template',
            altText: 'Photo share',  //功能無法顯示時的替代文字
            template: {
                type: 'buttons', //指定為buttons template
                thumbnailImageUrl: `${resBody.data.link}`, //縮圖的網址
                text: '已上傳的圖片',
                defaultAction: {  //預設點擊圖片的動作
                    type: 'uri',
                    label: 'View Photo',
                    uri: `${resBody.data.link}`
                },
                actions: [
                    {//第一個動作按鈕，分享圖片網址至聊天室
                        type: 'uri',
                        label: '分享連結至聊天室',
                        uri: `line://msg/text/?${resBody.data.link}`
                    },
                    {//第二個動作按鈕，刪除此圖片
                        type: 'postback',
                        label: '刪除此圖片',
                        data: `action=img-delete&hash=${resBody.data.deletehash}`
                    }
                ]
            }
        };
        if (this.db[id] === undefined) { //判斷使用者有無產生過樣板訊息
            this.db[id] = [tmpMsg]; //以使用者ID作為key，設定第一筆按鈕樣板訊息。
            return tmpMsg;
        } else {
            this.db[id].push(tmpMsg); //堆疊按鈕樣板訊息
            const photos = this.db[id].slice(-10).map((photo, idx) => { //取得最後10筆的按鈕樣板訊息
                return {  //將buttons template訊息的相同部分取出轉換為column訊息物件
                    text: `Photo ${idx + 1}`,  //將樣板訊息的標題依圖片的順序命名
                    thumbnailImageUrl: photo.template.thumbnailImageUrl,
                    defaultAction: photo.template.defaultAction,
                    actions: photo.template.actions
                }
            });
            return {
                type: 'template',
                altText: 'Photos share',
                template: {  //指定為carousel template
                    type: 'carousel',
                    columns: photos
                }
            }
        }
    }
    uploadImg(image) {  //上傳圖片至imgur，使用base64的影像格式
        const uploadImg = {
            url: this.url,
            headers: {
                'Authorization': `Client-ID ${this.clientId}`,  //imgur的授權ID
            },
            form: {
                'image': image
            }
        };
        return new Promise((resolve, reject) => {
            request.post(uploadImg, (err, httpResponse, body) => {  //使用HTTP POST的imgur API上傳圖片
                if (httpResponse.statusCode === 200) {
                    resolve(body);  //取得結果
                } else {
                    reject(err);
                }
            })
        })
    }
    deleteImg(hash) {  //刪除Imgur的圖片
        const imgDelete = {
            url: `${this.url}/${hash}`,  //要被刪除的圖片hash
            headers: {
                'Authorization': `Client-ID ${this.clientId}`,
            }
        };
        return new Promise((resolve, reject) => {
            request.delete(imgDelete, (err, httpResponse, body) => {
                if (httpResponse.statusCode === 200) {
                    resolve(body);  //刪除成功
                } else {
                    reject(err);  //刪除失敗
                }
            })
        })
    }
}

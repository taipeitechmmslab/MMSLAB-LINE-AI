const request = require('request');
const imgrConfig = {
    imgurClientId: process.env.IMGUR_CLIENT_ID
}
module.exports = class Imgur {
    constructor() {
        this.clientId = imgrConfig.imgurClientId;
        this.url = 'https://api.imgur.com/3/image'
        this.db = {}
    }
    ShareAndDeleteTmp(id, resBody) {
        let tmpMsg = {
            type: 'template',
            altText: 'Photo share',
            template: {
                type: 'buttons',
                thumbnailImageUrl: `${resBody.data.link}`,
                text: '已上傳的照片',
                defaultAction: {
                    type: 'uri',
                    label: 'View Photo',
                    uri: `${resBody.data.link}`
                },
                actions: [
                    {
                        type: 'uri',
                        label: '分享連結至聊天室',
                        uri: `line://msg/text/?${resBody.data.link}`
                    },
                    {
                        type: 'postback',
                        label: '刪除此照片',
                        data: `action=img-delete&hash=${resBody.data.deletehash}`
                    }
                ]
            }
        };
        if (this.db[id] === undefined) {
            this.db[id] = [tmpMsg];
            return tmpMsg;
        } else {
            this.db[id].push(tmpMsg);
            const photos = this.db[id].map((photo, idx) => {
                return {
                    text: `Photo ${idx + 1}`,
                    thumbnailImageUrl: photo.template.thumbnailImageUrl,
                    defaultAction: photo.template.defaultAction,
                    actions: photo.template.actions
                }
            });
            return {
                type: 'template',
                altText: 'Photos share',
                template: {
                    type: 'carousel',
                    columns: photos
                }
            }
        }
    }
    uploadImg(image) {
        const uploadImg = {
            url: this.url,
            headers: {
                'Authorization': `Client-ID ${this.clientId}`,
            },
            form: {
                'image': image
            }
        };
        return new Promise((resolve, reject) => {
            request.post(uploadImg, (err, httpResponse, body) => {
                if (httpResponse.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(err);
                }
            })
        })
    }
    deleteImg(hash) {
        const imgDelete = {
            url: `${this.url}/${hash}`,
            headers: {
                'Authorization': `Client-ID ${this.clientId}`,
            }
        };
        return new Promise((resolve, reject) => {
            request.delete(imgDelete, (err, httpResponse, body) => {
                if (httpResponse.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(err);
                }
            })
        })
    }
}

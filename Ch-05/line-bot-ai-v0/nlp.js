const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['zh'] });
// 在NLP模型值中增加例句跟意圖
manager.addDocument('zh', '在台北市的法國餐聽', 'places.search');
manager.addDocument('zh', '您好，我想要找附近的法國餐廳', 'places.search');
manager.addDocument('zh', '嗨，我要找餐廳', 'places.search');
manager.addDocument('zh', '有甚麼餐廳', 'places.search');
manager.addDocument('zh', '找餐廳', 'places.search');
manager.addDocument('zh', '附近的便利商店', 'places.search');
manager.addDocument('zh', '附近的提款機', 'places.search');
manager.addDocument('zh', '我要離開了', 'greeting.bye');
manager.addDocument('zh', '謝謝', 'greeting.bye');
manager.addDocument('zh', '再見', 'greeting.bye');
manager.addDocument('zh', '你好', 'greeting.hello');
manager.addDocument('zh', '哈囉', 'greeting.hello');
manager.addDocument('zh', '嗨!', 'greeting.hello');
manager.addDocument('zh', 'HI', 'greeting.hello');
manager.addDocument('zh', '您好', 'greeting.hello');
manager.addDocument('zh', '能做甚麼', 'greeting.intro');
manager.addDocument('zh', '你能幹嘛', 'greeting.intro');
manager.addDocument('zh', '介紹', 'greeting.intro');

//將意圖轉換為文字訊息
manager.addAnswer('zh', 'places.search', '找地點');
manager.addAnswer('zh', 'greetings.hello', '你好');
manager.addAnswer('zh', 'greeting.bye', '掰掰');
manager.addAnswer('zh', 'greeting.intro', '跟我說話我就會知道你要做甚麼');

// 訓練NLP的模型，並儲存NLP模型的參數
(async () => {
    await manager.train();
    manager.save();
    const response = await manager.process('zh', '介紹附近有甚麼餐廳，謝謝!!');
    console.log(JSON.stringify(response));
})();
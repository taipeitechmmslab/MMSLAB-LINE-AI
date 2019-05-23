const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['zh'] });
// 在NLP模型值中增加例句跟意圖
manager.addNamedEntityText( //atm實體
    'places',
    '提款機',
    ['zh'],
    ['atm','ATM','提款機','領錢的地方','自動櫃員機']
)
manager.addNamedEntityText( //便利商店實體
    'places',
    '便利商店',
    ['zh'],
    ['便利商店','7-11','萊爾富','全家','小七','小7','OK']
)
manager.addNamedEntityText( //餐廳實體
    'places',
    '餐廳',
    ['zh'],
    ['餐廳','餐館','飯館','法國餐廳','台式餐廳','日式餐廳','中式餐廳','泰式餐廳']
)
manager.addNamedEntityText( //台灣地點實體
    'tw_place',
    '特定地區',
    ['zh'],
    ['台北','臺北','台中','臺中','高雄']
)
manager.addNamedEntityText( //距離實體
    'wantnear',
    '附近',
    ['zh'],
    ['附近的','最近的','鄰近的','旁邊']
)

//增加文字與意圖範例
manager.addDocument('zh', '我要找%places%', 'places.search');
manager.addDocument('zh', '找%places%', 'places.search');
manager.addDocument('zh', '找提款機', 'places.search');
manager.addDocument('zh', '哪裡有%places%', 'places.search');
manager.addDocument('zh', '%wantnear% %places%', 'places.search.near');
manager.addDocument('zh', '最近的%places%', 'places.search.near');
manager.addDocument('zh', '%tw_place%%places%', 'places.search.region');
manager.addDocument('zh', '台北的%places%', 'places.search.region');
manager.addDocument('zh', '介紹你自己', 'greeting.intro');
manager.addDocument('zh', '你會做甚麼', 'greeting.intro');
manager.addDocument('zh', '有甚麼功能', 'greeting.intro');
manager.addDocument('zh', 'Hello', 'greeting.intro');
//將意圖轉換為文字訊息
manager.addAnswer('zh', 'places.search', '找{{places}}，我需要你的位置');
manager.addAnswer('zh', 'places.search.near', '找{{wantnear}}的{{places}}，我需要你的位置');
manager.addAnswer('zh', 'places.search.region', '找{{tw_place}}的{{places}}');
manager.addAnswer('zh', 'greeting.intro', '我可以幫你找餐廳、提款機或便利商店');

// 訓練NLP的模型，並儲存NLP模型的參數
(async () => {
    await manager.train();  //訓練模型
    manager.save('trained_model/bot-train.nlp');  //儲存模型參數
    const response = await manager.process('zh', '我要找台北的7-11'); //處理訊息
    console.log(JSON.stringify(response)); //印出處理結果
})();



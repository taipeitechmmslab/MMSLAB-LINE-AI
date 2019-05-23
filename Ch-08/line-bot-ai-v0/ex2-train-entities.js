const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['zh'] });
manager.load('trained_model/ex1-train-intents.nlp');
//自定義實體
manager.addNamedEntityText(
    '餐廳',
    '餐廳',
    ['zh'],
    ['餐廳', '餐館', '吃飯的地方', '賣吃的地方', '賣吃的店家'],
);
manager.addNamedEntityText(
    '範圍',
    '範圍',
    ['zh'],
    ['範圍', '最近的', '附近', '鄰近', '旁邊'],
);
// 儲存NLP模型的參數，並測試NLP模型
(async () => {
    manager.save('trained_model/ex2-train-entities.nlp'); //儲存模型參數
    const response = await manager.process('zh', '介紹附近有甚麼餐廳300，謝謝!!'); //處理訊息
    console.log(JSON.stringify(response)); //印出處理結果
})();
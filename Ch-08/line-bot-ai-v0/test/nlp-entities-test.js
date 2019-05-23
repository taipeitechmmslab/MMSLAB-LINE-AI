const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['zh'] });

(async () => {
    //測試Email
    let res = await manager.process('zh', '我的信箱 myemail@gmail.com 寄信給我')
    console.log('信箱：' + JSON.stringify(res.entities));
    //測試IP
    res = await manager.process('zh', '1.1.1.1 127.0.0.1')
    console.log('IP：' + JSON.stringify(res.entities));
    //測試hashtag
    res = await manager.process('zh', '#帥 #handsome')
    console.log('Hashtag: ' + JSON.stringify(res.entities));    
    //測試電話
    res = await manager.process('zh', '我的電話0912345678 我的電話 0912345678')
    console.log('電話：' + JSON.stringify(res.entities));
    //測試網址
    res = await manager.process('zh', 'www.bluenet-ride.com BlueNet交通大平台');
    console.log('網址：' + JSON.stringify(res.entities));
    //測試數字
    res = await manager.process('zh', '1 2 3 一 二 三 壹 貳 參 ');
    console.log('數字：' + JSON.stringify(res.entities));
    //測試順序
    res =await manager.process('zh', '第1名 第二名 第3名 第4名 第肆名 1st 2nd 3rd')
    console.log('順序：' + JSON.stringify(res.entities));
    //測試百分比
    res = await manager.process('zh', '超過100分 100% 87趴');
    console.log('百分比:' + JSON.stringify(res.entities));
    //測試年紀
    res = await manager.process('zh', '今年18歲 明年19歲');
    console.log('年紀：' + JSON.stringify(res.entities));
    //測試貨幣
    res = await manager.process('zh', '100萬台幣, 1000美金, 100日圓, 100元, 100塊台幣');
    console.log('貨幣：' + JSON.stringify(res.entities));
    //測試日期
    res = await manager.process('zh', '豬年 2019年1月1日 2019/01/01');
    console.log('日期：' + JSON.stringify(res.entities));
})();
const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['zh'] });
manager.load('trained_model/bot-train.nlp');

module.exports = manager;
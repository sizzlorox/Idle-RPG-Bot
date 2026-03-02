const messages = require('../../game/data/messages');
const { randomBetween } = require('./helpers');
const { generatePlayerName, generateGenderString } = require('./formatters');

function setImportantMessage(message) {
  return `\`\`\`css\n${message}\`\`\``;
}

function generateMessageWithNames(eventMsg, eventLog, selectedPlayer, item, luckGambleGold, victimPlayer, otherPlayerLog) {
  eventMsg = eventMsg.replace(/(\$\$)/g, selectedPlayer.map.name)
    .replace(/(##)/g, generatePlayerName(selectedPlayer, true))
    .replace(/(@@)/g, generateGenderString(selectedPlayer, 'him'))
    .replace(/(\^\^)/g, generateGenderString(selectedPlayer, 'his'))
    .replace(/(&&)/g, generateGenderString(selectedPlayer, 'he'));

  eventLog = eventLog.replace('$$', selectedPlayer.map.name)
    .replace(/(##)/g, selectedPlayer.name)
    .replace(/(@@)/g, generateGenderString(selectedPlayer, 'him'))
    .replace(/(\^\^)/g, generateGenderString(selectedPlayer, 'his'))
    .replace(/(&&)/g, generateGenderString(selectedPlayer, 'he'));

  if (item) {
    eventMsg = eventMsg.replace(/(%%)/g, item.name);
    eventLog = eventLog.replace(/(%%)/g, item.name);
  }
  if (luckGambleGold) {
    eventMsg = eventMsg.replace(/(\$&)/g, luckGambleGold);
    eventLog = eventLog.replace(/(\$&)/g, luckGambleGold);
  }
  if (victimPlayer) {
    eventMsg = eventMsg.replace(/(!!)/g, generatePlayerName(victimPlayer, true));
    eventLog = eventLog.replace(/(!!)/g, victimPlayer.name);
  }

  return { eventMsg, eventLog, selectedPlayer, item, victimPlayer, otherPlayerLog };
}

function randomCampEventMessage(selectedPlayer) {
  const randomEventInt = randomBetween(0, messages.event.camp.length - 1);
  const { eventMsg, eventLog } = messages.event.camp[randomEventInt];
  return generateMessageWithNames(eventMsg, eventLog, selectedPlayer);
}

function randomItemEventMessage(selectedPlayer, item) {
  const randomEventInt = randomBetween(0, messages.event.item.length - 1);
  const { eventMsg, eventLog } = messages.event.item[randomEventInt];
  return generateMessageWithNames(eventMsg, eventLog, selectedPlayer, item);
}

function randomGambleEventMessage(selectedPlayer, luckGambleGold, isWin) {
  if (isWin) {
    const randomEventInt = randomBetween(0, messages.event.gamble.win.length - 1);
    const { eventMsg, eventLog } = messages.event.gamble.win[randomEventInt];
    return generateMessageWithNames(eventMsg, eventLog, selectedPlayer, undefined, luckGambleGold);
  }
  const randomEventInt = randomBetween(0, messages.event.gamble.lose.length - 1);
  const { eventMsg, eventLog } = messages.event.gamble.lose[randomEventInt];
  return generateMessageWithNames(eventMsg, eventLog, selectedPlayer, undefined, luckGambleGold);
}

module.exports = {
  setImportantMessage,
  generateMessageWithNames,
  randomCampEventMessage,
  randomItemEventMessage,
  randomGambleEventMessage
};

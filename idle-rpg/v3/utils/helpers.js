const seedrandom = require('seedrandom');

const RNG = seedrandom();

function randomBetween(min, max, decimal, exclude) {
  max += 1;
  if (arguments.length < 2) return (RNG() >= 0.5);

  let factor = 1;
  let result;
  if (typeof decimal === 'number') {
    factor = decimal ** 10;
  }
  do {
    result = (RNG() * (max - min)) + min;
    result = Math.trunc(result * factor) / factor;
  } while (result === exclude);
  return result;
}

function randomChoice(array) {
  return array[randomBetween(0, array.length - 1)];
}

function secondsToTimeFormat(duration) {
  const secNum = parseInt(duration, 10);
  let days = Math.floor(secNum / 86400);
  let hours = Math.floor(secNum / 3600) % 24;
  let minutes = Math.floor((secNum - (hours * 3600)) / 60) % 60;
  let seconds = secNum % 60;

  days = days < 10 ? `0${days}` : days;
  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getTimePassed(timeStamp) {
  return secondsToTimeFormat((new Date().getTime() - timeStamp) / 1000);
}

function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function objectContainsName(obj, nameToCheck) {
  if (typeof obj !== 'object') throw new Error('obj provided is not an Object!');
  if (typeof nameToCheck !== 'string') throw new Error('nameToCheck provided is not a String!');

  const keyList = Object.keys(obj);
  for (let i = 0; i < keyList.length; i++) {
    if (!keyList.includes('name') && typeof obj[keyList[i]] === 'object') {
      if (objectContainsName(obj[keyList[i]], nameToCheck)) return true;
    } else if (obj[keyList[i]] && obj[keyList[i]] === nameToCheck) {
      return true;
    }
  }
  return false;
}

module.exports = { randomBetween, randomChoice, secondsToTimeFormat, getTimePassed, capitalizeFirstLetter, objectContainsName };

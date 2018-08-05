// DATA
const titles = require('../idle-rpg/data/titles');

class Game {

  // TODO: Maybe clean this up later?
  manageTitles(eventResults, title) {
    if (titles[title].stat.includes('.')) {
      const statSplit = titles[title].stat.split('.');
      if (eventResults.updatedPlayer[statSplit[0]][statSplit[1]] >= titles[title].requirements
        && !eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
        eventResults.updatedPlayer.titles.current === 'None'
          ? eventResults.updatedPlayer.titles.current = titles[title].name && eventResults.updatedPlayer.titles.unlocked.push(titles[title].name)
          : eventResults.updatedPlayer.titles.unlocked.push(titles[title].name);
        if (eventResults.pm) {
          eventResults.pm.push(`You've just unlocked the ${titles[title].name} title!`);
        } else {
          eventResults.pm = [`You've just unlocked the ${titles[title].name} title!`]
        }
      } else if (eventResults.updatedPlayer[statSplit[0]][statSplit[1]] < titles[title].requirements
        && eventResults.updatedPlayer.titles.current === titles[title].name
        || eventResults.updatedPlayer[statSplit[0]][statSplit[1]] < titles[title].requirements
        && eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
        eventResults.updatedPlayer.titles.current = 'None';
        eventResults.updatedPlayer.titles.unlocked = eventResults.updatedPlayer.titles.unlocked.splice(eventResults.updatedPlayer.titles.unlocked.indexOf(titles[title].name), 1);
        if (eventResults.pm) {
          eventResults.pm.push(`You've just lost the ${titles[title].name} title!`);
        } else {
          eventResults.pm = [`You've just lost the ${titles[title].name} title!`]
        }
      }

      return eventResults.updatedPlayer;
    }
    if (eventResults.updatedPlayer[titles[title].stat] >= titles[title].requirements
      && !eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
      eventResults.updatedPlayer.titles.current === 'None'
        ? eventResults.updatedPlayer.titles.current = titles[title].name && eventResults.updatedPlayer.titles.unlocked.push(titles[title].name)
        : eventResults.updatedPlayer.titles.unlocked.push(titles[title].name);
      if (eventResults.pm) {
        eventResults.pm.push(`You've just unlocked the ${titles[title].name} title!`);
      } else {
        eventResults.pm = [`You've just unlocked the ${titles[title].name} title!`]
      }
    } else if (eventResults.updatedPlayer[titles[title].stat] < titles[title].requirements
      && eventResults.updatedPlayer.titles.current === titles[title].name
      || eventResults.updatedPlayer[titles[title].stat] < titles[title].requirements
      && eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
      eventResults.updatedPlayer.titles.current = 'None';
      eventResults.updatedPlayer.titles.unlocked = eventResults.updatedPlayer.titles.unlocked.splice(eventResults.updatedPlayer.titles.unlocked.indexOf(titles[title].name), 1);
      if (eventResults.pm) {
        eventResults.pm.push(`You've just lost the ${titles[title].name} title!`);
      } else {
        eventResults.pm = [`You've just lost the ${titles[title].name} title!`]
      }
    }

    return eventResults.updatedPlayer;
  }

}
module.exports = Game;

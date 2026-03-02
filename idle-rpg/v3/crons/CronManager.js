const { CronJob } = require('cron');
const { cronLog } = require('../../utils/logger');
const { powerHourBegin } = require('./tasks/powerHour');
const { dailyLottery } = require('./tasks/lottery');
const { updateLeaderboards } = require('./tasks/leaderboards');
const { blizzardRandom } = require('./tasks/blizzard');

class CronManager {

  constructor({ bot, game }) {
    this.bot = bot;
    this.game = game;
    this.timeZone = 'America/Los_Angeles';
  }

  loadCrons() {
    new CronJob({
      cronTime: '00 30 13 * * 0-6',
      onTick: () => { cronLog.info('CronJob powerHourWarnTime ran'); powerHourBegin(this.bot, this.game); },
      start: false, timeZone: this.timeZone, runOnInit: false
    }).start();

    new CronJob({
      cronTime: '00 45 9 * * 0-6',
      onTick: () => { cronLog.info('CronJob disableJoinLotteryTime ran'); this.game.disableJoinLottery(); },
      start: false, timeZone: this.timeZone, runOnInit: false
    }).start();

    new CronJob({
      cronTime: '00 00 10 * * 0-6',
      onTick: () => { cronLog.info('CronJob dailyLotteryTime ran'); dailyLottery(this.bot, this.game); },
      start: false, timeZone: this.timeZone, runOnInit: false
    }).start();

    new CronJob({
      cronTime: '00 05 10 * * 0-6',
      onTick: () => { cronLog.info('CronJob enableJoinLotteryTime ran'); this.game.enableJoinLottery(); },
      start: false, timeZone: this.timeZone, runOnInit: false
    }).start();

    new CronJob({
      cronTime: '00 00 9 * * 0-6',
      onTick: () => { cronLog.info('CronJob blizzardRandomTime ran'); blizzardRandom(this.bot, this.game); },
      start: false, timeZone: this.timeZone, runOnInit: false
    }).start();

    new CronJob({
      cronTime: '00 */10 * * * 0-6',
      onTick: () => { cronLog.info('CronJob updateLeaderboards ran'); updateLeaderboards(this.bot, this.game); },
      start: false, timeZone: this.timeZone, runOnInit: false
    }).start();
  }

}

module.exports = CronManager;

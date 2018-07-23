const { CronJob } = require('cron');

class Crons {

  constructor(params) {
    const { Discord } = params;
    this.Discord = Discord;
    this.powerHourWarnTime = '00 30 13 * * 0-6'; // 1pm every day
    this.dailyLotteryTime = '00 00 10 * * 0-6';
    this.blizzardRandomTime = '00 00 9 * * 0-6';
    this.leadboardUpdateTime = '00 */10 * * * 0-6';
    this.timeZone = 'America/Los_Angeles';
  }

  loadCrons() {
    new CronJob({
      cronTime: this.powerHourWarnTime,
      onTick: () => {
        this.Discord.powerHourBegin();
      },
      start: false,
      timeZone: this.timeZone,
      runOnInit: false
    }).start();

    new CronJob({
      cronTime: this.dailyLotteryTime,
      onTick: () => {
        this.Discord.dailyLottery(discordBot, guildName);
      },
      start: false,
      timeZone: this.timeZone,
      runOnInit: false
    }).start();

    // new CronJob({
    //   cronTime: this.blizzardRandomTime,
    //   onTick: () => {
    //     this.Discord.blizzardRandom();
    //   },
    //   start: false,
    //   timeZone: this.timeZone,
    //   runOnInit: false
    // }).start();

    new CronJob({
      cronTime: this.leadboardUpdateTime,
      onTick: () => {
        this.Discord.updateLeaderboards();
      },
      start: false,
      timeZone: this.timeZone,
      runOnInit: false
    }).start();
  }

}
module.exports = Crons;
const { CronJob } = require('cron');

// Change back to 13-14-15 later
const powerHourWarnTime = '00 00 15 * * 0-6'; // 1pm every day
const powerHourBeginTime = '00 00 16 * * 0-6'; // 2pm every day
const powerHourEndTime = '00 00 17 * * 0-6'; // 3pm every day
const timeZone = 'America/Los_Angeles';

const powerHourWarn = new CronJob({
  cronTime: powerHourWarnTime,
  start: false,
  timeZone
});

const powerHourBegin = new CronJob({
  cronTime: powerHourBeginTime,
  start: false,
  timeZone
});

const powerHourEnd = new CronJob({
  cronTime: powerHourEndTime,
  start: false,
  timeZone,
  runOnInit: false
});

module.exports = {
  powerHourWarn,
  powerHourBegin,
  powerHourEnd
};

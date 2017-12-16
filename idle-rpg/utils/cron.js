const { CronJob } = require('cron');

const powerHourBeginTime = '00 00 14 * * 0-6'; // 2pm every day
const powerHourEndTime = '00 00 15 * * 0-6'; // 2pm every day
const timeZone = 'America/Los_Angeles';

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
module.exports = { powerHourBegin, powerHourEnd };

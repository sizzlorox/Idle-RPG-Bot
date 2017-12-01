const { CronJob } = require('cron');
const events = require('events');

const eventEmitter = new events.EventEmitter();

function onTick() {
  eventEmitter.emit('TICK');
}

new CronJob(
  '00 */2 * * * *',
  onTick,
  null,
  true,
).start();
exports.eventEmitter = eventEmitter;

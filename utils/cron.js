const CronJob = require('cron').CronJob;
const events = require('events');
const eventEmitter = new events.EventEmitter();

function onTick() {
  eventEmitter.emit('TICK');
}

console.log('Cron loaded');
new CronJob(
  '00 */2 * * * *',
  onTick,
  null,
  true
).start();

exports.eventEmitter = eventEmitter;
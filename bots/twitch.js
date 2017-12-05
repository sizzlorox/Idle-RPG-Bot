const Twitch = require('twitch-bot');
const http = require('http');
const https = require('https');
// https://www.npmjs.com/package/twitch-bot

const twitchBot = new Twitch({
  username: process.env.TWITCH_USERNAME,
  oauth: process.env.TWITCH_OAUTH,
  channel: process.env.TWITCH_CHANNEL
});

twitchBot.on('error', (err) => {
  console.log(err);
});

const getViewerList = () => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'tmi.twitch.tv',
      port: 443,
      path: `/group/user/${process.env.TWITCH_CHANNEL}/chatter`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const port = options.port === 443 ? https : http;
    const req = port.request(options, (res) => {
      let output = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        output += chunk;
      });

      res.on('end', () => {
        const resObj = JSON.parse(output);
        resolve(resObj);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};

module.exports = { twitchBot, getViewerList };

const requester = require('../../utils/Requester');
const qs = require('querystring');

class Discord {

  sendWebHook(content) {
    const postData = qs.stringify({ content });
    const options = {
      host: 'discordapp.com',
      port: 443,
      path: `/api/v6/webhooks/${process.env.DISCORD_WEBHOOK_ID}/${process.env.DISCORD_WEBHOOK_TOKEN}?wait=true`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      json: postData
    };

    requester.request(options)
      .then((err, result) => {
        if (err) {
          return console.log(err);
        }

        return console.log(result);
      });
  }

}
module.exports = new Discord();

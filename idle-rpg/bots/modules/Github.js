const Requester = require('../../utils/Requester');

class Github {

  randomRepo() {
    const options = {
      host: 'api.github.com',
      port: 443,
      path: '/repositories',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Discord Idle-RPG-Bot Command'
      }
    };

    return Requester.request(options);
  }

}
module.exports = new Github();
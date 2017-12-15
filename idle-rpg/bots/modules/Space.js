const Requester = require('../../utils/Requester');

class Space {

  nextLaunch() {
    const options = {
      host: 'ipeer.auron.co.uk',
      port: 443,
      path: '/launchschedule/api/1/launches/',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return Requester.request(options);
  }

}
module.exports = new Space();
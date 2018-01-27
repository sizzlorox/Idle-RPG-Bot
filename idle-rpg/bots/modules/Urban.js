const Requester = require('../../utils/Requester');

class Urban {

  searchUrbanDictionary(word) {
    const options = {
      host: 'api.urbandictionary.com',
      port: 443,
      path: `${word === 'random' ? '/v0/random' : `/v0/define?term=${word}`}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return Requester.request(options);
  }

}
module.exports = new Urban();
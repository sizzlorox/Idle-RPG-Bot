const Requester = require('../../utils/Requester');

class Crypto {

  top5(currency) {
    const options = {
      host: 'api.coinmarketcap.com',
      port: 443,
      path: `/v1/ticker/?convert=${currency}&limit=5`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return Requester.request(options);
  }

}
module.exports = new Crypto();

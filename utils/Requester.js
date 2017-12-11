const http = require('http');
const https = require('https');

class Requester {

  request(options) {
    return new Promise((resolve, reject) => {
      const port = options.port === 443 ? https : http;
      const req = port.request(options, (res) => {
        let output = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          output += chunk;
        });

        res.on('end', () => {
          const resObj = JSON.parse(output);
          return resolve(resObj);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });
  }

}
module.exports = new Requester();

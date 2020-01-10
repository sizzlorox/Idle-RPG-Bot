const http = require('http');
const https = require('https');

class Requester {

  request(options) {
    return new Promise((resolve, reject) => {
      console.log(options);
      const port = options.port === 443 ? https : http;
      const req = port.request(options, (res) => {
        let output = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          output += chunk;
        });

        res.on('end', () => {
          return resolve(JSON.parse(output));
        });
      });

      req.on('error', (err) => {
        return reject(err);
      });

      if (options.json) {
        req.write(options.json);
      }

      req.end();
    });
  }

}
module.exports = new Requester();

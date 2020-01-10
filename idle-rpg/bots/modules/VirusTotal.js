const requester = require('../../utils/Requester');
const qs = require('querystring');

class VirusTotal {

  scanUrl(url) {
    if (!process.env.VIRUS_TOTAL_APIKEY) {
      return;
    }

    const postData = qs.stringify({
      apikey: process.env.VIRUS_TOTAL_APIKEY,
      url
    });

    const options = {
      host: 'virustotal.com',
      port: 443,
      path: '/vtapi/v2/url/scan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      json: postData
    };

    return requester.request(options)
      .then((err, result) => {
        if (err) {
          return err;
        }
        return result;
      });
  }

  retrieveReport(scanResults) {
    if (!process.env.VIRUS_TOTAL_APIKEY) {
      return;
    }

    return new Promise((resolve) => {
      return setTimeout(() => {
        const options = {
          host: 'virustotal.com',
          port: 443,
          path: `/vtapi/v2/url/report?apikey=${process.env.VIRUS_TOTAL_APIKEY}&resource=${scanResults.scan_id}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        return requester.request(options)
          .then((err, result) => {
            if (err) {
              return resolve(err);
            }
            return resolve(result);
          });
      }, 10000);
    });
  }

}
module.exports = new VirusTotal();
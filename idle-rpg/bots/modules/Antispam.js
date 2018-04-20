
class Antispam {

  constructor() {
    this.authors = [];
    this.messageLog = [];
  }

  logAuthor(authorId) {
    return this.authors.push({
      time: Math.floor(Date.now()),
      author: authorId
    });
  }

  logMessage(authorId, message) {
    return this.messageLog.push({
      message,
      author: authorId
    });
  }

  matchMessages(msg) {
    let msgMatch = 0;
    this.messageLog.forEach((log) => {
      if (log.message === msg.content && log.author === msg.author.id) {
        msgMatch++;
      }
    });

    return msgMatch;
  }

  checkMessageInterval(msg) {
    const now = Date.now();
    const msgsMatched = this.matchMessages(msg);
    let skip = false;
    if (msgsMatched >= 2) {
      for (let i = 0; i < this.authors.length; i++) {
        if (this.authors[i].time > now - 3000) {
          skip = true;
        }
        else if (this.authors[i].time < now - 3000) {
          this.authors.splice(i);
        }
        if (this.messageLog.length >= 200) {
          this.messageLog.shift();
        }
      }
    }

    return skip;
  }
}
module.exports = new Antispam();

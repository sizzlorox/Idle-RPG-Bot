
class Helper {

  objectContainsName(obj, nameToCheck) {
    const keyList = Object.keys(obj);
    for (let i = 0; i < keyList.length; i++) {
      if (!keyList.includes('name')) {
        if (this.objectContainsName(obj[keyList[i]], nameToCheck)) {
          return true;
        }
      } else if (obj[keyList[i]] && obj[keyList[i]] === nameToCheck) {
        return true;
      }
    }

    return false;
  }

}
module.exports = Helper;

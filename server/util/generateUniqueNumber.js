const Voucher = require("../models/Admin/voucher");

async function generateUniqueRandomNumber() {
    const min = 10000;
    const max = 99999;
    const randomNum = Math.floor(min + Math.random() * (max - min + 1));
  
    const isUnique = await Voucher.findOne({ code: randomNum });
  
    if (isUnique) {
      return generateUniqueRandomNumber();
    }
  
    return randomNum;
  }

  module.exports = generateUniqueRandomNumber;
const convertDecimal128 = (obj) => {
  for (const key in obj) {
    if (obj[key] && obj[key]._bsontype === "Decimal128") {
      obj[key] = obj[key].toString();
    }
  }
  return obj;
};

module.exports = { convertDecimal128 };

const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: `./logs/${new Date()
        .toString()
        .substring(0, 15)
        .split(" ")
        .join("-")}.log`,
      json: false,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;

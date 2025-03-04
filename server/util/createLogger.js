const morgan = require('morgan');
const logger  = require('../logger/logger');

logger.stream = {   
  write: message => logger.info("\n**********************REQUEST_STARTED*********************\n"+message.substring(0, message.lastIndexOf('\n')))
};

module.exports = morgan(
  ':method :url :status :response-time ms - :res[content-length]',
  { stream: logger.stream }
);

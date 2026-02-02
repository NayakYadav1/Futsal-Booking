const auth = require('./auth');
const email = require('./email');

module.exports = { ...auth, ...email };
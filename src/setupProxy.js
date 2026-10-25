// Used only by the CRA dev server (`npm start`); never part of a build.
// Lets local development swap /runtime-config.js for an alternative from
// config/ (e.g. the mock server config) via REACT_APP_CONFIG_FILE in .env.local.
const path = require('path');

module.exports = function (app) {
  const override = process.env.REACT_APP_CONFIG_FILE;
  if (!override || override === 'runtime-config.js') return;

  const file = path.join(__dirname, '..', 'config', path.basename(override));
  app.get('/runtime-config.js', (req, res) => res.sendFile(file));
};

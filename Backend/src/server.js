const config = require('./config');
const { createApp } = require('./app');

createApp().listen(config.port, () => {
  console.log(`StudyHub listening on http://localhost:${config.port}`);
});

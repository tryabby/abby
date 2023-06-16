const { EnvironmentPlugin } = require('webpack');
require('dotenv').config();

module.exports = {
  plugins: [
    new EnvironmentPlugin({
      ABBY_PROJECT_ID: null, // defaults to `null` makes it optional
    }),
  ],
};

'use strict';

var knex = require('knex');
var debugEnv = process.env.MYSQL_DEBUG || 'false';

try {
  debugEnv = debugEnv.toLowerCase() === 'true';
} catch (e) {
  debugEnv = false;
}

module.exports = knex({
  client: 'mysql',
  debug:  debugEnv,
  connection: {
    host     : process.env.MYSQL_HOST     || '127.0.0.1',
    port     : +process.env.MYSQL_PORT    || 3306,
    user     : process.env.MYSQL_USER     || 'root',
    password : process.env.MYSQL_PASSWORD || undefined,
    database : process.env.MYSQL_DATABASE || 'convrrt'
  }
});
/**
 * Model Utility Functions
 */

let _ = require('lodash');
let bb = require('bluebird');
let type = require('./type');
let validate = bb.promisify(type.validate);

class DBError {
  constructor(opts){
    this.message = opts.message || 'a database error occurred';
    this._error = new Error(this.message);

    this.stack = this._error.stack;
    this.code = opts.code || 'DB_ERROR';
    this.name = 'DBError';
  }
}

function setup(ctx, opts, defaults){
  // extend options with defaults
  _.defaults(opts, defaults);

  // prune any keys from options that were not
  // declared in the defaults object
  // prevents accidental overriding of attributes
  // opts = _.pick(opts, _.keys(defaults));

  // assign these options to the Class
  _.assign(ctx, opts);
}

module.exports = {
  DBError,
  validate,
  setup
};
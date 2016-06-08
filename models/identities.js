let type = require('./lib/type');
let Model = require('./lib/Model');

let identities = new Model({
  _table: 'identities',
  _schema: {
    id:           type.number(),
    userId:       type.number(),
    provider:     type.string().required().allow('google', 'facebook'),
    token:        type.string(),
    refreshToken: type.string(),
    expiration:   type.date()
  },
  _insecureKeys: ['token', 'refreshToken']
});

module.exports = identities;
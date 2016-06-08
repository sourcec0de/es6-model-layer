let bcrypt = require('../../lib/bcrypt');
let jwt = require('../../lib/jwt');
let uuid = require('node-uuid');
let type = require('./lib/type');
let Model = require('./lib/Model');
let ModelInstance = require('./lib/ModelInstance');
let Identities = require('./identities');

class UserModelInstance extends ModelInstance {
  checkPassword(password) {
    return bcrypt.compareAsync(password, this.get('passwordHash'));
  }

  setPassword(password){
    return bcrypt.hashAsync(password, 10).then((hash)=>{
      this.set('passwordHash', hash);
      return this;
    });
  }

  signForToken(){
    return jwt.sign(this.renderSecure());
  }

  getIdentities(){
    return Identities.find({
      userId: this.id()
    });
  }
}

let users = new Model({
  _table: 'users',
  _instance: UserModelInstance,
  _schema: {
    id:               type.number(),
    email:            type.string(),
    firstName:        type.string().allow(null),
    lastName:         type.string().allow(null),
    companyName:      type.string().allow(null),
    countryCode:      type.string().allow(null),
    phoneNumber:      type.string().allow(null),
    passwordHash:     type.string().allow(null),
    activationCode:   type.string().default(uuid.v4, 'generates a uuid.v4'),
    stripeCustomerId: type.string().allow(null),
    accountBalance:   type.number().default(0),
    createdAt:        type.date().timestamp('unix').allow(null),
    updatedAt:        type.date().timestamp('unix').allow(null),
    deletedAt:        type.date().timestamp('unix').allow(null)
  },
  _insecureKeys: [
    'passwordHash', 'activationCode', 'accountBalance',
    'stripeCustomerId', 'phoneNumber', 'countryCode'
  ]
});

module.exports = users;
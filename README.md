es6-model-layer
===

Note this is an **ALPHA** example. It's only been lightly tested.
This is purely for conceptual use.

- `index.js` is where the database connection itself is setup
- `lib/` contains the base classes and utils
- `models` is where i've chosen to house example model files

In this cenario there are two tables `users` and `identities`.
This is an oauth pattern for allowing people to link their auth providers.

I am using this as a way of demonstraighting management of a relationship without
and ORM that uses methods like `hasMany` or `belongsTo`. While these conventions
make sense it is easier to reason about and debug code you've written yourself.
Rather than relying on implicit attributes and methods that are reflected by the library itself.

In the `model/users.js` file I've created an extended class that uses the `identities` model
to perform a relational query.

The example is executed something like this.

```js
let Users = require('./models/users');

Users.findOne({id: 1}).then((user)=>{
  return user.getIdentities();
}).then((identities)=>{
  // the final result is all the identities belonging to the user with id 1`
})

```
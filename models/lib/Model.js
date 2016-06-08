/**
 * Class Model
 *
 * the base model class that creates an interface for communicating with a
 * database table. There is currently no support for relational queries
 * outside of using the underlying knex query builder. I am considering
 * extending this library to become an ORM.
 * (but then this becomes another opinionated framework / library).
 *
 * Features:
 * - Validation *overridable
 * - Schemas via (walmarts joi library) *overridable
 * - customizable primaryKey field
 *
 * - manually set table names (it won't attempt to pluralize your table names)
 *   yes this is a feature
 *
 * - lifecycle hooks
 *   - *still in progress missing a few
 *   - ModelInstance uses these to ensure the model is passed to the hook
 *
 * - Basic Knex Query Wrappers
 *   - find (returns a collection of models)
 *   - findOne (returns a single model)
 *   - query (returns a raw knex query based on the table)
 *   - first (returns a query that will return one record)
 *   - insert (inserts a record based on a query)
 *   - update (returns an update query)
 *   - destroy (returns an destroy query)
 *   - upsert (updates or inserts a record based on a query)
 */

let db = require('../../');
let utils = require('./utils');
let ModelInstance = require('./ModelInstance');
var Collection = require('./Collection');
let DBError = utils.DBError;
let validate = utils.validate;
let setup = utils.setup;

class Model {
  constructor(opts){
    setup(this, opts, {
      _db: db,
      _table: null,
      _idAttr: 'id',
      _instance: ModelInstance,
      _insecureKeys: [],
      _schema: {},
      _validationOptions: null
    });

    this._beforevalidate = [];
    this._beforeupsert = [];
    this._beforesave = [];
    this._beforeupdate = [];
    this._beforedestroy = [];

    this._aftervalidate = [];
    this._aftersave = [];
    this._afterupdate = [];
    this._afterdestroy = [];
  }

  getHookList(timing, name){
    let key = `_${timing}${name}`;
    return this[key];
  }

  generateHooks(timing, name, ctx){
    return this.getHookList(timing, name).map(function(promiseHandler){
      return new Promise(promiseHandler.bind(ctx));
    });
  }

  appendHook(timing, name, promise){
    this.getHookList(timing, name).push(promise);
  }

  after(name, promiseHandler) {
    this.appendHook('after', name, promiseHandler);
  }

  before(hook, promiseHandler){
    this.appendHook('before', hook, promiseHandler);
  }

  build(data, isNew) {
    return new this._instance({
      _model: this,
      _attributes: data,
      _insecureKeys: this._insecureKeys,
      isNew: isNew === undefined ? true : isNew
    });
  }

  find(query) {
    return this.query().where(query).then(this.buildRows.bind(this));
  }

  buildRows(rows) {
    return new Collection(rows.map((row)=>{
      return this.build(row, false);
    }));
  }

  findOne(query, throwIfNotFound=false) {
    return this.first().where(query).then((row)=>{
      // if no row and throw then throw DBError
      // this will reject the promise chain
      if (!row && throwIfNotFound) {
        throw new DBError({
          code: 'NOT_FOUND',
          message: `Nothing found from query: ${JSON.stringify(query)}`,
          results: row
        });
      }

      // no row was found and and no error required
      // return undefined to satisfy promise chain
      if (!row) {
        return;
      }

      // row was found build a new model instance
      return this.build(row, false);
    });
  }

  /**
   * Knex Query Sugar
   */

  query() {
    // start a generate knex query and return to build promise chain
    return this._db.table(this._table);
  }

  first(fields='*') {
    // create a query selecting all fields by default
    return this.query().first(fields);
  }

  insert(data){
    return this.query().insert(data);
  }

  update(data) {
    return this.query().update(data);
  }

  destroy() {
    return this.query().del();
  }

  upsert(record, query) {
    // look for an existing record
    // use the record itself as the query unless query is passed
    // to override the default behavior
    return this.first().where(query || record).then((firstRow)=>{

      if (firstRow) {
        let query = {};
        // set the id of the record to be updated
        query[this._idAttr] = firstRow[this._idAttr];
        // update the existing record and refresh with the data from the server
        return this.update(record).where(query).then(()=>{
          // return the updated record in the database
          return this.first().where(query);
        });
      }

      // insert and get the new record by its id
      return this.insert(record).then((ids)=>{
        return this.first().where(this._idAttr, 'in', ids);
      });

    });
  }

  validate(attributes){
    // run the promisified version of walmarts joi library
    // schemas are joi schemas
    return validate(attributes, this._schema, this._validationOptions);
  }
}

module.exports = Model;
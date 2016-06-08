/**
 * Class ModelInstance
 *
 * provides an interface for working with a single database record
 * after its been returned from the database.
 *
 * this class is returned from the base Models methods
 *
 * Features:
 *   - Getters and Setters
 *     - get (path, def) or () to get full object
 *     - set (path, value) to set a value
 *
 *   - validation
 *     - type casting
 *     - type coersion
 *     - ocurrs on load and on save
 *       even though SQL dbs manage schema its easier to enforce
 *       other types such as UUID's or IP's on the client
 *
 *   - DB Ops
 *     - save
 *     - update
 *     - upsert
 *     - destroy
 *     - findOrCreate
 *
 *   - Rendering
 *     - toJSON
 *     - renderSecure
 */

let _ = require('lodash');
let utils = require('./utils');
let ModelInstance = require('./ModelInstance');
let setup = utils.setup;

class ModelInstance {
  constructor(opts) {
    setup(this, opts, {
      _model: null,
      _attributes: {},
      _insecureKeys: [],
      isNew: true
    });
  }

  id(){
    // return the id based on the idAttr
    return this.get(this.idAttr());
  }

  idAttr(){
    // return the idAttribute
    // this allows the user to override the
    // default field name for their ID key
    return this._model._idAttr;
  }


  idQuery(){
    // generate a query object with only the id
    // of the modal instance
    let query = {};
    query[this.idAttr()] = this.id();
    return query;
  }

  hydrate(data){
    // hydrate the model and mark it as not new
    // this will change the save behavior from insert to update
    this.isNew = false;
    this.set(data);
    return this;
  }

  save(){

    // self explainitory
    if (!this.isNew) {
      return this.update(this.get());
    }

    // generate the hook promise chain
    // these will be executed before the record is saved
    // if any of these promises a rejected or not resolved
    // the model will not be persisted
    let hooks = this._model.generateHooks('before', 'save', this);

    // render and execute the entire insert promise chain
    return Promise.all(hooks).then(()=>{
      // assuming all hooks resolve cast the data to the schema
      return this.cast();
    }).then(()=>{
      // if validations pass insert the record
      return this._model.insert(this.get());
    }).then((ids)=>{
      // if the insertion was successful
      // mark as not new and update the id attribute
      // with the new one returned from the database
      this.isNew = false;
      this.set(this.idAttr(), ids[0]);
      return this;
    });

  }

  upsert(query){
    // the purpose of the upsert hooks is to cover the update and insert
    // hook case in a single call rather than needing to register two hooks
    let hooks = this._model.generateHooks('before', 'upsert', this);

    // execute upsert hook chain
    return Promise.all(hooks).then(()=>{
      // execute the update or insert
      return this._model.upsert(this.get(), query);
    // hydrate the model with the result
    }).then(this.hydrate);
  }

  findOrCreate(query) {
    // query to find a record if no query is provided use the models
    // existing attributes as the query
    return this._model.first().where(query || this.get()).then((firstRow)=>{

      if (!firstRow) {
        // assuming no record is found matching the query
        // save the model to insert the record
        return this.save();
      }

      // if the firstRow comes back hydrate the model
      // and return the modal instance to the promise chain
      return this.hydrate(firstRow);
    });
  }

  update(data){
    if (data) {
      this.set(data);
    }
    return this.cast().then(()=>{
      return this._model.update(data).where(this.idQuery());
    });
  }

  destroy(){
    if(this.isNew){
      return; // simply return to resolve promise
    }

    // destroy the model instance by its id
    return this._model.destroy().where(this.idQuery());
  }

  get(path, def) {
    // get a value at a specified path or return default if passed
    // otherwise if no args are passed return the entire model instance object
    return path ? _.get(this._attributes, path, def) : this._attributes;
  }

  set(path, value){

    if (_.isObject(path)) {
      // overwrite any existing values
      // with those from the path object
      // leaving any other keys alone
      return _.assign(this._attributes, path);
    }

    if (_.isString(path)) {
      // overwrite the value at the specified path
      // note we are intentionally not evaluating value
      // as you may want to set a falsey one
      return _.set(this._attributes, path, value);
    }

    throw new Error(`
      cannot set: the first arg must be {String} or {Object}
    `);
  }

  validate(){
    // validate the model against its schema
    return this._model.validate(this._attributes);
  }

  cast(){
    // use joi's schema library to ensure values
    // are of the correct type
    // this will cooerce infered types
    return this.validate().then((values) =>{
      // update the model instances attributes
      // with the cast values after they've been validated and coerced
      this.set(values);

      // return the model instance
      return this;
    });
  }

  toJSON(){
    // return only JSON
    return JSON.parse(JSON.stringify(this._attributes));
  }

  renderSecure(){
    // omit any named _insecureKeys from the object
    return _.omit(this.toJSON(), this._insecureKeys);
  }
}

module.exports = ModelInstance;
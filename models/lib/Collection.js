/**
 * Class Collection
 *
 * a wrapper for a collection of models
 * designed to provide an array/lodash like interface for an array of models
 *
 *
 * Features:
 * - find (find the first model who matches the predicate)
 * - filter (find a list of models who match the predicate)
 * - each (executes a callback on each model in the collection)
 * - map (maps each model in the collection to a callback)
 * - add (adds a model to the collection)
 * - remove (removes a model from the collection)

 * - indexOf (returns the index of a model instance)
 *   primarily used internally (might be useful for you?)
 */

let _ = require('lodash');

class Collection {

  // a wrapper for an array of models
  // making it easier to operate on a collection of them
  // you could generate promise chains to perform
  // mass model validated updates

  constructor(models){
    this.models = models;
    this.rows = models.map((model)=>{
      return model._attributes;
    });

    this.length = this.rows.length;
  }

  getModelByRow(row){
    return this.models[_.indexOf(this.rows, row)];
  }

  filter(query) {
    // return a list of models who's properties
    // match the query
    return _.filter(this.rows, query).map(this.getModelByRow);
  }

  find(query){
    // return the first model who's properties
    // match the query (query can be object or function)
    return this.getModelByRow(_.find(this.rows, query));
  }

  each(callback){
    // shortcut to make collection feel more like an array
    // returns undefined and executes your callback for each model
    return this.models.forEach((model, idx)=>{
      callback(model, idx);
    });
  }

  map(callback){
    // shortcut to make collection feel more like an array
    // returns an array of mapped models as the return val of your callback
    return this.models.map(callback);
  }

  indexOf(model) {
    // returns the index of a model in the collection
    return _.indexOf(this.models, model);
  }

  add(model) {
    // appends a model to the collection
    // updates the rows array to ensure consistency
    // updates length for convenience
    this.models.push(model);
    this.rows.push(model._attributes);
    this.length = this.rows.length;
  }

  remove(model) {
    // removes a model from the model list
    // removes the models row from the row array
    // updates length for convenience
    let idx = this.indexOf(model);
    this.models.splice(idx, 1);
    this.rows.splice(idx, 1);
    this.length = this.rows.length;
  }
}

module.exports = Collection;
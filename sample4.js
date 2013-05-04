var sys   = require('sys')  
    async = require('async'),
    fs    = require('fs'),
    util  = require('util');

function Promise(){
  this._callbacks = []
}

Promise.prototype = {
  constructor: Promise,

  then: function(callback){
    this._callbacks.push( callback );

    this._exec()
  },

  then: function(callback){
    this._callbacks.push( callback );

    this._exec()
  },

  resolve: function(results){
    if( !this._results ){
      this._results = arguments

      this._exec()
    }
    else{
      sys.log('warning... resolved promise')
    }
  },

  reject: function(error){
    this._error = error

    sys.log( 'error ' + error )

    this._exec()
  },

  _exec: function(){
    if( this._callbacks.length ){
      if( this._error ){
        // エラーなので何もしない
      }
      else if( this._results ){
        var callback = undefined
        while( callback = this._callbacks.shift() ){
          callback.apply(this, this._results)          
        }
      }
      else{
        // まだパラメータが足りないので実行出来ない
      }
    }
    else{
      // まだパラメータが足りないので実行出来ない
    }
  }
};


var LazyPromise = function(factory) {
  LazyPromise.super_.call(this)

  this._factory = factory;
  this._started = false;
};
util.inherits(LazyPromise, Promise);

LazyPromise.prototype.then = function() {
  if (!this._started) {
    this._started = true;
    var self = this;

    this._factory(function(error, result) {
      if (error) self.reject(error);
      else self.resolve(result);
    });
  }
  return Promise.prototype.then.apply(this, arguments);
};


var DELAY = 1000;
var Module = function(name, deps, factory) {
  Module.super_.call(this, 
    function(callback) {
      list(deps).then(function(apis) {
        console.log('-- module LOAD: ' + name);
        setTimeout(function() {
          console.log('-- module done: ' + name);
          var api = factory.apply(this, apis);
          callback(null, api);
        }, DELAY);
      });
    }
  );
};
util.inherits(Module, LazyPromise);


// promisify :: (a -> (Error -> b -> ()) -> ()) -> (a -> Promise b)
var promisify = function(fn, receiver) {
  return function() {
    var slice   = Array.prototype.slice,
        args    = slice.call(arguments, 0, fn.length - 1),
        promise = new Promise();

    args.push(function() {
      var results = slice.call(arguments),
          error   = results.shift();

      if (error) promise.reject(error);
      else promise.resolve.apply(promise, results);
    });

    fn.apply(receiver, args);
    return promise;
  };
};

// list :: [Promise a] -> Promise [a]
var list = function(promises) {
  var listPromise = new Promise();
  for (var k in listPromise) promises[k] = listPromise[k];

  var results = [], done = 0;

  promises.forEach(function(promise, i) {
    promise.then(function(result) {
      results[i] = result;
      done += 1;
      if (done === promises.length) promises.resolve(results);
    }, function(error) {
      promises.reject(error);
    });
  });

  if (promises.length === 0) promises.resolve(results);
  return promises;
};


var A = new Module('A', [], function() {
  return {
    logBase: function(x, y) {
      return Math.log(x) / Math.log(y);
    }
  };
});

var B = new Module('B', [A], function(a) {
  return {
    doMath: function(x, y) {
      return 'B result is: ' + a.logBase(x, y);
    }
  };
});

var C = new Module('C', [A], function(a) {
  return {
    doMath: function(x, y) {
      return 'C result is: ' + a.logBase(y, x);
    }
  };
});

var D = new Module('D', [B, C], function(b, c) {
  return {
    run: function(x, y) {
      console.log(b.doMath(x, y));
      console.log(c.doMath(x, y));
    }
  };
});


D.then(function(d) { d.run(1000, 2) });
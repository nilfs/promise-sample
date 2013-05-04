var sys   = require('sys')
	async = require('async'),
    fs    = require('fs');

function Promise(){
  this.initialize.apply(this, arguments)
}

Promise.prototype = {
  initialize:function(){
    this._callbacks = []
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

var fs_stat = promisify( function(v, callback){ sys.log(v); return fs.stat(v, callback) });

var paths = ['resources/file1.txt', 'resources/file2.txt', 'resources/file3.txt'],
    statsPromises = list(paths.map(fs_stat));

statsPromises[0].then(function(stat) {
  sys.log( 'statsPromises[0] ' + stat.size)
});

statsPromises.then(function(stats) {
  for( var i=0; i<stats.length; ++i ){
    sys.log( 'statsPromises ' + stats[i].size)
  }
});

var sys   = require('sys')
	async = require('async'),
    fs    = require('fs');

var paths = ['resources/file1.txt', 'resources/file2.txt', 'resources/file3.txt'],
	file1 = paths.shift();

async.parallel([
  function(callback) {
  	// ここでfile1.txtを読み込む
    fs.stat(file1, function(error, stat) {
      // use stat.size
      sys.log( "file1.txt size=" + stat.size)
      callback(error, stat);
    });
  },
  function(callback) {
  	// こっちで残りのテキストを読み込む
    async.map(paths, fs.stat, callback);
  }
], function(error, results) {
  // 全部読み込んだ後の処理はここに書く
  var stats = [results[0]].concat(results[1]);
  // stats を使う
  sys.log(stats)
});
var fs = require('fs');
var path = require('path');
var request = require('request');
var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences/' : '/var/local');
appdata = path.join(appdata, 'thalos-wallet');
var dlurl = "https://dl.thalos.org/";
class downloader {
  static checkAndDownloadFiles(current) {
    var files = [];
    request({
  url: dlurl+"version.json",
  json: true
}, function(error, response, body) {
  //console.log("checkversion");
  //console.log(body);
  global.sharedObj.walletversion = body.walletversion;
  if(current.version != body.walletversion) {
    //console.log("UPDATE NEEDED");
  }
  if(process.platform == 'win32') {
      files.push('thalosd.exe');
      files.push('walletd.exe');
      files.push('thalos.conf');
    } else {
      files.push('thalosd');
      files.push('walletd');
      files.push('thalos.conf');
    }
    if (!fs.existsSync(appdata)){
    fs.mkdirSync(appdata);
    }
    files.forEach(function(file) {
    fs.stat(path.join(appdata, file), function(err, stat) {
      if(err) {
        if(err.code == 'ENOENT') {
          //file does not exist
          request(dlurl+file).pipe(fs.createWriteStream(path.join(appdata, file)));
        } else {
          if(current.fileversion != body.fileversion) {
            fs.unlink(path.join(appdata, file),function() {
              request(dlurl+file).pipe(fs.createWriteStream(path.join(appdata, file)));
            });

          }
        }
      }

    });
    });
});


  }
}
module.exports = downloader;

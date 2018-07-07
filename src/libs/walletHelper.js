//const walletPath = `${__dirname}\\..\\wallet`;
var spawn = require('child_process').execFile;
var fs = require('fs'); 
var _ = require('lodash');
var request = require('request');
var path = require('path');
var helper = require('./helper');

var util = require('util');
var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
appdata = path.join(appdata, 'thalos-wallet');
const walletPath = appdata;
var walletProcess = null;
var walletUnlocked = false;
var walletPassword = null;
var lastWalletStatus = 0;

  var url = require('url');


class walletHelper {
  static query(method,cb, params = null) {
    var p = {"jsonrpc":"2.0","id":"tls_walet","method":method};
    if(params != null) {
       p = {"jsonrpc":"2.0","id":"tls_walet","method":method,  params};
    }
    
    request.post({url:'http://127.0.0.1:1337/json_rpc', body: p, json:true,headers: {
    'Content-Type': 'application/json'
  }}, function(err,httpResponse,body){ 

    if(!_.includes(['getBalance','getStatus','getAddresses'],method)) {
  };
    cb(body);
   });
  
  };

  static checkCoinFiles(cb) {
    //console.log(appdata);
fs.stat(appdata, function(err, stat) {
      if(err == null) {
          cb(true);
          return;
      }
      fs.mkdirSync(appdata);
      cb(false);
      return;
    });
  };

  static tryUnlockWallet(password, cb) {
    ////console.log("TRY UNLOCKING WALLET with pw = "+password);
    var prc = spawn(helper.ospath(walletPath+"\\walletd.exe"),['-c', helper.ospath(walletPath+"\\thalos.conf"),'--container-file', helper.ospath(walletPath+"\\master.thaloswallet"), '--container-password', password, '--address']); //'--daemon-address','de.thalos.org'

  prc.stdout.setEncoding('utf8');
  prc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      //console.log(lines.join("\r\n"));
      lines.forEach(function(entry) {
      if(_.includes(entry,'The password is wrong')) {

        prc.stdin.pause();
        prc.kill();
        cb(false);
      }

      if(_.includes(entry,'Container loaded, view public key')) {
        walletPassword = password;
        walletUnlocked = true;
        prc.stdin.pause();
        prc.kill();
        cb(true);
      }

    });
  });

  prc.on('close', function (code) {
      ////console.log('process exit code ' + code);
    
  });
  };
  static isWalletUnlocked(cb) {
    cb(walletUnlocked);
  }
  static checkIfWalletExists(cb) {
  
    fs.stat(helper.ospath(walletPath+"\\master.thaloswallet"), function(err, stat) {
      if(err == null) {
          cb(true);
          return;
      }
      cb(false);
      return;
    });
  };
 static createWallet(password, cb) {
  //[`-c ${__dirname}/wallet/thalos.conf`,`--container-file ${__dirname}/wallet/testcontainer`,'--container-password test']
 
  var prc = spawn(helper.ospath(walletPath+"\\walletd.exe"),['-c', helper.ospath(walletPath+"\\thalos.conf"),'--container-file', helper.ospath(walletPath+"\\master.thaloswallet"), '--container-password', password, '-g']); //'--daemon-address','de.thalos.org'

  prc.stdout.setEncoding('utf8');
  var address = "";
  prc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      //
      lines.forEach(function(entry) {
if(entry.indexOf('New wallet is generated. Address:') > -1) {
  address = entry.match(/\bTL.*\b/);
}
});
      //console.log(lines.join(""));
  });

  prc.on('close', function (code) {
      //console.log('process exit code ' + code);
      cb(code, address);
  });
 }


 static startWallet() {
  //[`-c ${__dirname}/wallet/thalos.conf`,`--container-file ${__dirname}/wallet/testcontainer`,'--container-password test']

  var prc = spawn(helper.ospath(walletPath+"\\walletd.exe"),['-c', helper.ospath(walletPath+"\\thalos.conf"),'--container-file', helper.ospath(walletPath+"\\master.thaloswallet"), '--container-password', walletPassword, '--daemon-address','127.0.0.1','--daemon-port','46465','--bind-port','1337']); //'--daemon-address','de.thalos.org'

  prc.stdout.setEncoding('utf8');
  var address = "";
  prc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      //
      ////console.log(lines.join(""));
  });

  prc.on('close', function (code) {
      //console.log('wallet process exit code ' + code);
  });
 }


 static startDaemon(cb) {
  //[`-c ${__dirname}/wallet/thalos.conf`,`--container-file ${__dirname}/wallet/testcontainer`,'--container-password test']

  var prc = spawn(helper.ospath(walletPath+"\\thalosd.exe"),['--config', helper.ospath(walletPath+"\\thalos.conf")]); //'--daemon-address','de.thalos.org'

  prc.stdout.setEncoding('utf8');
  prc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
   
      ////console.log(lines.join(""));
  });
    setTimeout(function () {
       cb();
    }, 5000);
  prc.on('close', function (code) {
      //console.log('daemon process exit code ' + code);
  });
 }

 static getWalletStatus(cb) {
  request.post({url:'http://127.0.0.1:1337/json_rpc', json: {"jsonrpc":"2.0","id":"test","method":"getStatus"},headers: {
    'Content-Type': 'application/json'
  }}, function(err,httpResponse,body){ 
    if(err == null) {
      //wallet sollte laufen
      lastWalletStatus = 1;
      return cb('text-success');
    }
    if(lastWalletStatus == 1) {
    ////console.log("wallet CRASHED");
  }
      lastWalletStatus = 0;

  return cb('text-danger');
   });
  
 }
}
module.exports = walletHelper;
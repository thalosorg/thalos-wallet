import { app, BrowserWindow, globalShortcut } from 'electron';
let request = require('request');
var fs = require('fs');
var path = require('path');
var log4js = require('log4js');
var _ = require('lodash');
var bodyParser = require('body-parser');
var walletHelper = require('./libs/walletHelper');
var downloader = require('./libs/downloader');
var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
appdata = path.join(appdata, 'thalos');
var coinunit= 1000000000000;
global.sharedObj = {version: "1.0.0.0",fileversion: "1.0.0.0",status:0};
log4js.configure({
    appenders: {
        console:{type:'console', layout: { type: 'colored' }},
    },
    categories: { default: { appenders: ['console'], level: 'trace' } },
    replaceConsole: true
});
var logger = log4js.getLogger();
//console.log = (msg) => logger.trace(msg);
var walletStatus = 0;
setInterval(function(){
  walletHelper.getWalletStatus(function(status) {
    walletStatus = status;
  });
}, 5 * 1000);
walletHelper.checkCoinFiles(function(status) {
//console.log(status);
  downloader.checkAndDownloadFiles(global.sharedObj)
  });

/*setInterval(function(){
  walletHelper.query('save',function(result) {
    //console.log(result);
  })
}, 60 * 1000);*/
logger.info("                     Thalos Wallet                   ");
logger.info("                    www.thalos.org                   ");
var express = require('express');
var middleware = require('./libs/middleware');
var ex = express();


ex.use(middleware.walletUnlocker);
ex.set('view engine', 'blade');
ex.set('views', `${__dirname}/views`);
ex.use( bodyParser.json() );       // to support JSON-encoded bodies
ex.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
ex.use(express.static(`${__dirname}/public`));

ex.get('/', function (req, res) {
  res.render('master');
});
ex.get('/unlock', function (req, res) {
  res.render('unlockWallet');
});
ex.post('/unlock/wallet', function (req, res) {
    if(req.body.password) {
      walletHelper.tryUnlockWallet(req.body.password,function(unlocked) {
        logger.info("WALLET UNLOCKED = "+unlocked);
        if(!unlocked) {
          return res.redirect('/unlock');
        }
        walletHelper.startDaemon(function() {
          walletHelper.startWallet();
        });
        return res.redirect('/');

      });
    } else {
      return res.redirect('/unlock');
    }
});
ex.get('/home', function (req, res) {

  walletHelper.query("getAddresses",function (result) {
    walletHelper.query("getTransactions",function (result2) {
      var itms = null;
      //console.log(result2);
      if(result2.result && result2.result.items) {
        itms = _.reverse(result2.result.items);
      }
     res.render('start',{items:itms});
    }, {"blockCount":1000,"firstBlockIndex":1,"addresses": result.result.addresses});
  });

});
ex.get('/wallet/send', function (req, res) {
  res.render('wallet/send');
});


ex.post('/wallet/send/createTransaction', function (req, res) {
  /* walletHelper.query("getBalance",function (result) {
    var fee = 0.1;
    var total = _.sumBy(req.body.transaction, function(o) { return parseFloat(o.amount); });
    if(result.availableBalance >= total+fee) {
      res.send("TRANSACTION OK!");
      res.render('master',{success: 'TRANSACTION OK','redirect':});

    } else {
      res.send("NOT ENOUGH MONEY!!!!");
    }
  });*/
});

ex.get('/wallet/receive', function (req, res) {
  walletHelper.query("getAddresses",function (result) {
    var addresses = result.result.addresses;
    var addrs = [];
    addresses.forEach(function(el) {
        walletHelper.query("getBalance",function (result2) {

          addrs.push({address: el, availableBalance: result2.result.availableBalance/coinunit, lockedAmount: result2.result.lockedAmount/coinunit});
          if(addrs.length == addresses.length) {
           res.render('wallet/receive', {addresses: addrs});

          }
    }, {"address":el});
    });

   })
});
ex.get('/createWallet', function (req, res) {
  res.render('createWallet');
});
ex.get('/api/wallet/:method', function (req, res) {
  walletHelper.query(req.param('method'),function (result) {

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result));
  })

});
ex.post('/api/wallet/:method', function (req, res) {
 walletHelper.query(req.param('method'),function (result) {

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result));
  }, req.body);
});
ex.get('/api/walletStatus', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ walletStatus: walletStatus }));
});
ex.post('/createWalletSave', function (req, res) {
    walletHelper.checkIfWalletExists(function(exists) {
  if(exists) {
    res.redirect('/');
  } else {
    walletHelper.createWallet(req.body.password, function(code, address) {
      //console.log("Wallet created, code: "+code);
      //console.log("address = "+address);
      res.render('gettingStarted', {wallet: address});
    });
  }
});
  //res.render('createWallet');
});
ex.get('/mining', function (req, res) {
  res.render('mining');
});
ex.get('/loading', function (req, res) {
  res.render('loading');
});

ex.get('/help', function (req, res) {
  res.render('help');
});
ex.listen(3000, 'localhost', function () {
  logger.info('listening on port 3000!');
});
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 660,
  });
  mainWindow.setMenu(null);
  // and load the index.html of the app.
  walletHelper.checkIfWalletExists(function(exists) {
    //console.log("wallet exists? =" +exists);
  if(exists) {
    //walletHelper.startDaemon(function() {
      //walletHelper.startWallet('test1234$');
    //});
    mainWindow.loadURL('http://localhost:3000/');
  } else {
    mainWindow.loadURL('http://localhost:3000/createWallet');
  }
});



  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Open the DevTools.

  globalShortcut.register('Control+D', () => {
        mainWindow.webContents.openDevTools();
    })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  walletHelper.getWalletStatus(function(status) {
    if(status == "text-success") {
      walletHelper.query('save',function(result) {
        //console.log("SAVED");
      });
    }
  });

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

var _ = require('lodash');
var walletHelper = require('./walletHelper');
var test = require('./test');

class middleware {
  static walletUnlocker(req, res, next) {
      ////console.log(req.path);
      test.test = true;
  ////console.log(_.includes(req.path,'/css'));
  if(_.includes(req.path,'/css') || _.includes(req.path,'/js') || _.includes(req.path,'/img') || _.includes(req.path,'/createWallet')) return next();
  if(!_.includes(req.path,'/unlock')) {

  walletHelper.isWalletUnlocked(function(status) {
    if(!status) {
      ////console.log('Wallet locked, redirecting to unlock');
      res.redirect('/unlock');
    } else {
          next();
    }

  });
  } else {
    next();
  }
  }
}
module.exports = middleware;
var remote = require('electron').remote;
var activePage = "home";
const path = require("path");
var coinunit= 1000000000000;
$(document).ready(function() {
$( ".copy" ).bind( "click", function() {
  copyToClipboard(document.getElementById("address"));
  });
if(remote.getGlobal('sharedObj').version != remote.getGlobal('sharedObj').walletversion) {
$('#version').html('<a href="https://github.com/thalosorg/thalos-wallet/releases" target="_blank" style="color:red;">'+remote.getGlobal('sharedObj').version+" (Update needed)</a>");

} else {
$('#version').text(remote.getGlobal('sharedObj').version);

}
  $.getJSON( "api/wallet/getAddresses", function( data ) {
    $('#address').text(data.result.addresses[0]);
});
var first = false;

    $( "#result" ).load( "/loading", function() {});
setInterval(function(){
  $.getJSON( "api/walletStatus", function( data ) {
    if(data.walletStatus == "text-success" && !first) {
      first = true;
    $( "#result" ).load( "/home", function() {});
    }
    $('#status').removeClass('text-danger text-success').addClass(data.walletStatus);
});

  $.getJSON( "api/wallet/getBalance", function( data ) {

    $('#balance').text(parseFloat((data.result.availableBalance+data.result.lockedAmount)/coinunit)+" TLS");
    $('#availablebalance').text(parseFloat((data.result.availableBalance)/coinunit)+" TLS");
});

  $.getJSON( "api/wallet/getAddresses", function( data ) {
    $('#address').text(data.result.addresses[0]);
});

  $.getJSON( "api/wallet/getStatus", function( data ) {
    $('#peers .count').text(data.result.peerCount);
    var syncstatus = "";
    if(data.result.blockCount != data.result.knownBlockCount) syncstatus = "text-danger";
    $('#blocks').html('Synced block <span class="'+syncstatus+'">'+data.result.blockCount+'</span> / '+(data.result.knownBlockCount));
});
}, 2 * 1000);
function registerAndLoadTemplate(anchor,template) {
  $( "#"+anchor ).bind( "click", function() {
    $('nav li a').removeClass('active');
    $(this).addClass('active');
  activePage = template;
    $( "#result" ).load( "/"+template, function() {
      triggerChange(template);
    });
  });
}
registerAndLoadTemplate('transactions','home');
registerAndLoadTemplate('walletsend','wallet/send');
registerAndLoadTemplate('walletreceive','wallet/receive');
registerAndLoadTemplate('mining','mining');
registerAndLoadTemplate('help','help');

function triggerChange(activePage) {
  switch(activePage) {
  case 'home':

  break;
    case 'wallet/send':
    var recipients = 1;
    $('.anon').on('change', function() {
      var value = $(this).val();
      $('.progress-bar').css('width',(value*10)+"%");
      $('.progress-bar').prop("aria-valuenow",value*10)
});

  $( ".addRecipient" ).bind( "click", function() {
    $($('<div class="recipient">'+$('.recipient').first().html().replace(/transaction\[0\]/g,'transaction['+recipients+']')+'</div>')).insertAfter($('.recipient').last());
    recipients +=1;
    $( ".deleteRecipient" ).each(function( i ) {
      if(i > 0) $(this).css('display','inline-block');
});
  });
  $('body').on('click', '.deleteRecipient', function() {
      $(this).closest('.recipient').remove();
  });
  $( "form" ).on( "submit", function( event ) {
  event.preventDefault();
  $('form input.required').removeClass("is-invalid");
  $('form input.required').each(function(index) {

    if($(this).val() == "") {
      $(this).addClass("is-invalid");
    }
  });
  if($('form input.required.is-invalid').length > 0) {
    $('form input.required.is-invalid')[0].focus();
  } else {

  var formdata = $( this ).serializeObject();

   $.get( "/api/wallet/getBalance", function(data) {
          var fee = formdata.fee;
    var total = _.sumBy(formdata.transaction, function(o) { return parseFloat(o.amount); });
    total += parseFloat(fee);
    var anonlevel = formdata.anonlevel;
    var paymentid = formdata.paymentid;
    var availableBalance = _.divide(data.result.availableBalance,coinunit);
    if(availableBalance >= total) {
          swal({
      title: 'Do you want to send the payment of <span class="text-success">'+total+' TLS</span>?',
      html: 'Once confirmed, it cannot be reverted.<br>(Fee of <b class="text-success">'+Number(fee)+' TLS</b> is included)',
      type: "warning",
      showCancelButton: true,
      confirmButtonText: 'Send payment'
      })
    .then((send) => {
      if (send.value) {
        var inputs = [];
        formdata.transaction.forEach(function(val, index) {
          //formdata.transaction[index].amount = Number(val.amount*coinunit);
          inputs.push({amount: Number(val.amount*coinunit), address: val.address});
        });
        var transactiondata = { anonymity:Number(formdata.anonlevel),
     fee:Number(formdata.fee*coinunit),
     unlockTime:Number(0),
     transfers:inputs,
     changeAddress:$('#address').text() };
       // $.post( "/api/wallet/sendTransaction", transactiondata, function(data) {
     //     swal("Transaction info.",JSON.stringify(data),"info");
   // });
   $.ajax({
  type: "POST",
  url: "http://127.0.0.1:1337/json_rpc",
  data: JSON.stringify({ "jsonrpc": "2.0",
  "id": "tls_walet",
  "method": "sendTransaction",
  "params":
   transactiondata }),
  success: function(data) {
    if(data.hasOwnProperty('error')) {
      swal("Transaction error.",data.error.message,"error");
    } else {
      swal("Transaction successful.",data.result.transactionHash,"info");
    }
  },
  dataType: "json"
});

    ////console.log(JSON.stringify(transactiondata));
      } else {
        swal("Payment cancelled.","","info");
      }
    });

    } else {
      swal("Insufficient available balance ("+availableBalance+" TLS)", {
          icon: "error",
        });
    }

    });
      }

});
  break;
    case 'wallet/receive':
  $( ".create-new-address" ).bind( "click", function() {

 $.getJSON( "api/wallet/createAddress", function( data ) {
  $( "#result" ).load( "/wallet/receive", function() {
      triggerChange("wallet/receive");
    });
});
  });
 $( ".export" ).bind( "click", function() {
    var address = $(this).data('address');
    $.post( "/api/wallet/getSpendKeys", { address: address }, function(data) {
      swal({
  title: "Spend keys",
  html: "<strong>Address:</strong><br><input class=form-control value='"+address+"'><br><strong>Private key:</strong><br><input class=form-control value='"+data.result.spendSecretKey+"'><br><strong>Public key:</strong><br><input class=form-control value='"+data.result.spendPublicKey+"'>",
  icon: "success",
});

    });
  });

  $( ".del" ).bind( "click", function() {
    var address = $(this).data('address');
    var availableBalance = $(this).data('availablebalance');
    var lockedAmount = $(this).data('lockedamount');
    var total = parseFloat(parseFloat(availableBalance)+parseFloat(lockedAmount));
  swal({
  title: 'Delete address?',
  html: '<span class="text-danger">You will loose <strong>'+total+' TLS</strong></span> when you delete: '+address,
  type: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Yes, delete it!'
}).then((result) => {
  if (result.value) {
    $.post( "/api/wallet/deleteAddress", { address: address }, function() {
      $( "#result" ).load( "/wallet/receive", function() {
      triggerChange("wallet/receive");
      let timerInterval
swal({
  title: 'Address has been deleted!',
  html: 'I will close in <strong></strong> seconds.',
  timer: 2000,
  onOpen: () => {
    swal.showLoading()
    timerInterval = setInterval(() => {
      swal.getContent().querySelector('strong')
        .textContent = parseFloat(swal.getTimerLeft()/1000);
    }, 100)
  },
  onClose: () => {
    clearInterval(timerInterval)
  }
}).then((result) => {
  if (
    // Read more about handling dismissals
    result.dismiss === swal.DismissReason.timer
  ) {
  }
})
    });
    } );
  }
})
});
  break;
    case 'mining':

  break;
}
}
});

function copyToClipboard(elem) {
    // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    var origSelectionStart, origSelectionEnd;
    if (isInput) {
        // can just use the original source element for the selection and copy
        target = elem;
        origSelectionStart = elem.selectionStart;
        origSelectionEnd = elem.selectionEnd;
    } else {
        // must use a temporary form element for the selection and copy
        target = document.getElementById(targetId);
        if (!target) {
            var target = document.createElement("textarea");
            target.style.position = "absolute";
            target.style.left = "-9999px";
            target.style.top = "0";
            target.id = targetId;
            document.body.appendChild(target);
        }
        target.textContent = elem.textContent;
    }
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);

    // copy the selection
    var succeed;
    try {
        succeed = document.execCommand("copy");
    } catch(e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }

    if (isInput) {
        // restore prior selection
        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    } else {
        // clear temporary content
        target.textContent = "";
    }
    return succeed;
}

var remote = require('electron').remote;     

     // show initial value from main process (in dev console)
        
$(document).ready(function() {
  $("form").submit(function(e){
      $('.hide').hide();
      $('.hidden').show();
 });

});
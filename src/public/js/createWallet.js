function passwordStrength(password, scoreCb) {

  var desc = [{'width':'0px'}, {'width':'20%'}, {'width':'40%'}, {'width':'60%'}, {'width':'80%'}, {'width':'100%'}];
  
  var descClass = ['', 'bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'];

  var score = 0;

  //if password bigger than 6 give 1 point
  if (password.length > 6) score++;

  //if password has both lower and uppercase characters give 1 point  
  if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/))) score++;

  //if password has at least one number give 1 point
  if (password.match(/\d+/)) score++;

  //if password has at least one special caracther give 1 point
  if ( password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/) ) score++;

  //if password bigger than 12 give another 1 point
  if (password.length > 10) score++;
  
  // display indicator
  $("#strength").removeClass(descClass[score-1]).addClass(descClass[score]).css(desc[score]);
  scoreCb(score);
}
var pwscore = 0;
$(document).ready(function(){
      $("#password").keyup(function() {
        //console.log("typed");
        passwordStrength($(this).val(), function(score) {
          pwscore = score;
        });
      });
      $("form").submit(function(e){
        var pw1 = $('#password').val();
        var pw2 = $('#password2').val();
        if(pw1 !== pw2) {
          $('#password').val('').focus();
          $('#password2').val('');
          e.preventDefault(e);
          alert("Your password confirmation does not match your password!");
          return false;
        }
        if(pwscore < 2) {
            alert('Your password is too weak!');
          e.preventDefault(e);
          return false;

        }
        return true;
 });
    });
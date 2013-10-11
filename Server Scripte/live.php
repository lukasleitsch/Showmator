<?php 
  include("function.php");
  header_ausgeben("Live Shownotes");

  if (isset($_GET['slug'])) {
    $slug = $_GET['slug'];
    htmlentities($slug);
  }

 ?>

<script>
var slug = '<?php echo $slug ?>';

$(document).ready(function()    
        {
          // $("#refresh").load('ausgabe.php?slug='+slug);
          
          // $(window).focus(function() {
          //   $("#refresh").load('ausgabe.php?slug='+slug);
          // });
          //  $(window).focus();

          var source=new EventSource('ausgabe.php?slug='+slug);
          source.onmessage=function(event)
            {
            document.getElementById("result").innerHTML=event.data + "<br>";
            };

          if(typeof(EventSource)!=="undefined")
            {
            //$('#result').html("Läuft");
            }
          else
            {
            $('#result').html("Dein Browser ist zu alt. Diese Seite benötigt einen aktuellen Browser!")
            }

        }
      );
</script>
<div class="container">
  <div class="row">
    <div class="span12">
      <h2>Live-Shownotes</h2>
      <div id="result"></div>
    </div>
  </div>
</div>

<?php footer_ausgeben(); ?>
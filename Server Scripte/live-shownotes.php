<?php 
  include("function.php");
  header_ausgeben("Live Shownotes");
 ?>

<script>
$(document).ready(function()    
        {
          $(window).focus(function() {
            $("#refresh").load("ausgabe.php");
          });
           $(window).focus();

        }
      );
</script>
<div class="container">
  <div class="row">
    <div class="span12">
      <h2>Live-Shownotes</h2>
      <div id="refresh"></div>
    </div>
  </div>
</div>

<?php footer_ausgeben(); ?>
<?php 
  include("function.php");
  header_ausgeben("Live Shownotes");

  if (isset($_GET['slug'])) {
    $slug = $_GET['slug'];
  }
 ?>

<script>
var slug = '<?php echo $slug ?>';

$(document).ready(function()    
        {
          $("#refresh").load('ausgabe.php?slug='+slug);
          
          $(window).focus(function() {
            $("#refresh").load('ausgabe.php?slug='+slug);
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
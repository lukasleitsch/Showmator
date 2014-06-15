<?php 
  include("function.php"); 
  header_ausgeben("Showmator");
?> 
  		<div class="container">
  			<div class="row">
  				<div class="span12">
  					<h1><?php echo msg('punchline'); ?></h1>
  				</div>
  			</div>
  			<div class="row">
  				<div class="span12"><br /></div>
  				<div class="span12"><br /></div>
  				<div class="span4 offset4">
            <a href="/live-shownotes.php" title="Live-Shownotes" class="btn btn-large btn-block">Live-Shownotes</a>
  					<a href="/shownotes-aufbereiten.php" title="<?php echo msg('prep_notes'); ?>" class="btn btn-large btn-block"><?php echo msg('prep_notes'); ?></a>
  				</div>
  			</div>


  		</div>
<?php footer_ausgeben(); ?>
    

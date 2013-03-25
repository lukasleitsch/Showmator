<?php 
include("function.php");
header_ausgeben("Aufbreitung der Shownotes");
$content = json_decode(file_get_contents("data/pt004.json"), true);

?>
<div class="container">
	<div class="row">
		<div class="span12">
			<h1>Shownotes für den Blog aufbereiten</h1>
				<form action="shownotes-html.php" method="post" accept-charset="utf-8">
					<?php
						foreach ($content as $value) {
   							echo '<input type="checkbox" name="gruppe_shownotes" value="'.$value["time"].'"> '.date("H:i:s", $value["time"]).' <a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />';
   		
						}
 					?>
 						</div>
		<div class="span12">
			<input class="btn" type="submit" value="HTML ausgeben" />
		</div>
		</form>
	</div>
</div>
 <?php  footer_ausgeben(); ?>
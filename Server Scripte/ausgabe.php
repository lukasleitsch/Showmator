<?php 
	include("function.php");

	if (isset($_GET['slug'])) {
		$slug = $_GET['slug'];
	}

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	unset($content[meta]);

	$content = array_reverse($content);

   		foreach ($content as $value) {
   			echo date("H:i:s", $value["time"]).' <a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />';
   		
		}
	
?>
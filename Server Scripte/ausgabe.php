<?php 
	$content = json_decode(file_get_contents("data/pt005.json"), true);

	$content = array_reverse($content);

   		foreach ($content as $value) {
   			echo date("H:i:s", $value["time"]).' <a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />';
   		
		}
	
?>
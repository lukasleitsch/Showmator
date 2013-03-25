<?php 
	include("function.php");
	header_ausgeben("Shownotes in HTML");
	$content = json_decode(file_get_contents("data/".$episode.".json"), true);

	foreach ($content as $value) {
   	echo htmlentities(date("H:i:s", $value["time"]).' <a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a>')."<br />";
   		
	}

?>
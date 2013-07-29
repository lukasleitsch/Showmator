<?php 
	include("function.php");
	header_ausgeben("Shownotes in HTML");

	if (isset($_GET['slug'])) {
		$slug = $_GET['slug'];
	}

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	unset($content[meta]);

	foreach ($content as $value) {
   	echo htmlentities(date("H:i:s", $value["time"]).' <a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a>')."<br />";
   		
	}

?>
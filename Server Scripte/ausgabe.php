<?php 
	include("function.php");

	if (isset($_GET['slug'])) {
		$slug = $_GET['slug'];
		htmlentities($slug);
	}

	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');

	$slug = file_get_contents('data/publicSlugs/'.$slug.'.inc');

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	unset($content[meta]);

	$content = array_reverse($content);
   		foreach ($content as $value) {

 			$html .= date("H:i:s", $value["time"]).' '.($value["url"] == 'null' ? $value["title"].'<br>' : '<a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />');

		}

	$time = date('r');
	echo "data: $html\n\n";
	flush();
?>
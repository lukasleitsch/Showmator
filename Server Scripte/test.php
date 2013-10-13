<?php 
	include("function.php");

	if (isset($_GET['slug'])) {
		$slug = $_GET['slug'];
		htmlentities($slug);
	}

	$slug = file_get_contents('data/publicSlugs/'.$slug.'.inc');
	$content = json_decode(file_get_contents("data/".$slug.".json"), true);
	unset($content[meta]);
			
	echo '<pre>';
	echo print_r($content);
	echo '</pre>';

?>
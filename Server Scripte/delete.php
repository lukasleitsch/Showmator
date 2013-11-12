<?php 
	include("function.php");

	if (isset($_POST['s'])) {
		$slug = $_POST['s'];
		htmlentities($slug);
	}

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	$anzahl = count($content);

	unset($content[$anzahl-2]);

	file_put_contents("data/".$slug.".json", json_encode($content));

	echo "Erfolgreich gelöscht";
 ?>
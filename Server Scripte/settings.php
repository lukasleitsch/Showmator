<?php 

	if(!empty($_POST['slug']) && !empty($_POST['startTime'])){
	$slug = $_POST['slug'];
	$startTime = $_POST['startTime'];
	$startTimeE = explode(':', $startTime);


	$startTimeUnix = mktime($startTimeE[0], $startTimeE[1], 0, 0, 0, 0);


	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	$content = array(meta => array(slug => $slug, startTime => $startTimeUnix));

	file_put_contents("data/".$slug.".json", json_encode($content));


	echo 'Die Shownotes "'.$slug.'" wurden angelegt und die Startzeit des Podcasts auf '.$startTime.' gesetzt.';

	}

	if (!empty($_POST['slug']) && empty($_POST['startTime'])) {
		echo "Einstellungen wurden gespeichert!";
	}
 ?>
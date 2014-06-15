<?php 
	include("function.php");
	include("config.php");


	if (isset($_POST['s'])) {
		$slug = $_POST['s'];
		htmlentities($slug);
	}

	//Datei einlsen

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	//Anzahl der Elemte ermitellen.

	$anzahl = count($content);

	// Letzte Element entfernen. Da der Meta-Teil nich berücksichtigt werden soll -2

	unset($content[$anzahl-2]);

	// Array wieder in die Datei schreiben

	file_put_contents("data/".$slug.".json", json_encode($content));

	echo msg('delete_succ');

	//Push auslösen

	$ch = curl_init();

	curl_setopt($ch, CURLOPT_URL, "http://{$config['host_address']}:{$config['port']}/push");
	curl_setopt($ch,CURLOPT_POST,true); 
	curl_setopt($ch,CURLOPT_MUTE,true); 
	curl_exec($ch);
	curl_close($ch);
 ?>

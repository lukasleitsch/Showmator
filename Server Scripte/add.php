<?php  
	include("function.php");
        include("config.php");
	
	if (isset($_POST['t'])) {
		$title = $_POST['t'];
		htmlentities($title);
	}
	if (isset($_POST['u'])) {
		$url = $_POST['u'];
		htmlentities($url);
	}
	if (isset($_POST['s'])) {
		$slug = $_POST['s'];
		htmlentities($slug);
	}

	if (isset($_POST['version'])) {
		$version = $_POST['version'];
		htmlentities($version);
	}

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	$startTime = $content[meta][startTime];
	$offset = $content[meta][offset];
	$metaSlug = $content[meta][slug];
	$entryId = $content[meta][entryId];
	$entryId++;

	$time = time()	;

	if($startTime == null){
		$startTime = time();
	}

	if(!empty($title) && !empty($url) && !empty($slug)){

		$content[] = array(id => $entryId, time => $time, title => $title, url => $url);
		$replace = array(meta => array(slug => $metaSlug, startTime => $startTime, offset => $offset, entryId => $entryId));

		$content = array_replace($content, $replace);

		file_put_contents("data/".$slug.".json", json_encode($content));

		echo date("H:i:s", $time-$startTime)."\n". html_entity_decode($title);

	}else{
		echo "Link wurde leider NICHT eingetragen!";
	}


	// Push an NodeJS
	$ch = curl_init();
	
	curl_setopt($ch, CURLOPT_URL, "http://" . $config['host_address'] . ":" . $config['port'] . "/push");
	// curl_setopt($ch, CURLOPT_URL, "http://localhost:63123/push");
	curl_setopt($ch,CURLOPT_POST,true); 
	// curl_setopt($ch,CURLOPT_MUTE,true); 


	curl_exec($ch);

	curl_close($ch);

?>	

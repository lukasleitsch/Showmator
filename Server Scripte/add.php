<?php  
	include("function.php");
	
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

	check_version($version);

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	$startTime = $content[meta][startTime];
	$metaSlug = $content[meta][slug];
	$entryId = $content[meta][entryId];
	$entryId++;

	$time = time()-$startTime;

	if(!empty($title) && !empty($url) && !empty($slug)){

		$content[] = array(id => $entryId, time => $time, title => $title, url => $url);
		$replace = array(meta => array(slug => $metaSlug, startTime => $startTime, entryId => $entryId));

		$content = array_replace($content, $replace);

		file_put_contents("data/".$slug.".json", json_encode($content));

		echo date("H:i:s", $time)."\n". html_entity_decode($title);

	}else{
		echo "Link wurde leider NICHT eingetragen!";
	}


?>	
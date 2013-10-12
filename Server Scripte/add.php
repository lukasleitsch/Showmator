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

	$time = time()-$startTime;

	if(!empty($title) && !empty($url) && !empty($slug)){

		$content[] = array(time => $time, title => $title, url => $url);

		file_put_contents("data/".$slug.".json", json_encode($content));

		echo date("H:i:s", $time)."\n". html_entity_decode($title);

	}else{
		echo "Link wurde leider NICHT eingetragen!";
	}

?>	
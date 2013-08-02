<?php  
	include("function.php");
	header('Content-Type: text/html; charset=utf-8');

	if (isset($_POST['t'])) {
		$title = htmlentities($_POST['t']);
	}
	if (isset($_POST['u'])) {
		$url = htmlentities($_POST['u']);
	}
	if (isset($_POST['s'])) {
		$slug = htmlentities($_POST['s']);
	}
	


	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	$startTime = $content[meta][startTime];


	$time = time()-$startTime-3600;



	if(!empty($title) && !empty($url) && !empty($slug)){
	

	$content[] = array(time => $time, title => $title, url => $url);

	file_put_contents("data/".$slug.".json", json_encode($content));

	echo date("H:i:s", $time)."\n". html_entity_decode($title);

	

	}else{

		echo "Link wurde leider NICHT eingetragen!";
	}

?>	
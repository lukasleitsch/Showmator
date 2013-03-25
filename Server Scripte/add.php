<?php  
	include("function.php");
	header('Content-Type: text/html; charset=utf-8');


	$time = time()-$start_uhrzeit-3600;


	$title = htmlentities($_POST['t']);
	$url = ($_POST['u']);

	// if(strpos($url, "amazon") !== false ){
	// 	$url_zerlegt = explode("/", $url);
	// 	$url = "http://amazon.de/dp/".$url_zerlegt[5]."/?tag=phasenkasper-21";
	// }

	if(strpos($url, "thomann") !== false ){
		$url_zerlegt = explode("/", $url);
		$url = "http://www.thomann.de/index.html?partner_id=51834&page=de/".$url_zerlegt[4];
	}

	if(!empty($title) && !empty($url)){
	$content = json_decode(file_get_contents("data/".$episode.".json"), true);

	$content[] = array(time => $time, title => $title, url => $url);

	file_put_contents("data/".$episode.".json", json_encode($content));

	echo date("H:i:s", $time)."\n". html_entity_decode($title);

	}else{

		echo "Link wurde leider NICHT eingetragen!";
	}
?>	
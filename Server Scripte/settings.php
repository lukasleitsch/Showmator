<?php 
	include("function.php");

	if(isset($_POST['slug'])){
		$slug = $_POST['slug'];
		htmlentities($slug);
	}
	if(isset($_POST['publicSlug'])){
		$publicSlug = $_POST['publicSlug'];
		htmlentities($publicSlug);
	}
	if (isset($_POST['startTime'])) {
		$startTime = $_POST['startTime'];
		htmlentities($startTime);
	}
	if (isset($_POST['currentTime'])) {
		$currentTime = $_POST['currentTime'];
		htmlentities($currentTime);
	}
	if (isset($_POST['version'])) {
		$version = $_POST['version'];
		htmlentities($version);
	}

	date_default_timezone_set('Europe/Berlin');

	check_version($version);


	if(!empty($slug) && !empty($startTime) && $currentTime == 'false'){
		$startTimeE = explode(':', $startTime);
		$startTimeUnix = mktime($startTimeE[0], $startTimeE[1], 0, 0, 0, 0);

		if (!file_exists("data/".$slug.".json")) {
			save($slug ,$startTimeUnix);
			echo 'Die Shownotes "'.$slug.'" wurden angelegt und die Startzeit auf '.date('H:i', $startTimeUnix).' gesetzt.';
		}else{
			echo "Die Shownotes mit diesem Slug existieren schon. Bitte einen anderen Slug verwenden.";
		}
	}

	if (!empty($slug) && empty($startTime) && $currentTime == 'true') {
		$startTimeUnix = mktime(date('H'), date('i'), 0, 0, 0, 0);
		
		if (!file_exists("data/".$slug.".json")) {
			save($slug, $startTimeUnix);
			echo 'Die Shownotes "'.$slug.'" wurden angelegt und die Startzeit automatisch auf '.date('H:i', $startTimeUnix).' gesetzt.';
		}else{
			echo "Die Shownotes mit diesem Slug existieren schon. Bitte einen anderen Slug verwenden.";
		}
	}

	if (!empty($slug) && empty($startTime) && $currentTime == 'false') {
		echo "Einstellungen gespeichert!";
	}

	function save($slug, $time){
		global $publicSlug;

		if (!is_dir('data')) {
		  mkdir('data');
		}

		if (!is_dir('data/publicSlugs')) {
		  mkdir('data/publicSlugs');
		}

		$content = json_decode(file_get_contents("data/".$slug.".json"), true);
		$content = array(meta => array(slug => $slug, startTime => $time, entryId => '0'));
		file_put_contents("data/".$slug.".json", json_encode($content));


		file_put_contents('data/publicSlugs/'.$publicSlug.'.inc', $slug);
	}
 ?>
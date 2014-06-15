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
	if (isset($_POST['join'])) {
		$join = $_POST['join'];
		htmlentities($join);
	}

	// Erstellt neue Shownotes

	if (!empty($slug) && $join == "false") {
		$startTimeUnix = null;
		
		if (!file_exists("data/".$slug.".json")) {
			save($slug, $startTimeUnix);
			printf(msg('show_succ'),$slug);
		}else{
			echo  msg('show_err');
		}
	}

	// Bei Shownotes mitmachen

	if (!empty($slug) && $join == "true") {

		if (file_exists("data/".$slug.".json")) {
			printf(msg('part_succ'),$slug)	
		}else{
			echo msg('part_err');
		}
		
	}

	// Funktion zum Anlegen und Speichern der Datei

	function save($slug, $time){
		global $publicSlug;

		if (!is_dir('data')) {
		  mkdir('data');
		}

		if (!is_dir('data/publicSlugs')) {
		  mkdir('data/publicSlugs');
		}

		$content = json_decode(file_get_contents("data/".$slug.".json"), true);
		$content = array(meta => array(slug => $slug, startTime => $time, offset => null, entryId => '0'));
		file_put_contents("data/".$slug.".json", json_encode($content));


		file_put_contents('data/publicSlugs/'.$publicSlug.'.inc', $slug);
	}
 ?>

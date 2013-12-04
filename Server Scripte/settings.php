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
			echo 'Die Shownotes "'.$slug.'" wurden angelegt. Zeit wird beim ersten Eintrag gestartet.';
		}else{
			echo "Die Shownotes mit diesem Slug existieren schon. Bitte einen anderen Slug verwenden.";
		}
	}

	// Bei Shownotes mitmachen

	if (!empty($slug) && $join == "true") {

		if (file_exists("data/".$slug.".json")) {
			echo 'Du kannst jetzt bei den Shownotes  "'.$slug.'" mitmachen';
		}else{
			echo "Die Shownotes mit diesem Slug existieren nicht. Bitte erst anlegen!";
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
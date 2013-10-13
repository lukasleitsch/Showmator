<?php 
	include("function.php");

	if (isset($_GET['slug'])) {
		$slug = $_GET['slug'];
		htmlentities($slug);
	}

	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');

	$firstLoad = false;
	$id = 0;

	$slug = file_get_contents('data/publicSlugs/'.$slug.'.inc');

	// $slug = file_get_contents('data/publicSlugs/'.$slug.'.inc');

	// $content = json_decode(file_get_contents("data/".$slug.".json"), true);

	// unset($content[meta]);

	// $content = array_reverse($content);
 //   		foreach ($content as $value) {

 // 			$html .= date("H:i:s", $value["time"]).' '.($value["url"] == 'null' ? $value["title"].'<br>' : '<a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />');

	// 	}

	//echo "data: $html\n\n";
		while (1) {
			
			$content = json_decode(file_get_contents("data/".$slug.".json"), true);

			$metaId = $content[meta][entryId];

			unset($content[meta]);

			$print = '{"time": "'.date("H:i:s", $content[$id]["time"]).'", "title": "'.$content[$id][title].'", "url": "'.$content[$id][url].'"}';

			$content = array_reverse($content);

			if($id != $metaId && $firstLoad){
				echo "event: ping\n";
				echo "data: $print\n\n";
				$id++;
			}

			if(!$firstLoad){
				 foreach ($content as $value) {
				 	$html .= date("H:i:s", $value["time"]).' '.($value["url"] == 'null' ? $value["title"].'<br>' : '<a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />');
				}

				echo "event: first\n";
				echo "data: $html\n\n";


				$firstLoad = true;	
				$id = $metaId;
			}

			flush();
			sleep(3);
		}
	
?>
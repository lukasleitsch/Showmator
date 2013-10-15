<?php 

	include("function.php");

	if (isset($_GET['slug'])) {
		$slug = $_GET['slug'];
		htmlentities($slug);
	}

	if (isset($_GET['id'])) {
		$id = $_GET['id'];
		htmlentities($id);
	}

	
	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');

	

	$slug = file_get_contents('data/publicSlugs/'.$slug.'.inc');

	// $slug = file_get_contents('data/publicSlugs/'.$slug.'.inc');

	// $content = json_decode(file_get_contents("data/".$slug.".json"), true);

	// unset($content[meta]);

	// $content = array_reverse($content);
 //   		foreach ($content as $value) {

 // 			$html .= date("H:i:s", $value["time"]).' '.($value["url"] == 'null' ? $value["title"].'<br>' : '<a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />');

	// 	}

	//echo "data: $html\n\n";
		//while(true) {
						
			$content = json_decode(file_get_contents("data/".$slug.".json"), true);

			$metaId = $content["meta"]["entryId"];

			unset($content["meta"]);


			$content = array_reverse($content);


			//if($id == 0){
				 foreach ($content as $value) {
				 	$html .= date("H:i:s", $value["time"]).' '.($value["url"] == 'null' ? $value["title"].'<br>' : '<a href="'.$value["url"].'" target="_blank">'.$value["title"].'</a><br />');
				}
				$id = $metaId;
				//$html = '{"id": "'.$id.'", "data": "Hier steht inhalt"}';
				echo "event: first\n";
				echo "retry: 5000\n";
				echo "data: $html\n\n";

			//}

			// if($id != $metaId){
			// 	$print = '{"id: "'.$id.'","time": "'.date("H:i:s", $content[$id]["time"]).'", "title": "'.$content[$id]["title"].'", "url": "'.$content[$id]["url"].'", "bl": "'.$id.'"}';

			// 	$content = array_reverse($content);
			// 	echo "event: ping\n";
			// 	echo "data: $print $id\n\n";
			// }


			// $test = '{"time": "00:02:00", "title": "Test", "url": "http://google.de"}';
			// echo "event: ping\n";
			// echo "data: $test\n\n";


  		 	flush();
   			// sleep(3);
  			//};
		
?>
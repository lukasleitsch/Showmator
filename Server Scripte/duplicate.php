<?php 

if (isset($_POST['s'])) {
	$slug = $_POST['s'];
	htmlentities($slug);
}

if (isset($_POST['u'])) {
	$url = $_POST['u'];
	htmlentities($url);
} 

$content = json_decode(file_get_contents("data/".$slug.".json"), true);
unset($content[meta]);

$result = "false";

foreach ($content as $key => $value) {

	//echo $value['url'].'<br>';

	if ($url == $value['url']) {
		$result = "true";
	}
	
}

echo $result;

 ?>
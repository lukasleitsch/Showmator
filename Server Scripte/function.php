<?php 

//Globale Variablen 

$slug = "pt010";

if(isset($_POST['slug']) && isset($_POST['startTime']){
	$slug = $_POST['slug'];
	$startTime = $_POST['startTime'];

	echo $slug." ".$startTime;
}



//Stunde, Minute, Sekunde, Monat, Tag, Jahr
$start_uhrzeit = mktime(19, 35, 0, 07, 05, 2013);


function header_ausgeben($title){

	echo'	<!DOCTYPE html>
			<head>
			<title>'.$title.'</title>
    		<!-- Bootstrap -->
    		<link href="bootstrap/css/bootstrap.min.css" rel="stylesheet" media="screen">
    		<script src="http://code.jquery.com/jquery.js"></script>
    		<script src="bootstrap/js/bootstrap.min.js"></script>
    		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  			</head>
  			<body>
	';
}

function footer_ausgeben(){

	echo'
		  	</body>
			</html>
	';

}

 ?>

 <h1>Test</h1>
<?php 

date_default_timezone_set('Europe/Berlin');

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

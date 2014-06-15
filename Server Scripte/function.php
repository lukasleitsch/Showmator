<?php 

$LANG = explode ( "_" , locale_get_default())[0];
#$LANG = "de"; 
include("lang.php");
date_default_timezone_set('UTC');

function header_ausgeben($title){

	echo'	<!DOCTYPE html>
			<head>
			<title>'.$title.'</title>
			<meta http-equiv="Content-Type" content="text/html\; charset=utf-8" />
    		<!-- Bootstrap -->
    		<link href="bootstrap/css/bootstrap.min.css" rel="stylesheet" media="screen">
    		<script src="jquery.min.js"></script>
    		<script src="bootstrap/js/bootstrap.min.js"></script>
    		</head>
  			<body>
	';
}

function footer_ausgeben(){

	echo'	
			<br />
			<div class="container"><a href="https://leitsch.org/projects/showmator" target="_blank">'.msg('show_create').'</a></div>
		  	</body>
			</html>
	';

}

function check_version($version){
	global $sVersion;
	if($sVersion != $version){
		echo msg('wrong_version');
		exit;
	}
}

?>

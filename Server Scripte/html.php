<?php 
	include("function.php");
	header_ausgeben("Shownotes in HTML");

	if (isset($_GET['slug'])) {
		$slug = htmlentities($_GET['slug']);
	}

	$content = json_decode(file_get_contents("data/".$slug.".json"), true);

	unset($content[meta]);

	echo '<div><span id="hideTime" class="label">Zeit ausblenden</span><span id="showTime" style="display: none;" class="label label-inverse">Zeit anzeigen</span> <span id="hideTarget" class="label">target="_blank" ausblenden</span><span id="showTarget" style="display: none;" class="label label-inverse">target="_blank" einblenden</span> <span id="list" class="label">Als HTML-Liste</span><span id="plain" style="display: none;" class="label label-inverse">Als Plain-Text</span></div><br />';


echo '<span class="list">&lt;ul&gt;<br></span>';
	foreach ($content as $value) {
   	// echo '<span class="time">'.date("H:i:s", $value["time"]).'</span>'.htmlentities(' <a href="'.$value["url"]).'" <span>target="_blank"</span>'.$value["title"].'</a>')."<br />";
   	

    echo '<span class="list">&lt;li&gt;</span><span class="time">'.date("H:i:s", $value["time"]).'</span> '.($value["url"] == 'null' ? $value["title"].'<span class="list">&lt;/li&gt;</span><br>' : '&lta href="'.$value["url"].'"<span class="target"> target="_blank"</span>>'.$value["title"].'&lt/a&gt<span class="list">&lt;/li&gt;</span><br />'); 
    
 
	}
  echo '<span class="list">&lt;ul&gt;</span>';

  footer_ausgeben();

?>

<script>
	$(document).ready(function(){
        $('#hideTime').click(function(){
          	$('.time').hide();
          	$('#hideTime').hide();
          	$('#showTime').show();
          });

        $('#showTime').click(function(){
          	$('.time').show();
          	$('#hideTime').show();
          	$('#showTime').hide();
          });

        $('#hideTarget').click(function(){
          	$('.target').hide();
          	$('#hideTarget').hide();
          	$('#showTarget').show();
          });

        $('#showTarget').click(function(){
          	$('.target').show();
          	$('#hideTarget').show();
          	$('#showTarget').hide();
          });

        $('.list').hide();

        $('#list').click(function(){
            $('.list').show();
            $('#list').hide();
            $('#plain').show();

          });  

        $('#plain').click(function(){
            $('.list').hide();
            $('#list').show();
            $('#plain').hide();

          });

	});

</script>
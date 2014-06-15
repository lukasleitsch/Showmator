<?php 
	include("function.php");
	header_ausgeben("Shownotes in HTML");

	if (isset($_GET['slug'])) {
		$slug = htmlentities($_GET['slug']);
	}

  $content = json_decode(file_get_contents("data/".$slug.".json"), true);

    $startTime = $content[meta][startTime];
    $offsetmeta = $content[meta][offset];
    $metaSlug = $content[meta][slug];
    $entryId = $content[meta][entryId];

  if(isset($_GET['offset'])){

    $offset = $_GET['offset'];
    $offsetE = explode(":", $offset);
    $offsetUnix = mktime($offsetE[0], $offsetE[1], $offsetE[2], 0, 0, 0);

    $replace = array(meta => array(slug => $metaSlug, startTime => $startTime, offset => $offsetUnix, entryId => $entryId));

    $content = array_replace($content, $replace);

    file_put_contents("data/".$slug.".json", json_encode($content));

    $content = json_decode(file_get_contents("data/".$slug.".json"), true);

    $startTime = $content[meta][startTime];
    $offsetmeta = $content[meta][offset];
    $metaSlug = $content[meta][slug];
    $entryId = $content[meta][entryId];
  
  }

	unset($content[meta]);

  // Einstellungsmöglichkeiten für die Shownotes

	echo '<div>
        <span id="hideTime" class="label">'.msg('hide_time').'</span>
        <span id="showTime" style="display: none;" class="label label-inverse">'.msg('show_time').'</span> 
        <span id="hideTarget" class="label">'.msg('hide_blank').'</span>
        <span id="showTarget" style="display: none;" class="label label-inverse">'.msg('show_blank').'</span>
        <span id="list" class="label">'.msg('as_html').'</span><span id="plain" style="display: none;" class="label label-inverse">'.msg('as_plain').'</span> 
        <form action="'.$_SERVER['PHP_SELF'].'" method="get" accept-charset="utf-8" class="form-inline" style="display: inline;">
          <input type="hidden" name="slug" value="'.$slug.'">
          '.msg('time_f_entry').': 
          <input type="text" name="offset" value="'.date("H:i:s", $offsetmeta).'">
          <input type="submit" value="'.msg('change').'" class="btn">  
    
        </form>
        <br>
  ';

  echo '<div id="normal">';
  echo '<span class="list">&lt;ul&gt;<br></span>';

	foreach ($content as $value) {

    
    echo '<span class="list">&lt;li&gt;</span><span class="time">'.date("H:i:s", $value["time"]-$startTime+$offsetmeta).' </span>'
        .($value["url"] == 'null' ? $value["title"].'<span class="list">&lt;/li&gt;</span><br>' : '&lta href="'.$value["url"].'"
          <span class="target"> target="_blank"</span>>'.$value["title"].'&lt/a&gt<span class="list">&lt;/li&gt;</span><br />'); 
    
    
	}
  
  echo '<span class="list">&lt;/ul&gt;</span>';
  echo '</div>';

  echo '<div id="chapter">';
  echo '<br><h1>'.msg('pl_chapter').'</h1>';
  foreach ($content as $value) {
    echo date("H:i:s", $value["time"]-$startTime+$offsetmeta).' '.($value["url"] == 'null' ? $value["title"].'<br>' : $value["title"].' &lt;'.$value["url"].'&gt;<br />'); 
  }

  echo '</div>';

  echo '&lt;p&gt;&lt;a href="https://leitsch.org/projects/showmator&quot; target=&quot;_blank&quot;&gt;'.msg('show_created').'&lt;/a&gt;&lt;/p&gt;';

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
<script type="text/javascript" src="tinyosf.js"></script>

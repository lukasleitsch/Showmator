<?php 
    include("function.php");
    include("config.php");
    header_ausgeben("Live Shownotes");
    echo msg("test");
    if (isset($_GET['slug'])) {
        $slug = $_GET['slug'];
        htmlentities($slug);
    }
?>

<script src="<? echo "http://{$config['host_address']}:{$config['port']}" ?>/socket.io/socket.io.js"></script>
<!-- <script src="<? echo "http://{$config['host_address']}:{$config['port']}" ?>/socket.io/socket.io.js"></script>  -->  <!-- DEV -->
<script>
	var slug = '<?php echo (isset($slug) ? $slug: "") ?>';

  var socket = io.connect('<? echo "http://{$config['host_address']}:{$config['port']}" ?>');
  // var socket = io.connect('http://localhost:63123');    //DEV


  // Wird beim Verbindungsaufgbau vom Server aufgerufen. Öffentlicher Slug wird zurückgegeben.
  socket.on('start', function (data) {
    socket.emit('slug', slug);
  });

  // Dient zu Testzwecken

  socket.on('test', function (data) {
    console.log(data);
    // $('#result').html(data);
    //$("#result").empty();  	
  });

  // Daten vom Server weiterverarbeiten

  socket.on('ping', function(data){
    console.log(data);
    content = JSON.parse(data);

    // Seite leeren

    $("#result").empty();

       if(data == "{}"){
       $('#result').prepend('<div class="alert"><?php echo msg('no_notes'); ?></div>');
    }

    // Übermittelte Daten werden weiterverabeitet. Text in Text und Links in Links gewandelt.

    for (var key in content) {
      if(content[key]["url"] != "null"){
        var link = '<a href="'+content[key]["url"]+'">'+content[key]["title"]+'</a>';
      }else{
        var link = content[key]['title'];
      }
         
      // Einträge werden von oben angehängt, damit der letzte Eintrag oben steht.   

      $('#result').prepend('<div>'+link+'</div>');
            
      }

  });

  // Counter für die aktuellen Verbindungen

  socket.on('counter', function(data){
    //console.log(data);
    $('#counter').html(data);
  });

  // Fehlermeldungen ausgeben

  socket.on('error', function(data){
    $('#result').html('<div class="alert alert-error">'+data+'</div>');
  });

</script>

<div class="container">
    <div class="row">
        <div class="span12">
            <h2>Live-Shownotes</h2>
            <div id="settings">
               <!-- <input type="checkbox" name="tab" id="tab" style="float: left;"> <label for="tab" style="margin-left: 15px;"><?php echo msg('auto_open'); ?></label> -->
               <p><?php echo msg('cur_viewer'); ?>: <span id="counter"></span> | <?php echo msg('auto_refresh'); ?></p>

            </div>
            <div id="result"></div>
        </div>
    </div>
</div>

<?php footer_ausgeben(); ?>

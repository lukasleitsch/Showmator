<?php 
    include("function.php");
    header_ausgeben("Live Shownotes");

    if (isset($_GET['slug'])) {
        $slug = $_GET['slug'];
        htmlentities($slug);
    }
?>

<script src="http://phasenkasper.de:63123/socket.io/socket.io.js"></script>
<script>
	var slug = '<?php echo $slug ?>';

  var socket = io.connect('http://phasenkasper.de:63123');


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
       $('#result').prepend('<div class="alert">Bitte noch etwas Geduld. Im Moment sind noch keine Shownotes eingetragen.</div>');
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
               <!-- <input type="checkbox" name="tab" id="tab" style="float: left;"> <label for="tab" style="margin-left: 15px;">Neue Links automatisch öffnen</label> -->
               <p>Aktuelle Betrachter: <span id="counter"></span> | Die Seite aktualisiert sich automatisch.</p>

            </div>
            <div id="result"></div>
        </div>
    </div>
</div>

<?php footer_ausgeben(); ?>
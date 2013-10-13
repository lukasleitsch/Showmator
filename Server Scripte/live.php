<?php 
    include("function.php");
    header_ausgeben("Live Shownotes");

    if (isset($_GET['slug'])) {
        $slug = $_GET['slug'];
        htmlentities($slug);
    }
?>

<script>
var slug = '<?php echo $slug ?>';

$(document).ready(function(){
    // $("#refresh").load('ausgabe.php?slug='+slug);
          
    // $(window).focus(function() {
    //   $("#refresh").load('ausgabe.php?slug='+slug);
    // });
    //  $(window).focus();

     if(typeof(EventSource)!=="undefined"){
            //$('#result').html("Läuft");
    }else{
        $('#result').html("Dein Browser ist zu alt. Diese Seite benötigt einen aktuellen Browser!")
    }

    var source=new EventSource('ausgabe.php?slug='+slug);

    source.addEventListener("ping", function(e) {
           
        var obj = JSON.parse(e.data);
        var link;

        if(obj.url != 'null'){
            link = '<a href="'+obj.url+'" target="_blank">'+obj.title+'</a>';
        }else{
            link = obj.title;
        }

        $('#result').prepend(obj.time+' '+link+'<br>');

        if ($('#tab').is(":checked")) {
            window.open(obj.url,'_newtab');
            window.focus();
        };
       
    }, false);

    source.addEventListener("first", function(e){
        $('#result').html(e.data);
    }, false);

    source.onmessage=function(event){
        document.getElementById("result").innerHTML=event.data + "<br>";
    };

   

});

</script>
<div class="container">
    <div class="row">
        <div class="span12">
            <h2>Live-Shownotes</h2>
            <div id="settings">
               <input type="checkbox" name="tab" id="tab" style="float: left;"> <label for="tab" style="margin-left: 15px;">Neue Links automatisch öffnen</label>
            </div>
            <div id="result"></div>
        </div>
    </div>
</div>

<?php footer_ausgeben(); ?>
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

    var id = 0;

    var source=new EventSource('ausgabe.php?slug='+slug+'&id='+id);

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

        id = obj.id;
        //alert(id);
        //var source=new EventSource('ausgabe.php?slug='+slug+'&id='+id);
    }, false);

    source.addEventListener("first", function(e){
        //var obj1 = JSON.parse(e.data);
        $('#result').html(e.data);
        //id = obj1.id;
                //alert(id);
        //var source=new EventSource('ausgabe.php?slug='+slug+'&id='+id);
    }, false);

});

</script>
<div class="container">
    <div class="row">
        <div class="span12">
            <h2>Live-Shownotes</h2>
            <div id="settings">
               <!-- <input type="checkbox" name="tab" id="tab" style="float: left;"> <label for="tab" style="margin-left: 15px;">Neue Links automatisch öffnen</label> -->
               <p>Die Seite aktualisiert sich automatisch.</p>

            </div>
            <div id="result"></div>
        </div>
    </div>
</div>

<?php footer_ausgeben(); ?>
// TODO title stuff

$(function() {

  var baseUrl = 'http://localhost:63685', // TODO should come from server
      socket  = io.connect(baseUrl),

      activeClass = 'has-active-shownotes',
      $slug       = $('#slug'),
      $blacklist  = $('#blacklist'),
      $title      = $('#title-shownotes'),

      init = function() {
        
        // toggle class based on current status

        $('body').removeClass(activeClass);

        socket.emit('status', {slug: localStorage.slug});

        socket.on('shownotes-active', function(){
          console.log("Shownotes active");
          $('body').addClass(activeClass);
        });

        // set slug in option
        $('#slug-static').text(localStorage.slug);
        
        
        if (typeof(localStorage.slug) == "undefined")
          localStorage.slug = randomSlug();
        $slug.val(localStorage.slug);

        if (typeof(localStorage.publicSlug) == "undefined")
          localStorage.publicSlug = randomSlug();

        if (typeof(localStorage.blacklist) == "undefined")
          localStorage.blacklist = '';
        else
          $blacklist.val(localStorage.blacklist);


        // set hrefs for links
        $('#live').prop('href', baseUrl + '/live/' + localStorage.publicSlug);
        $('#html').prop('href', baseUrl + '/html/' + localStorage.slug);
      },


      randomSlug = function() {
        return Math.random().toString(36).substring(7);
      };


  // submit new slug and show more options
  $('#submit-slug').click(function() {
    var slug = $.trim($slug.val()).replace(/ /g,'');
    
    if (!slug) {
      // TODO make tooltip
      $('#status').show().html("Bitte ein Kürzel eingeben!").delay(5000).fadeOut(3000);
    
    } else {
      localStorage.slug = slug;
      socket.emit('new', {slug: slug, publicSlug: randomSlug()});
      $slug.val(slug);
      $('body').addClass(activeClass);
      $('#slug-static').text(slug);
    }
  });


  socket.on('status', function(data){
    $('#status').show().html(data.text).delay(5000).fadeOut(3000);
    localStorage.publicSlug = data.publicSlug;
  });

  //save title changes
  $title.keyup(function() {
    socket.emit('set-title', {slug: localStorage.slug, title: $(this).val()});
    $('em#title-shownotes-alert').text($(this).val());
    console.log("Title");
  });

  // save blacklist changes
  $blacklist.keyup(function(){
    localStorage.blacklist = $(this).val();
    // TODO necessary?
    $('#status_url').show().html("Gespeichert").delay(5000).fadeOut(3000);
  });


  // 'create new' button triggers new shownotes' init
  $('#create-new, #alert-link-create-new').click(function(e) {
    e.preventDefault();
    localStorage.clear();
    init();
  });


  // get publicSlug and title from the server

  socket.on('getTitleAndPublicSlug', function(data){
    $title.val(data.title);
    if(data.title){
      $('em#title-shownotes-alert').text(data.title);
    }
    console.log('TITLEEL '+data.title);
    localStorage.publicSlug = data.publicSlug;

    // set hrefs for links
    $('#live').prop('href', baseUrl + '/live/' + localStorage.publicSlug);
  });


  // do it
  init();
});

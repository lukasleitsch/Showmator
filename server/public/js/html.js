/*global formatTime */

$(function() {

  // format time from timestamp
  var $markup = $('#markup-container'),
      start   = $markup.data('start'),
      offset  = $markup.data('offset');
  $('.time').each(function() {
    var $this = $(this);
    $this.text(formatTime(parseInt($this.data('time')) - start - offset));
  });


  // generate sourcecode in textfield  
  var updateHtml = function() {
    var showList     = $('#as-ul').is(':checked'),
        showTimes    = $('#show-times').is(':checked'),
        openInNewTab = $('#open-in-new-tab').is(':checked'),
        html         = $markup.html();

    html = html
      .replace(/ data-time="\d+"/g, '') // strip data-attributes
      .replace(/\n +/g, '\n')           // strip unnecessary spaces
      .replace(/\n+/g, '\n')            // multiple linebreaks to one
      .replace(/(^\n|\n$)/g, '');       // strip linebreaks at start/end

    if (showList) {
      // indent lines
      html = html
        .replace(/<(\/?)li/g, '  <$1li')
        .replace(/<(a|span)/g, '    <$1');
    } else {
      // hide ul/li-tags, insert br-tag
      html = html
        .replace(/<\/li>/g, '<br>')
        .replace(/<\/?(ul|li)>\n/g, '');
    }

    // hide span-tags
    if (!showTimes)
      html = html.replace(/ *<span[^\/]+<\/span>\n/g, '');

    // hide target-attributes
    if (!openInNewTab)
      html = html.replace(/ target="_blank"/g, '');


    $('#sourcecode').val(html);


    localStorage.showList     = showList ? 1 : 0;
    localStorage.showTimes    = showTimes ? 1 : 0;
    localStorage.openInNewTab = openInNewTab ? 1 : 0;
  };


  // load checkbox states from localStorage
  $('#as-ul').prop('checked', parseInt(localStorage.showList) === 1);
  $('#show-times').prop('checked', parseInt(localStorage.showTimes) === 1);
  $('#open-in-new-tab').prop('checked', parseInt(localStorage.openInNewTab) === 1);


  // intial trigger + binding
  updateHtml();
  $('#as-ul, #show-times, #open-in-new-tab').change(updateHtml);


  // select all text when focussing textarea
  $('#sourcecode').one('focus', function() {
    $(this).select().one('mouseup', function(e) {
      e.preventDefault();
    });
  });
});

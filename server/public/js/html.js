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

  
  // TODO localstorage for options


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
  };

  updateHtml();
  $('#as-ul, #show-times, #open-in-new-tab').change(updateHtml);

  // select all text when focussing textarea
  $('#sourcecode').one('focus', function() {
    $(this).select().one('mouseup', function(e) {
      e.preventDefault();
    });
  });
});

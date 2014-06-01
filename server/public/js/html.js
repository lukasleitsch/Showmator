/*global io */
/*global formatTime */
/*global isFormattedTime */
/*global formattedTimeToMilliseconds */
/*global console */

$(function() {

  var socket  = io.connect('http://localhost:63685'),
      $markup = $('#markup-container'),
      start   = $markup.data('start'),
      offset  = $markup.data('offset'),
      slug    = $markup.data('slug'),


      // format time from timestamp
      fillTimes = function() {
        $markup.find('li').removeClass('hide').find('.time').each(function() {
          var $this = $(this),
              time  = parseInt($this.data('time')) - start - offset;

          // mark entries which were added too early
          if (time < 0)
            $this.closest('li').addClass('hide');
          else
            $this.text(formatTime(time));
        });
      },


      // generate sourcecode in textfield  
      updateHtml = function() {
        var showList     = $('#as-ul').is(':checked'),
            showTimes    = $('#show-times').is(':checked'),
            openInNewTab = $('#open-in-new-tab').is(':checked'),
            $newMarkup   = $markup.clone();

        // remove entries which were added too early
        $newMarkup.find('.hide').remove();
        
        var html = $newMarkup.html()
             .replace(/ data-time="\d+"/g, '') // strip data-attributes
             .replace(/\n +/g, '\n')           // strip unnecessary spaces
             .replace(/\n+/g, '\n')            // multiple linebreaks to one
             .replace(/(^\n|\n$)/g, '');       // strip linebreaks at start/end

        if (showList) {
          // indent lines
          html = html
            .replace(/<(\/?)li( class="")?/g, '  <$1li')
            .replace(/<(a|span)/g, '    <$1');
        } else {
          // hide ul/li-tags, insert br-tag
          html = html
            .replace(/<\/li>/g, '<br>')
            .replace(/<\/?(ul|li)( class="")?>\n/g, '');
        }

        // hide span-tags
        if (!showTimes)
          html = html.replace(/ *<span[^\/]+<\/span>\n/g, '');

        // hide target-attributes
        if (!openInNewTab)
          html = html.replace(/ target="_blank"/g, '');

        $newMarkup.remove();

        $('#sourcecode').val(html);


        localStorage.showList     = showList ? 1 : 0;
        localStorage.showTimes    = showTimes ? 1 : 0;
        localStorage.openInNewTab = openInNewTab ? 1 : 0;
      };


  // load checkbox states from localStorage
  $('#as-ul').prop('checked', parseInt(localStorage.showList) === 1);
  $('#show-times').prop('checked', parseInt(localStorage.showTimes) === 1);
  $('#open-in-new-tab').prop('checked', parseInt(localStorage.openInNewTab) === 1);


  // intially load html + bind change events
  fillTimes();
  updateHtml();
  $('#as-ul, #show-times, #open-in-new-tab').change(updateHtml);


  // save new offset and recalculate times
  $('#offset').val(formatTime(offset)).keyup(function() {
    // TODO validate + error class
    var $this = $(this),
        val   = $.trim($this.val());
    if (!isFormattedTime(val))
      $this.addClass('error');
    else {
      $this.removeClass('error');
      newOffset = formattedTimeToMilliseconds(val);
      if (newOffset != offset) {
        offset = newOffset;
        socket.emit('offsetUpdated', {slug: slug, offset: offset});
        fillTimes();
        updateHtml();
      }
    }
  });


  // select all text when focussing textarea
  $('#sourcecode').one('focus', function() {
    $(this).select().one('mouseup', function(e) {
      e.preventDefault();
    });
  });
});

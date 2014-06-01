var padZero = function(num) {
      return num < 10 ? "0" + num : num;
    },

    formatTime = function(milliseconds) {
      var seconds = Math.floor(milliseconds / 1000),
          hours   = Math.floor(seconds / 3600),
          minutes = Math.floor((seconds / 60) % 60);
      return padZero(hours % 24) + ':' + padZero(minutes) + ':' + padZero(seconds % 60);
    },

    formattedTimeRegex = /^(\d{2}):(\d{2}):(\d{2})$/,

    isFormattedTime = function(timeStr) {
      return formattedTimeRegex.test(timeStr);
    },

    formattedTimeToMilliseconds = function(timeStr) {
      var matches = timeStr.match(formattedTimeRegex);
      return 1000 * (parseInt(matches[1]) * 3600 +
                     parseInt(matches[2]) * 60 +
                     parseInt(matches[3]));
    };
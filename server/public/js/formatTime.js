var padZero = function(num) {
      return num < 10 ? "0" + num : num;
    },

    formatTime = function(milliseconds) {
      var seconds = Math.floor(milliseconds / 1000),
          hours   = Math.floor(seconds / 3600),
          minutes = Math.floor((seconds / 60) % 60);
      return padZero(hours % 24) + ':' + padZero(minutes) + ':' + padZero(seconds % 60);
    };
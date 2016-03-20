module.exports = (function() {

  var module = {},


  // Private
  // -----------------------------------------------------------------------------

  padZero = function(num) {
    return num < 10 ? '0' + num : num;
  };


  // Public
  // -----------------------------------------------------------------------------

  module.formattedDate = function(date) {
    var now = (date) ? new Date(date) : new Date();
    return padZero(now.getDate()) + '.' +
           padZero(now.getMonth() + 1) + '.' +
           now.getUTCFullYear() + ' - ' +
           now.toLocaleTimeString();
  };


  // diff between now and a time
  module.timeAgo = function(time) {
    var timeBetween = new Date().getTime() - time,
        diffDays    = Math.round(timeBetween / 86400000), // days
        diffHrs     = Math.round((timeBetween % 86400000) / 3600000), // hours
        diffMins    = Math.round(((timeBetween % 86400000) % 3600000) / 60000), // minutes
        result      = '';

    if (diffDays > 0) {
      result += diffDays + ' Tag(e) ';
    }

    if (diffMins > 0) {
      result += diffHrs + ' Stunde(n) ';
    }

    return result + diffMins + ' Minute(n)';
  };


  module.log = function() {
    var args = [this.formattedDate()];
    for (var key in arguments) {
      args.push(arguments[key]);
    }
    console.log.apply(undefined, args);
  };


  return module;
}());

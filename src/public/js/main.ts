$(document).ready(function() {
  // Place JavaScript code here...
  $('#start').datetimepicker();
  $('#end').datetimepicker({
      useCurrent: false //Important! See issue #1075
  });
  $("#start").on("dp.change", function (e) {
      $('#end').data("DateTimePicker").minDate(e.date);
  });
  $("#end").on("dp.change", function (e) {
      $('#start').data("DateTimePicker").maxDate(e.date);
  });
});
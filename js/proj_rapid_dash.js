///////////////////////////////////////////////////////////////////////////////
//
// MAIN script executed after the page has loaded
// Place at the very bottom of the page after all libraries and scripts
//
///////////////////////////////////////////////////////////////////////////////

// Create chart objects & link them to the page
var dataTable = dc.dataTable("#bc-table");

// Create the spinning wheel while waiting for data load
// See http://fgnass.github.io/spin.js/
var spinner = null;
var spinner_div = 0;
$(document).ready(function() {
  var opts = {
    lines: 13,        // The number of lines to draw
    length: 20,       // The length of each line
    width: 10,        // The line thickness
    radius: 30,       // The radius of the inner circle
    corners: 1,       // Corner roundness (0..1)
    rotate: 0,        // The rotation offset
    direction: 1,     // 1: clockwise, -1: counterclockwise
    color: '#000',    // #rgb or #rrggbb or array of colors
    speed: 1,         // Rounds per second
    trail: 60,        // Afterglow percentage
    shadow: false,    // Whether to render a shadow
    hwaccel: true,    // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9,      // The z-index (defaults to 2000000000)
    top: '50%',       // Top position relative to parent
    left: '50%'       // Left position relative to parent
  };
  spinner_div = $('#spinner').get(0);
  spinner = new Spinner(opts).spin(spinner_div);
});

// load data from the server
d3.json("./data/tickets.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  var facts = crossfilter(data);
  var bcDim = facts.dimension(function (d) { return d.id; });

  // Setup the charts

  // Table of Business Cases
  dataTable.width(960).height(800)
    .dimension(bcDim)
    .group(function(d) { return "Business Cases"; })
    .size(200)
    .columns([
      function(d) { return d.id; },
      function(d) { return d.site; },
      function(d) { return( d.subject.substring(0,5) == "Integ" ? d.subject.substr(19) : d.subject ); },
      function(d) { return d.status; },
      function(d) { return d.issues; },
      function(d) { return d.progress.charAt(0); },
      function(d) { return d.progress.charAt(1); },
      function(d) { return d.progress.charAt(2); },
      function(d) { return d.progress.charAt(3); },
      function(d) { return d.progress.charAt(4); },
      function(d) { return d.progress.charAt(5); },
      function(d) { return d.progress.charAt(6); },
      function(d) { return d.progress.charAt(7); },
      function(d) { return d.progress.charAt(8); },
      function(d) { return d.progress.charAt(9); },
      function(d) { return d.progress.charAt(10); }
    ])
    .sortBy(function(d){ return d.id; })
    .order(d3.ascending);

  // Render the charts
  dc.renderAll();

  for( var i = 0; i < 1000000; i++ ) {
    for( var j = 0; j < 1000; j++ ) {}
  }

  // End the spinner
  if( spinner != null ) {
    spinner.stop(spinner_div);
  }

});

// Process ticket search
$("#tk-search").submit(function(e) {
  var t = $("#tk-num").val();
  if( t == parseInt(t) && t > 0 ) {
    window.open("http://ithelpdesk.ema.esselte.net/rt/Ticket/Display.html?id="+t,"_blank");
  }
  e.preventDefault();
});

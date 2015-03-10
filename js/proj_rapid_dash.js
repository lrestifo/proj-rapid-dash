///////////////////////////////////////////////////////////////////////////////
//
// MAIN script executed after the page has loaded
// Place at the very bottom of the page after all libraries and scripts
//
///////////////////////////////////////////////////////////////////////////////

// Create chart objects & link them to the page, initialize page globals
var dataTable = dc.dataTable("#bc-table");
var testsPie = dc.pieChart("#bc-test-chart");
var filterLocn = 0;
var factsLoaded = false;
var facts;
var siteDim;

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
    color: "#000",    // #rgb or #rrggbb or array of colors
    speed: 1,         // Rounds per second
    trail: 60,        // Afterglow percentage
    shadow: false,    // Whether to render a shadow
    hwaccel: true,    // Whether to use hardware acceleration
    className: "spinner", // The CSS class to assign to the spinner
    zIndex: 2e9,      // The z-index (defaults to 2000000000)
    top: "50%",       // Top position relative to parent
    left: "50%"       // Left position relative to parent
  };
  spinner_div = $("#spinner").get(0);
  spinner = new Spinner(opts).spin(spinner_div);
  // Reset location filter
  setLocationFilter( 0 );
});

// Map a status letter to its corresponding colored icon
function bcSymbol( c ) {
  switch( c.toUpperCase() ) {
    case "N": return( "<span class='label label-warning glyphicon glyphicon-pause'> N </span>" );
    case "O": return( "<span class='label label-info glyphicon glyphicon-play'> O </span>" );
    case "E": return( "<span class='label label-danger glyphicon glyphicon-remove'> E </span>" );
    case "R": return( "<span class='label label-success glyphicon glyphicon-ok'>&nbsp;&nbsp;</span>" );
    default: return( "&nbsp;" );
  }
}

// Map ticket status to test status name
function testStatus( s ) {
  switch( s.toLowerCase() ) {
    case "new":       return( "Not started" );
    case "open":      return( "In progress" );
    case "stalled":   return( "In error" );
    case "resolved":  return( "Completed" );
    default:          return( "Unknown" );
  }
}

// Anchor the ticket subject
function ticketA( id, subj ) {
  return( "<a href='http://ithelpdesk.ema.esselte.net/rt/Ticket/Display.html?id=" + id + "'>" + subj + "</a>" );
}

// Load data from the server
d3.json("./data/tickets.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  facts = crossfilter(data);
  siteDim = facts.dimension(function (d) { return d.site; });
  var bcDim = facts.dimension(function (d) { return d.id; });
  var statusDim = facts.dimension(function (d) { return testStatus(d.status); });
  var statusGroup = statusDim.group();

  // Business cases status pie chart
  testsPie.width(200).height(200)
    .radius(100)
    .innerRadius(30)
    .dimension(statusDim)
    .group(statusGroup)
    .title(function(d) { return d.value; });

  // Table of Business Cases
  var nFmt = d3.format("4d");
  dataTable.width(960).height(800)
    .dimension(bcDim)
    .group(function(d) { return ( filterLocn == 0 ? "All Business Cases" : ( filterLocn == 1 ? "Business Cases Hestra" : "Business Cases St.Amé" ) ); })
    .size(200)
    .columns([
      function(d) { return ticketA(d.id, d.id); },
      function(d) { return d.site; },
      function(d) { return( d.subject.substring(0,5) == "Integ" ? ticketA(d.id, d.subject.substr(19)) : ticketA(d.id, d.subject) ); },
      function(d) { return d.status; },
      function(d) { return nFmt( d.issues ); },
      function(d) { return bcSymbol( d.progress.charAt(0) ); },
      function(d) { return bcSymbol( d.progress.charAt(1) ); },
      function(d) { return bcSymbol( d.progress.charAt(2) ); },
      function(d) { return bcSymbol( d.progress.charAt(3) ); },
      function(d) { return bcSymbol( d.progress.charAt(4) ); },
      function(d) { return bcSymbol( d.progress.charAt(5) ); },
      function(d) { return bcSymbol( d.progress.charAt(6) ); },
      function(d) { return bcSymbol( d.progress.charAt(7) ); },
      function(d) { return bcSymbol( d.progress.charAt(8) ); },
      function(d) { return bcSymbol( d.progress.charAt(9) ); },
      function(d) { return bcSymbol( d.progress.charAt(10) ); }
    ])
    .sortBy(function(d){ return d.id; })
    .order(d3.ascending);

  // Render the charts
  dc.renderAll();
  factsLoaded = true;

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

// Set location filter
$("#filterSE").click(function(e) { setLocationFilter(1); });
$("#filterFR").click(function(e) { setLocationFilter(2); });
$("#filterXX").click(function(e) { setLocationFilter(0); });
function setLocationFilter( l ) {
  if( !factsLoaded ) { return; }
  dc.filterAll();
  switch( l ) {
    case 1:
      siteDim.filter("H");
      filterLocn = 1;
      $(".currentLocn").text("Hestra");
      break;
    case 2:
      siteDim.filter("S");
      filterLocn = 2;
      $(".currentLocn").text("St.Amé");
      break;
    default:
      siteDim.filterAll();
      filterLocn = 0;
      $(".currentLocn").text("Hestra + St.Amé");
      break;
  }
  dc.redrawAll();
}

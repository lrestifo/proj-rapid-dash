///////////////////////////////////////////////////////////////////////////////
//
// MAIN script executed after the page has loaded
// Place at the very bottom of the page after all libraries and scripts
//
///////////////////////////////////////////////////////////////////////////////
"use strict";

// Create chart objects & link them to the page, initialize page globals
var dataTable = dc.dataTable("#bc-table","bc");
var testsPie = dc.pieChart("#bc-test-chart","bc");
var statusRow = dc.rowChart("#issue-stat-chart","ii");
var ownerPie = dc.pieChart("#issue-own-chart","ii");
var impactBub = dc.bubbleChart("#issue-impact-chart","ii");
// var issueTable = dc.dataTable("#issue-table");

// Hold crossfilter facts
var facts;                // Business Cases
var issueFacts;           // Issues
var factsLoaded = false;  // Boolean set after loading, enables filters

// Filter on facts is page-wide
var filterLocn = 0;       // 0=All, 1=Hestra, 2=StAme
var siteDim;              // Dimension to filter upon

// Create the spinning wheel while waiting for data load
// See http://fgnass.github.io/spin.js/
var spinner = [ null, null, null, null, null ];
var spinDiv = [ 0, 0, 0, 0, 0 ];
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
  spinDiv[0] = $("#spinner").get(0);
  spinDiv[1] = $("#bc-test-div").get(0);
  spinDiv[2] = $("#issue-stat-div").get(0);
  spinDiv[3] = $("#issue-own-div").get(0);
  spinDiv[4] = $("#issue-impact-div").get(0);
  for( var i = 0; i < spinDiv.length; i++ ) {
    spinner[i] = new Spinner(opts).spin(spinDiv[i]);
  }
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

// Anchor the ticket subject
function ticketA( id, subj ) {
  return( "<a href='http://ithelpdesk.ema.esselte.net/rt/Ticket/Display.html?id=" + id + "'>" + subj + "</a>" );
}

// Turn a string plural if necessary
function toPlural( s, n ) {
  return( n == 1 ? s : s+"s" );
}

// Load data from the server
// d3.json("../cgi-bin/rapid/tickets.pl", function (data) {
d3.json("./data/tickets.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  facts = crossfilter(data);
  siteDim = facts.dimension(function (d) { return d.site; });
  var bcDim = facts.dimension(function (d) { return d.id; });
  var statusDim = facts.dimension(function (d) { return d.completion; });
  var statusGroup = statusDim.group();

  // Business cases status pie chart
  testsPie.width(200).height(200)
    .radius(100)
    .innerRadius(70)
    .ordinalColors(["#5668e2","#56aee2","#56e2cf","#56e289","#68e256","#aee256","#e2cf56","#e28956","#e25668","#e256ae","#cf56e2","#8a56e2"])
    .legend(dc.legend().x(50).y(40).itemHeight(12).gap(3))
    .renderLabel(false)
    .dimension(statusDim)
    .group(statusGroup)
    .title(function(d) { return d.value + toPlural(" business case", d.value) + " " + d.key; });

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
      function(d) { return d.completion; },
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
  dc.renderAll("bc");
  factsLoaded = true;

  // End the spinner(s)
  for( var i = 0; i < spinDiv.length; i++ ) {
    if( spinner[i] != null ) {
      spinner[i].stop(spinDiv[i]);
    }
  }

});

// Load issue data from the server
// d3.json("../cgi-bin/rapid/issues.pl", function (data) {
d3.json("./data/issues.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  issueFacts = crossfilter(data);
  var issueDim = issueFacts.dimension(function (d) { return d.id; });
  var issueStatusDim = issueFacts.dimension(function (d) { return d.status; });
  var issueStatusGroup = issueStatusDim.group();
  var issueOwnerDim = issueFacts.dimension(function (d) { return d.owner; });
  var issueOwnerGroup = issueOwnerDim.group();
  // Duplicate used for bubble chart
  var issueStatusDim2 = issueFacts.dimension(function (d) { return d.status; });

  // Issue status row chart
  statusRow.width(200).height(200)
    .margins({top:5, left:10, right:10, bottom:20})
    .dimension(issueStatusDim)
    .group(issueStatusGroup)
    .colors(d3.scale.category10())
    .label(function (d) { return d.key; })
    .title(function (d) { return d.value + " " + d.key + toPlural(" issue",d.key); })
    .elasticX(true)
    .xAxis().ticks(4);

  // Issue owners pie chart -- From now on only active issues
  issueStatusDim.filter(function (d) { return d != "resolved"; });
  ownerPie.width(200).height(200)
    .radius(100)
    .ordinalColors(["#8a56e2","#cf56e2","#e256ae","#e25668","#e28956","#e2cf56","#aee256","#68e256","#56e289","#56e2cf","#56aee2","#5668e2"])
    .dimension(issueOwnerDim)
    .group(issueOwnerGroup)
    .label(function (d) { return d.key; })
    .title(function (d) { return d.key + ": " + d.value + toPlural(" issue", d.value); });

  // Issue grouping by Frequency / Impact (for the bubble chart)
  //------------------------------------------------------------
  // Assign a temperature to each combination of frequency and impact
  // ranging from 40 to 200 "degrees"
  var temperature = function(f, i) {
    var temps = [
      ['H', 'H', 200],['H', 'M', 180],['H', 'L', 160],
      ['M', 'H', 140],['M', 'M', 120],['M', 'L', 100],
      ['L', 'H',  80],['L', 'M',  60],['L', 'L',  40]
    ];
    for( var n = 0; n < temps.length; n++ ) {
      if( f === temps[n][0] && i === temps[n][1] ) {
        return temps[n][2];
      }
    }
    return 40;
  };

  // Assign an axis position to each inidcator, one of: 25, 50, 75
  var position = function(v) {
    return( v === 'H' ? 75 : ( v === 'M' ? 50 : 25 ) );
  };

  issueStatusDim2.filter(function (d) { return d != "resolved"; });
  var issueFreqImpactGroup = issueStatusDim2.group().reduce(
    function(p, v) {  // Add callback
      ++p.count;
      p.therm = temperature(v.frequency.toUpperCase(), v.impact.toUpperCase());
      p.xPos = position(v.frequency.toUpperCase());
      p.yPos = position(v.impact.toUpperCase());
    },
    function(p, v) {  // Remove callback
      --p.count;
      p.therm = temperature(v.frequency.toUpperCase(), v.impact.toUpperCase());
      p.xPos = position(v.frequency.toUpperCase());
      p.yPos = position(v.impact.toUpperCase());
    },
    function() {  // Initialize p
      return {count:0, therm:0, xPos:0, yPos:0};
    }
  );

  // Issue impact bubble chart
  impactBub.width(200).height(200)
    .margins({top:5, left:20, right:10, bottom:20})
    .dimension(issueStatusDim2)
    .group(issueFreqImpactGroup)
    .colors(d3.scale.category20b())
    .colorDomain([40,200])
    .colorAccessor(function (d) { return d.value.therm; } )
    .keyAccessor(function (p) { return p.value.xPos; } )
    .valueAccessor(function (p) { return p.value.yPos; } )
    .radiusValueAccessor(function (p) { return p.value.count; } )
    .maxBubbleRelativeSize(0.3)
    .x(d3.scale.linear().domain([0,100]))
    .y(d3.scale.linear().domain([0,100]))
    .r(d3.scale.linear().domain([0,100]))
    .elasticX(true)
    .elasticY(true)
    .elasticRadius(true)
    .yAxisPadding(100)
    .xAxisPadding(100)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .xAxisLabel("Frequency")
    .yAxisLabel("Impact")
    .renderLabel(true)
    .label(function (d) { return d.key; })
    .renderTitle(true)
    .title(function (d) { return d.value; })
  ;

  // Table of Issues
  // var nFmt = d3.format("4d");
  // issueTable.width(240).height(120)
    // .dimension(issueDim)
    // .group(function(d) { return ( filterLocn == 0 ? "All Issues" : ( filterLocn == 1 ? "Issues Hestra" : "Issues St.Amé" ) ); })
    // .size(200)
    // .columns([
      // function(d) { return ticketA(d.id, d.id); },
      // function(d) { return d.site; },
      // function(d) { return ticketA(d.id, d.subject); },
      // function(d) { return d.owner; },
      // function(d) { return d.frequency; },
      // function(d) { return d.impact; },
      // function(d) { return d.status; },
      // function(d) { return d.bc; }
    // ])
    // .sortBy(function(d){ return d.id; })
    // .order(d3.ascending);

  // Render the charts
  dc.renderAll("ii");

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
  dc.filterAll("bc");
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
      siteDim.filterAll("bc");
      filterLocn = 0;
      $(".currentLocn").text("Hestra + St.Amé");
      break;
  }
  dc.redrawAll("bc");
}

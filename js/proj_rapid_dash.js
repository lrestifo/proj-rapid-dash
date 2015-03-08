///////////////////////////////////////////////////////////////////////////////
//
// MAIN script executed after the page has loaded
// Place at the very bottom of the page after all libraries and scripts
//
///////////////////////////////////////////////////////////////////////////////

// Create chart objects & link them to the page
var dataTable = dc.dataTable("#bc-table");

// load data from the server
d3.json("data/tickets.json", function (data) {

  // Run the data through crossfilter and load facts and dimensions
  var facts = crossfilter(data);
  var bcDim = facts.dimension(function (d) { return d.id; });

  // Setup the charts

  // Table of Business Cases
  dataTable.width(960).height(800)
    .dimension(bcDim)
    .group(function(d) { return "Business Cases"; })
    .size(100)
    .columns([
      function(d) { return d.id; },
      function(d) { return d.site; },
      function(d) { return ( d.subject.startsWith("Integration") ? d.subject.substring(d.subject.indexOf("-")+1) : d.subject ); },
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

});

// This is called when user is looking for a ticket in the search box
// $#("tk-search").submit(function(e) {
//  window.open("http://ithelpdesk.ema.esselte.net/rt/Ticket/Display.html?id="+$#("tk-num").text,"_blank");
// });

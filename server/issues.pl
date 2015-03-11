#!/usr/bin/perl -w
################################################################################
#
# Title:    ISSUES -- Query RT and return JSON
# Author:   Wed Mar 11 21:14:45 CET 2015 lrestifo at esselte dot com
# Description:
#   This script executes the following tasks:
#   1. Runs an RT query using the REST API
#   2. Extract selected data from the result set
#   3. Writes the data on standard output as a JSON string
# Usage:
#   It is meant to be called as a web service via an HTTP GET, however it
#   can also be called from the command line (perl tickets.pl)
# Notes:
#   The script takes configuration parameters from a known data file located
#   in the current execution directory
#   The script implements a custom business logic instrumental for the SAP
#   Rapid project.  It is called in the context of a reporting dashboard web
#   page, to which it is providing data to be charted, displayed and filtered
#   in various ways
# Output:
#   A JSON string representing an array of objects
#
################################################################################

use strict;
use YAML qw(LoadFile);
use Error qw(:try);
use RT::Client::REST;
binmode STDOUT, ":utf8";

# Replaces " with ' (for JSON)
#------------------------------
sub fixQuotes {
  my $s = $_[0];
  $s =~ s/"/'/g;
  return $s;
}

# Read configuration data
#-------------------------
# my $conf = LoadFile("config.yaml");
my $conf = LoadFile("./server/config.yaml");

# Connect and login to RT
#-------------------------
my $rt = RT::Client::REST->new(
  server => $conf->{"server"},
  timeout => 30
);
try {
  $rt->login(username => $conf->{"user"}, password => $conf->{"pass"});
} catch Exception::Class::Base with {
  die "Can't login as '", $conf->{"user"}, "': ", shift->message;
};

# Run the RT query and collect results
#--------------------------------------
my @bcFreq; # Frequency
my @bcImp;  # Impact
print "Content-type: application/json;\n\n[";
try {
  # Query business cases
  my @ids = $rt->search(
    type => "ticket",
    query => $conf->{"query"},
    orderby => "id"
  );
  my $issues = 0;
  for my $id (@ids) {
    my $t = $rt->show(type => "ticket", id => $id);
    $bcFreq[$id] = substr( $t->{"CF.{QS Color}"}, 0, 1 ); # H/M/L
    $bcImp[$id]  = substr( $t->{"CF.{QS Color}"}, 1, 1 ); # H/M/L
    # Query issues for the current business case
    my $issueQry = "MemberOf = " . $id;
    my @iids = $rt->search(
      type => "ticket",
      query => $issueQry,
      orderby => "id"
    );
    my $tickets = @iids;
    for my $tid (@iids) {
      my $tk = $rt->show(type => "ticket", id => $tid);
      print ',' unless ( $issues == 0 );
      print '{';
      print '"id":', $tid, ',';
      print '"subject":"', fixQuotes($tk->{Subject}), '",';
      print '"status":"', $tk->{Status}, '",';
      print '"owner":"', $tk->{Owner}, '",';
      print '"bc":', $id, ',';     # $tk->{Parents}, ',';
      print '"frequency":"', $bcFreq[$id], '",';
      print '"impact":"', $bcImp[$id], '"}';
      # print ',' unless ( --$tickets < 1 );
      $issues++;
    }
  }
} catch RT::Client::REST::Exception with {
  # something went wrong.
  die shift->message;
};

# Game over
#-----------
print "]\n";
exit( 0 );

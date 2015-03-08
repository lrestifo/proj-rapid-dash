#!/usr/bin/env perl -w
################################################################################
#
# Title:    TICKETS -- Query RT and return JSON
# Author:   Sat Mar 07 18:00:45 CET 2015 lrestifo at esselte dot com
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

# Capture site info embedded in the subject string (S/H-, S-, H-)
#-----------------------------------------------------------------
sub defSite {
  my $s = $_[0];
  $s =~ m/[A-Za-z ]+(S\/H-|S-|H-)[A-Z]/;
  return substr($1,0,length($1)-1);
}

# Read configuration data
#-------------------------
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
print "Content-type: application/json;\n\n[";
try {
  my @ids = $rt->search(
    type => "ticket",
    query => $conf->{"query"},
    orderby => "id"
  );
  my $tickets = @ids;
  for my $id (@ids) {
    my $t = $rt->show(type => "ticket", id => $id);
    # I'm cheting - there is actually a nested query here
    # count the number of child tickets for each ticket of the main query
    my $iQry = $conf->{"issues"};
    $iQry =~ s/\Q%d\E/$id/g;
    my @children = $rt->search(
      type => "ticket",
      query => $iQry
    );
    my $children = @children;
    print '{';
    print '"id":', $id, ',';
    print '"site":"', defSite($t->{Subject}), '",';
    print '"subject":"', fixQuotes($t->{Subject}), '",';
    print '"status":"', $t->{Status}, '",';
    print '"progress":"', fixQuotes($t->{"CF.{QS Status}"}), '",';
    print '"issues":', $children, '}';
    print ',' unless ( --$tickets < 1 );
  }
} catch RT::Client::REST::Exception with {
  # something went wrong.
  die shift->message;
};

# Game over
#-----------
print "]\n";
exit( 0 );

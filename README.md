boxscore
========

A server which collects data points (hits) and prints out top *K*
calculations for the last *N* minutes.

## Dependencies

Just Node right now.

## Quick Start

    $ npm install .
    $ node boxscore.js

## Protocol

It speaks Graphite on udp/4060:

    <key> <count> <timestamp>\n

This may change. Maybe it should speak Statsd?

Example:

    $ date +%s # current unix timestamp
    1343944811
    $ nc -u 127.0.0.1 4060
    hits.ted 1 1343944811
    hits.carlton 1 1343944811
    hits.nomar 1 1343944811
    hits.manny 1 1343944811
    hits.nomar 2 1343944811
    ^C

Then from [http://localhost:4061/top/hits](http://localhost:4061/top/hits):

    $ curl http://localhost:4061/top/hits
    [[3,"nomar"],[1,"ted"],[1,"carlton"],[1,"manny"]]

## Gotchas

* **No configuration whatsoever!**
  * STATS_PORT is udp/4060
  * REPORTS_PORT is tcp/4061
  * Binds to all available interfaces
  * Shows the last five minutes, and all values (no cutoff)
  * A lot of messy debug stuff everywhere!
* It doesn't get rid of any data, meaning bloat city, population you.

## Did you know?

In 1941, Ted Williams batted a .406, and remains the last person in
Major League Baseball to bat over .400 in a single season.

## License

BSD.

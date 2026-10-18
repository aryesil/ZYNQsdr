#!/bin/sh
# GNSS image: executable bits (checkouts on Windows lose them) and removal of
# init scripts that only make sense with maia-httpd.
set -eu
chmod 0755 "$1/usr/sbin/gnssctl" "$1/etc/init.d/S60dashboard"
rm -f "$1/etc/init.d/S59bandplan" "$1/etc/init.d/S61classifier"

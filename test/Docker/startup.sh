#!/bin/bash
set -e

# Start PHP-FPM
php-fpm8.2 -D

# Start Nginx in foreground
nginx -g "daemon off;"

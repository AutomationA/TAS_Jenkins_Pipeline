#!/bin/bash
PARENTDIR=$(dirname -- "$PWD")

SELENIUM_SERVER_JAR="$PARENTDIR/dependencies/selenium-server-standalone-3.141.59.jar"
HUB_PORT="4444"

java -jar $SELENIUM_SERVER_JAR -port $HUB_PORT -role hub
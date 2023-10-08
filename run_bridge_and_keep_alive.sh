#!/usr/bin/env sh

while true
do
   node ./scripts/bridge.js "$@"

   # show result
   exitcode=$?
   echo "exit code of command is $exitcode"

   sleep 1
done

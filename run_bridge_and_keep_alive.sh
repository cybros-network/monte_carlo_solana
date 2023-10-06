#!/usr/bin/env sh
set -e

while (true) do
   node ./scripts/bridge.js "$@"

   # show result
   exitcode=$?
   echo "exit code of command is $exitcode"
done

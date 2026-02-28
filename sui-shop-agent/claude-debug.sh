#!/bin/bash
echo "ARGS: $@" >> /tmp/claude-sdk-args.log
echo "CLAUDECODE=${CLAUDECODE}" >> /tmp/claude-sdk-args.log
echo "---" >> /tmp/claude-sdk-args.log
unset CLAUDECODE
exec /Users/jimmyt1453/.local/bin/claude "$@"

#!/usr/bin/env bash

DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

stopped=0

# Kill by PID files
for name in backend frontend; do
  pidfile="$DIR/.${name}.pid"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      echo -e "${RED}Stopped ${name} (PID $pid)${NC}"
      stopped=1
    fi
    rm -f "$pidfile"
  fi
done

# Fallback: kill by port
for port in 8000 5173; do
  pids=$(lsof -ti:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill 2>/dev/null
    echo -e "${RED}Killed processes on port $port${NC}"
    stopped=1
  fi
done

if [ "$stopped" -eq 0 ]; then
  echo -e "${GREEN}No running servers found.${NC}"
else
  echo -e "${GREEN}All servers stopped.${NC}"
fi

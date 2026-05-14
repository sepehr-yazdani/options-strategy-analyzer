#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting Options Strategy Analyzer...${NC}"

# Install backend deps if needed
if [ ! -d "$DIR/backend/.venv" ]; then
  echo -e "${YELLOW}Setting up Python virtual environment...${NC}"
  python3 -m venv "$DIR/backend/.venv"
  "$DIR/backend/.venv/bin/pip" install --upgrade pip -q
  "$DIR/backend/.venv/bin/pip" install -r "$DIR/backend/requirements.txt" -q
  echo -e "${GREEN}Backend dependencies installed.${NC}"
fi

# Install frontend deps if needed
if [ ! -d "$DIR/frontend/node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  (cd "$DIR/frontend" && npm install)
  echo -e "${GREEN}Frontend dependencies installed.${NC}"
fi

# Start backend
echo -e "${GREEN}Starting backend on http://localhost:8000${NC}"
cd "$DIR/backend"
.venv/bin/uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$DIR/.backend.pid"

# Start frontend
echo -e "${GREEN}Starting frontend on http://localhost:5173${NC}"
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$DIR/.frontend.pid"

echo ""
echo -e "${GREEN}Both servers running.${NC}"
echo -e "  Frontend: http://localhost:5173"
echo -e "  Backend:  http://localhost:8000"
echo -e "  API docs: http://localhost:8000/docs"
echo ""
echo -e "Run ${YELLOW}./stop.sh${NC} to stop both servers."
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f $DIR/.backend.pid $DIR/.frontend.pid" EXIT
wait

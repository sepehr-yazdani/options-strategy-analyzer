from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analysis, chain, discovery, earnings, greeks, optimize, strategy

app = FastAPI(title="Options Strategy Analyzer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api")
app.include_router(chain.router, prefix="/api")
app.include_router(discovery.router, prefix="/api")
app.include_router(earnings.router, prefix="/api")
app.include_router(greeks.router, prefix="/api")
app.include_router(optimize.router, prefix="/api")
app.include_router(strategy.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import sys
import os

from app.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run seeder on startup
    print("Running database seeder...")
    seed_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed.py")
    subprocess.run([sys.executable, seed_script], check=True)
    yield


app = FastAPI(
    title="Guess the Word API",
    description="Backend API for the Guess the Word game",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — read allowed origins from env (comma-separated), default to localhost for dev
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "Welcome to Guess the Word API. Docs at /docs"}

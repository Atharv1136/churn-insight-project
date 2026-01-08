"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from app.config import settings
from app.database import init_db
from api.routes import predict, train, metrics, explain, customers

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOGS_DIR / "app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting Customer Churn Prediction API...")
    logger.info(f"Base directory: {settings.BASE_DIR}")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Create necessary directories
    settings.create_directories()
    logger.info("Directories created")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Customer Churn Prediction API...")


# Create FastAPI application
app = FastAPI(
    title="Customer Churn Prediction API",
    description="Production-ready ML API for predicting customer churn with explainability",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router, prefix="/api", tags=["Predictions"])
app.include_router(train.router, prefix="/api", tags=["Training"])
app.include_router(metrics.router, prefix="/api", tags=["Metrics"])
app.include_router(explain.router, prefix="/api", tags=["Explainability"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Customer Churn Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
        "models_dir": str(settings.SAVED_MODELS_DIR.exists())
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )

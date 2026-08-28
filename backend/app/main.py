from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.middleware import AuthMiddleware
from app.openrouter import roast_user_list

limiter = Limiter(key_func=get_remote_address)

class RoastRequest(BaseModel):
	video_titles: list[str]

class RoastResponse(BaseModel):
	roast: str

app = FastAPI(
	title="YT Watch Later Roast API",
	version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.CORS_ORIGINS,
	allow_credentials=False,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

@app.get("/")
async def home():
	return {"message": "v1.0.0"}

@app.post("/roast", response_model=RoastResponse, status_code=200, summary="Roast the user's Watch Later Playlist.")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def roast(request: Request, videos_titles: RoastRequest):
	roast = roast_user_list(videos_titles.video_titles)
	return RoastResponse(roast=roast)


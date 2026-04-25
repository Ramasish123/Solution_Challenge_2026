from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, auth, crud, predictions, scheduler, timetables, validate
from app.db.init_db import initialize_database


app = FastAPI(
    title="Smart Classroom & Timetable Intelligence System",
    version="2.0.0",
    description="Interactive AI scheduling decision platform with explainable optimization.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(scheduler.router)
app.include_router(timetables.router)
app.include_router(analytics.router)
app.include_router(crud.router)
app.include_router(validate.router)
app.include_router(predictions.router)


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

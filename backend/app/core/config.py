from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart Classroom & Timetable Intelligence System"
    database_url: str = "sqlite:///./smart_classroom.db"
    auth_data_file: str = "./data/auth_users.json"
    jwt_secret: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 8
    demo_admin_email: str = "admin@smartclassroom.local"
    demo_admin_password: str = "Admin@123"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

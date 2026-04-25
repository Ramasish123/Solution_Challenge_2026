import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.security import get_password_hash, verify_password


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AuthenticatedUser:
    id: int
    username: str
    email: str
    full_name: str
    role: str


class AuthStore:
    def __init__(self, file_path: str) -> None:
        self.file_path = Path(file_path)
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_store()

    def _ensure_store(self) -> None:
        if self.file_path.exists():
            self._upgrade_store()
            return

        demo_user = {
            "id": 1,
            "username": "admin001",
            "email": settings.demo_admin_email,
            "full_name": "System Admin",
            "role": "admin",
            "hashed_password": get_password_hash(settings.demo_admin_password),
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
            "last_login_at": None,
        }
        self._write_users([demo_user])

    def _upgrade_store(self) -> None:
        users = self._read_users_raw()
        changed = False
        next_id = 1
        for user in users:
          if "id" not in user:
              user["id"] = next_id
              changed = True
          next_id = max(next_id, int(user["id"]) + 1)
        if changed:
            self._write_users(users)

    def _read_users_raw(self) -> list[dict]:
        with self.file_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return data.get("users", [])

    def _read_users(self) -> list[dict]:
        self._ensure_store()
        return self._read_users_raw()

    def _write_users(self, users: list[dict]) -> None:
        payload = {"users": users}
        with self.file_path.open("w", encoding="utf-8") as file:
            json.dump(payload, file, indent=2)

    def _next_user_id(self, users: list[dict]) -> int:
        if not users:
            return 1
        return max(int(user["id"]) for user in users) + 1

    def find_by_username(self, username: str) -> Optional[dict]:
        for user in self._read_users():
            if user["username"] == username:
                return user
        return None

    def find_by_email(self, email: str) -> Optional[dict]:
        for user in self._read_users():
            if user["email"] == email:
                return user
        return None

    def find_by_identifier(self, identifier: str) -> Optional[dict]:
        for user in self._read_users():
            if user["username"] == identifier or user["email"] == identifier:
                return user
        return None

    def create_user(
        self,
        *,
        username: str,
        email: str,
        full_name: str,
        role: str,
        password: str,
    ) -> dict:
        users = self._read_users()
        timestamp = _utc_now()
        user = {
            "id": self._next_user_id(users),
            "username": username,
            "email": email,
            "full_name": full_name,
            "role": role,
            "hashed_password": get_password_hash(password),
            "created_at": timestamp,
            "updated_at": timestamp,
            "last_login_at": timestamp,
        }
        users.append(user)
        self._write_users(users)
        return user

    def mark_login(self, username: str) -> Optional[dict]:
        users = self._read_users()
        for user in users:
            if user["username"] == username:
                timestamp = _utc_now()
                user["last_login_at"] = timestamp
                user["updated_at"] = timestamp
                self._write_users(users)
                return user
        return None

    @staticmethod
    def password_matches(password: str, hashed_password: str) -> bool:
        return verify_password(password, hashed_password)

    @staticmethod
    def to_authenticated_user(user: dict) -> AuthenticatedUser:
        return AuthenticatedUser(
            id=int(user["id"]),
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
        )

    @staticmethod
    def to_profile(user: dict) -> dict:
        return {
            "id": int(user["id"]),
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "created_at": user.get("created_at"),
            "last_login_at": user.get("last_login_at"),
        }


auth_store = AuthStore(settings.auth_data_file)

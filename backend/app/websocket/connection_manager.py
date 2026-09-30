from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("campusfind.ws")


class ConnectionManager:
    def __init__(self):
        # case_id -> list of WebSockets
        self.active_case_connections: Dict[int, List[WebSocket]] = {}
        # user_id -> list of WebSockets
        self.active_user_connections: Dict[int, List[WebSocket]] = {}

    async def connect_case(self, case_id: int, websocket: WebSocket):
        await websocket.accept()
        if case_id not in self.active_case_connections:
            self.active_case_connections[case_id] = []
        self.active_case_connections[case_id].append(websocket)
        logger.info(f"WebSocket connected for case {case_id}")

    def disconnect_case(self, case_id: int, websocket: WebSocket):
        if case_id in self.active_case_connections:
            if websocket in self.active_case_connections[case_id]:
                self.active_case_connections[case_id].remove(websocket)
            if not self.active_case_connections[case_id]:
                del self.active_case_connections[case_id]
        logger.info(f"WebSocket disconnected from case {case_id}")

    async def broadcast_to_case(self, case_id: int, message: dict):
        if case_id in self.active_case_connections:
            dead_sockets = []
            for connection in self.active_case_connections[case_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to case {case_id}: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect_case(case_id, dead)

    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = []
        self.active_user_connections[user_id].append(websocket)

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_user_connections:
            dead_sockets = []
            for connection in self.active_user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect_user(user_id, dead)


ws_manager = ConnectionManager()

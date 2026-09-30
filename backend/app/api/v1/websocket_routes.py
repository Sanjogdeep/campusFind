from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.websocket.connection_manager import ws_manager
import logging

logger = logging.getLogger("campusfind.ws")
router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/cases/{case_id}")
async def websocket_case_chat(websocket: WebSocket, case_id: int, token: str = Query(...)):
    """Real-time bidirectional WebSocket channel for case chat and live status."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    await ws_manager.connect_case(case_id, websocket)
    try:
        while True:
            # Keep connection open for incoming pings/messages
            data = await websocket.receive_text()
            # Can be used for typing indicators or heartbeat
    except WebSocketDisconnect:
        ws_manager.disconnect_case(case_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in case {case_id}: {e}")
        ws_manager.disconnect_case(case_id, websocket)


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = Query(...)):
    """Personal WebSocket stream for live in-app alerts and notifications."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    uid = int(user_id)
    await ws_manager.connect_user(uid, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_user(uid, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {uid}: {e}")
        ws_manager.disconnect_user(uid, websocket)

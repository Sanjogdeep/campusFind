from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.lost_items import router as lost_router
from app.api.v1.found_items import router as found_router
from app.api.v1.matches import router as match_router
from app.api.v1.cases import router as case_router
from app.api.v1.meetings import router as meeting_router
from app.api.v1.handover import router as handover_router
from app.api.v1.chat import router as chat_router
from app.api.v1.disputes import router as dispute_router
from app.api.v1.map import router as map_router
from app.api.v1.notifications import router as notification_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(lost_router)
api_v1_router.include_router(found_router)
api_v1_router.include_router(match_router)
api_v1_router.include_router(case_router)
api_v1_router.include_router(meeting_router)
api_v1_router.include_router(handover_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(dispute_router)
api_v1_router.include_router(map_router)
api_v1_router.include_router(notification_router)
api_v1_router.include_router(admin_router)

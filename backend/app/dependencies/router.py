import logging
from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, User, McpService
from app.database.models import ServiceDependency
from app.auth.dependencies import get_current_user, require_permissions
from app.common.exceptions import NotFoundException, AppException
from app.common.responses import ApiResponse
from app.dependencies.service import topological_sort, detect_cycle

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dependencies"])


# ─── Schemas ────────────────────────────────────────────────────────────────


class DependencyCreate(BaseModel):
    depends_on_id: int
    dependency_type: str = Field(default="runtime", pattern="^(runtime|build|optional)$")
    description: Optional[str] = Field(None, max_length=300)


class DeployOrderRequest(BaseModel):
    service_ids: List[int]


# ─── Per-Service Dependency Endpoints ───────────────────────────────────────


@router.get("/services/{service_id}/dependencies", summary="获取服务依赖列表")
async def list_service_dependencies(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取指定服务的依赖列表"""
    # 验证服务存在
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Service not found")

    result = await db.execute(
        select(ServiceDependency).where(ServiceDependency.service_id == service_id)
    )
    deps = result.scalars().all()

    # 获取被依赖服务的信息
    dep_list = []
    for dep in deps:
        svc_result = await db.execute(select(McpService).where(McpService.id == dep.depends_on_id))
        dep_svc = svc_result.scalar_one_or_none()
        dep_list.append({
            "id": dep.id,
            "depends_on_id": dep.depends_on_id,
            "depends_on_name": dep_svc.name if dep_svc else None,
            "depends_on_status": dep_svc.status.value if dep_svc else None,
            "dependency_type": dep.dependency_type,
            "description": dep.description,
            "created_at": dep.created_at.isoformat() if dep.created_at else None,
        })

    return {"service_id": service_id, "dependencies": dep_list, "total": len(dep_list)}


@router.post("/services/{service_id}/dependencies", response_model=ApiResponse, summary="添加服务依赖")
async def add_service_dependency(
    service_id: int,
    body: DependencyCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    """添加服务依赖关系"""
    # 检查源服务存在
    result = await db.execute(select(McpService).where(McpService.id == service_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Service not found")

    # 检查目标服务存在
    result = await db.execute(select(McpService).where(McpService.id == body.depends_on_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Dependency target service not found")

    # 不能依赖自己
    if service_id == body.depends_on_id:
        raise AppException("A service cannot depend on itself", status_code=400)

    # 检查不重复
    result = await db.execute(
        select(ServiceDependency).where(
            and_(
                ServiceDependency.service_id == service_id,
                ServiceDependency.depends_on_id == body.depends_on_id,
            )
        )
    )
    if result.scalar_one_or_none():
        raise AppException("Dependency already exists", status_code=400)

    # 检查循环依赖
    result = await db.execute(select(ServiceDependency))
    all_deps = result.scalars().all()
    existing_edges = [(d.service_id, d.depends_on_id) for d in all_deps]
    new_edge = (service_id, body.depends_on_id)

    if detect_cycle(existing_edges, new_edge):
        raise AppException("Adding this dependency would create a circular dependency", status_code=400)

    # 创建依赖
    dep = ServiceDependency(
        service_id=service_id,
        depends_on_id=body.depends_on_id,
        dependency_type=body.dependency_type,
        description=body.description,
    )
    db.add(dep)
    await db.commit()
    await db.refresh(dep)

    return ApiResponse(message="Dependency added", data={"id": dep.id})


@router.delete("/services/{service_id}/dependencies/{dep_id}", response_model=ApiResponse, summary="移除服务依赖")
async def remove_service_dependency(
    service_id: int,
    dep_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permissions(["services:write"])),
):
    """移除服务依赖关系"""
    result = await db.execute(
        select(ServiceDependency).where(
            and_(
                ServiceDependency.id == dep_id,
                ServiceDependency.service_id == service_id,
            )
        )
    )
    dep = result.scalar_one_or_none()
    if not dep:
        raise NotFoundException("Dependency not found")

    await db.delete(dep)
    await db.commit()
    return ApiResponse(message="Dependency removed")


# ─── Global Dependency Endpoints ────────────────────────────────────────────


@router.get("/dependencies/graph", summary="全局依赖图")
async def get_dependency_graph(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取全局服务依赖图（nodes + edges）"""
    # 获取所有依赖
    result = await db.execute(select(ServiceDependency))
    deps = result.scalars().all()

    # 获取所有涉及的服务
    service_ids = set()
    for dep in deps:
        service_ids.add(dep.service_id)
        service_ids.add(dep.depends_on_id)

    nodes = []
    if service_ids:
        result = await db.execute(select(McpService).where(McpService.id.in_(service_ids)))
        services = result.scalars().all()
        nodes = [
            {
                "id": svc.id,
                "name": svc.name,
                "slug": svc.slug,
                "status": svc.status.value,
            }
            for svc in services
        ]

    edges = [
        {
            "id": dep.id,
            "source": dep.service_id,
            "target": dep.depends_on_id,
            "type": dep.dependency_type,
        }
        for dep in deps
    ]

    return {"nodes": nodes, "edges": edges}


@router.post("/dependencies/deploy-order", summary="计算部署顺序")
async def get_deploy_order(
    body: DeployOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """根据依赖关系计算部署顺序（拓扑排序）"""
    if not body.service_ids:
        return {"deploy_order": []}

    # 获取这些服务之间的依赖关系
    result = await db.execute(
        select(ServiceDependency).where(
            and_(
                ServiceDependency.service_id.in_(body.service_ids),
                ServiceDependency.depends_on_id.in_(body.service_ids),
            )
        )
    )
    deps = result.scalars().all()
    edges = [(d.service_id, d.depends_on_id) for d in deps]

    try:
        if edges:
            order = topological_sort(edges)
            # 只保留请求的 service_ids 中的节点，按拓扑序排列
            ordered = [sid for sid in order if sid in body.service_ids]
            # 添加没有依赖关系的服务
            remaining = [sid for sid in body.service_ids if sid not in ordered]
            ordered = remaining + ordered
        else:
            ordered = body.service_ids
    except ValueError:
        raise AppException("Circular dependency detected among the specified services", status_code=400)

    # 获取服务名称
    result = await db.execute(select(McpService).where(McpService.id.in_(ordered)))
    services = {svc.id: svc.name for svc in result.scalars().all()}

    deploy_order = [
        {"id": sid, "name": services.get(sid, f"unknown-{sid}")}
        for sid in ordered
    ]

    return {"deploy_order": deploy_order}

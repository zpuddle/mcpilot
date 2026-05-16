from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.database.models import ServiceTemplate, McpService, ServiceCode, ServiceTool, ServiceStatus
from app.auth.dependencies import get_current_user, require_permissions
from app.database.models import User
from app.services.schemas import name_to_slug
from app.common.exceptions import NotFoundException, ConflictException

router = APIRouter(tags=["templates"])


# ─── Schemas ────────────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    category: str = "general"
    icon: str = "code"
    code_template: str = ""
    tools_template: list = []
    resources_template: list = []
    env_vars_template: dict = {}
    dependencies: str = ""


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    code_template: Optional[str] = None
    tools_template: Optional[list] = None
    resources_template: Optional[list] = None
    env_vars_template: Optional[dict] = None
    dependencies: Optional[str] = None


class CreateFromTemplateRequest(BaseModel):
    name: str
    description: str = ""


# ─── Helpers ────────────────────────────────────────────────────────────────

def _template_to_dict(t: ServiceTemplate) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "slug": t.slug,
        "description": t.description,
        "category": t.category,
        "icon": t.icon,
        "code_template": t.code_template,
        "tools_template": t.tools_template,
        "resources_template": t.resources_template,
        "env_vars_template": t.env_vars_template,
        "dependencies": t.dependencies,
        "is_builtin": t.is_builtin,
        "author_id": t.author_id,
        "usage_count": t.usage_count,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


# ─── Routes ─────────────────────────────────────────────────────────────────

@router.get("/templates", summary="模板列表")
async def list_templates(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(ServiceTemplate)
    if category:
        query = query.where(ServiceTemplate.category == category)
    query = query.order_by(ServiceTemplate.usage_count.desc())
    result = await db.execute(query)
    templates = result.scalars().all()
    return [_template_to_dict(t) for t in templates]


@router.get("/templates/{template_id}", summary="模板详情")
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(ServiceTemplate).where(ServiceTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise NotFoundException("Template not found")
    return _template_to_dict(tmpl)


@router.post("/templates", summary="创建自定义模板")
async def create_template(
    req: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["services:write"])),
):
    # Check slug uniqueness
    existing = await db.execute(
        select(ServiceTemplate).where(ServiceTemplate.slug == req.slug)
    )
    if existing.scalar_one_or_none():
        raise ConflictException(f"Template with slug '{req.slug}' already exists")

    tmpl = ServiceTemplate(
        name=req.name,
        slug=req.slug,
        description=req.description,
        category=req.category,
        icon=req.icon,
        code_template=req.code_template,
        tools_template=req.tools_template,
        resources_template=req.resources_template,
        env_vars_template=req.env_vars_template,
        dependencies=req.dependencies,
        is_builtin=False,
        author_id=current_user.id,
    )
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return _template_to_dict(tmpl)


@router.put("/templates/{template_id}", summary="更新模板")
async def update_template(
    template_id: int,
    req: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["services:write"])),
):
    result = await db.execute(
        select(ServiceTemplate).where(ServiceTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise NotFoundException("Template not found")

    # 不允许非管理员修改内置模板
    if tmpl.is_builtin and current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Cannot modify built-in template")

    if req.name is not None:
        tmpl.name = req.name
    if req.description is not None:
        tmpl.description = req.description
    if req.category is not None:
        tmpl.category = req.category
    if req.icon is not None:
        tmpl.icon = req.icon
    if req.code_template is not None:
        tmpl.code_template = req.code_template
    if req.tools_template is not None:
        tmpl.tools_template = req.tools_template
    if req.resources_template is not None:
        tmpl.resources_template = req.resources_template
    if req.env_vars_template is not None:
        tmpl.env_vars_template = req.env_vars_template
    if req.dependencies is not None:
        tmpl.dependencies = req.dependencies

    await db.commit()
    await db.refresh(tmpl)
    return _template_to_dict(tmpl)


@router.delete("/templates/{template_id}", summary="删除模板")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["services:write"])),
):
    result = await db.execute(
        select(ServiceTemplate).where(ServiceTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise NotFoundException("Template not found")

    if tmpl.is_builtin and current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Cannot delete built-in template")

    await db.delete(tmpl)
    await db.commit()
    return {"message": "Template deleted"}


@router.post("/templates/{template_id}/create-service", summary="从模板创建服务")
async def create_from_template(
    template_id: int,
    req: CreateFromTemplateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["services:write"])),
):
    """基于模板一键创建完整服务（含代码、工具配置）"""
    # 1. 获取模板
    result = await db.execute(
        select(ServiceTemplate).where(ServiceTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise NotFoundException("Template not found")

    # 2. 生成 slug 并检查唯一性
    slug = name_to_slug(req.name)
    existing = await db.execute(
        select(McpService).where(McpService.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise ConflictException(f"Service with slug '{slug}' already exists")

    # 3. 创建 McpService
    svc = McpService(
        name=req.name,
        slug=slug,
        description=req.description or tmpl.description,
        owner_id=current_user.id,
        status=ServiceStatus.draft,
        env_vars=tmpl.env_vars_template or {},
        extra_dependencies=tmpl.dependencies or "",
    )
    db.add(svc)
    await db.flush()

    # 4. 创建 ServiceCode（从 code_template）
    code = ServiceCode(service_id=svc.id, code=tmpl.code_template or "")
    db.add(code)

    # 5. 创建 ServiceTool（从 tools_template）
    for tool_data in (tmpl.tools_template or []):
        tool = ServiceTool(
            service_id=svc.id,
            name=tool_data.get("name", ""),
            description=tool_data.get("description", ""),
            handler_name=tool_data.get("handler_name", ""),
            input_schema=tool_data.get("input_schema", {}),
            output_schema=tool_data.get("output_schema", {}),
            is_enabled=True,
        )
        db.add(tool)

    # 6. 增加 usage_count
    tmpl.usage_count = (tmpl.usage_count or 0) + 1

    await db.commit()
    await db.refresh(svc)

    # 7. 返回新服务信息
    return {
        "id": svc.id,
        "name": svc.name,
        "slug": svc.slug,
        "description": svc.description,
        "status": svc.status.value if svc.status else "draft",
        "owner_id": svc.owner_id,
        "created_at": svc.created_at.isoformat() if svc.created_at else None,
        "template_name": tmpl.name,
    }

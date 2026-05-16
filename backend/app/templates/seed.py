import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import ServiceTemplate

logger = logging.getLogger(__name__)

BUILTIN_TEMPLATES = [
    {
        "name": "HTTP API Proxy",
        "slug": "http-api-proxy",
        "description": "转发 HTTP API 请求的通用代理模板，支持 GET/POST 请求转发、请求头自定义和响应格式化",
        "category": "api",
        "icon": "cloud",
        "dependencies": "httpx",
        "code_template": '''import httpx

async def proxy_request(url: str, method: str = "GET", headers: dict = None, body: dict = None) -> dict:
    """转发 HTTP API 请求"""
    async with httpx.AsyncClient(timeout=30) as client:
        if method.upper() == "GET":
            resp = await client.get(url, headers=headers)
        else:
            resp = await client.post(url, headers=headers, json=body)
        return {
            "status_code": resp.status_code,
            "headers": dict(resp.headers),
            "body": resp.text,
        }
''',
        "tools_template": [
            {
                "name": "proxy_request",
                "description": "转发 HTTP API 请求到目标 URL",
                "handler_name": "proxy_request",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "目标 URL"},
                        "method": {"type": "string", "enum": ["GET", "POST"], "default": "GET"},
                        "headers": {"type": "object", "description": "自定义请求头"},
                        "body": {"type": "object", "description": "POST 请求体"},
                    },
                    "required": ["url"],
                },
            }
        ],
    },
    {
        "name": "Database Query",
        "slug": "database-query",
        "description": "连接数据库执行 SQL 查询的模板，支持 PostgreSQL/MySQL，内含参数化查询防注入",
        "category": "database",
        "icon": "database",
        "dependencies": "asyncpg\nsqlalchemy[asyncio]",
        "code_template": '''from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"
engine = create_async_engine(DATABASE_URL)

async def execute_query(sql: str, params: dict = None) -> dict:
    """执行 SQL 查询并返回结果"""
    async with engine.connect() as conn:
        result = await conn.execute(text(sql), params or {})
        if result.returns_rows:
            rows = [dict(row._mapping) for row in result.fetchall()]
            return {"rows": rows, "count": len(rows)}
        return {"affected_rows": result.rowcount}
''',
        "tools_template": [
            {
                "name": "execute_query",
                "description": "执行 SQL 查询语句",
                "handler_name": "execute_query",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "sql": {"type": "string", "description": "SQL 查询语句"},
                        "params": {"type": "object", "description": "查询参数"},
                    },
                    "required": ["sql"],
                },
            }
        ],
    },
    {
        "name": "File Processor",
        "slug": "file-processor",
        "description": "文件内容读取和处理模板，支持文本文件读取、CSV 解析和 JSON 处理",
        "category": "utility",
        "icon": "file-text",
        "dependencies": "",
        "code_template": '''import json
import csv
import io

async def read_file(file_path: str, encoding: str = "utf-8") -> dict:
    """读取文件内容"""
    with open(file_path, "r", encoding=encoding) as f:
        content = f.read()
    return {"content": content, "length": len(content)}

async def parse_csv(csv_text: str) -> dict:
    """解析 CSV 文本"""
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    return {"rows": rows, "count": len(rows), "headers": reader.fieldnames or []}

async def parse_json(json_text: str) -> dict:
    """解析 JSON 文本"""
    data = json.loads(json_text)
    return {"data": data}
''',
        "tools_template": [
            {
                "name": "read_file",
                "description": "读取文件内容",
                "handler_name": "read_file",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string", "description": "文件路径"},
                        "encoding": {"type": "string", "default": "utf-8"},
                    },
                    "required": ["file_path"],
                },
            },
            {
                "name": "parse_csv",
                "description": "解析 CSV 文本数据",
                "handler_name": "parse_csv",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "csv_text": {"type": "string", "description": "CSV 文本"},
                    },
                    "required": ["csv_text"],
                },
            },
            {
                "name": "parse_json",
                "description": "解析 JSON 文本数据",
                "handler_name": "parse_json",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "json_text": {"type": "string", "description": "JSON 文本"},
                    },
                    "required": ["json_text"],
                },
            },
        ],
    },
    {
        "name": "AI Assistant",
        "slug": "ai-assistant",
        "description": "调用 LLM API 进行文本处理的模板，支持 OpenAI 兼容接口，可用于文本摘要、翻译、分析等",
        "category": "ai",
        "icon": "brain",
        "dependencies": "httpx",
        "code_template": '''import httpx

API_BASE = "https://api.openai.com/v1"
API_KEY = "your-api-key"

async def chat_completion(prompt: str, model: str = "gpt-3.5-turbo", temperature: float = 0.7) -> dict:
    """调用 LLM 完成对话"""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{API_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "content": data["choices"][0]["message"]["content"],
            "model": data["model"],
            "usage": data.get("usage", {}),
        }

async def summarize_text(text: str, max_length: int = 200) -> dict:
    """文本摘要"""
    prompt = f"请用不超过{max_length}字总结以下内容：\\n\\n{text}"
    return await chat_completion(prompt, temperature=0.3)
''',
        "tools_template": [
            {
                "name": "chat_completion",
                "description": "调用 LLM 完成对话",
                "handler_name": "chat_completion",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "用户提示词"},
                        "model": {"type": "string", "default": "gpt-3.5-turbo"},
                        "temperature": {"type": "number", "default": 0.7},
                    },
                    "required": ["prompt"],
                },
            },
            {
                "name": "summarize_text",
                "description": "文本摘要",
                "handler_name": "summarize_text",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "待摘要文本"},
                        "max_length": {"type": "integer", "default": 200},
                    },
                    "required": ["text"],
                },
            },
        ],
    },
    {
        "name": "Web Scraper",
        "slug": "web-scraper",
        "description": "网页内容抓取模板，支持 HTML 页面抓取、文本提取和链接解析",
        "category": "utility",
        "icon": "globe",
        "dependencies": "httpx\nbeautifulsoup4",
        "code_template": '''import httpx
from bs4 import BeautifulSoup

async def scrape_page(url: str, selector: str = None) -> dict:
    """抓取网页内容"""
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url, headers={"User-Agent": "MCPilot-Scraper/1.0"})
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    if selector:
        elements = soup.select(selector)
        texts = [el.get_text(strip=True) for el in elements]
        return {"texts": texts, "count": len(texts)}

    # 提取纯文本
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(separator="\\n", strip=True)
    return {"text": text, "title": soup.title.string if soup.title else ""}

async def extract_links(url: str) -> dict:
    """提取页面所有链接"""
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url, headers={"User-Agent": "MCPilot-Scraper/1.0"})
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        links.append({"text": a.get_text(strip=True), "href": a["href"]})
    return {"links": links, "count": len(links)}
''',
        "tools_template": [
            {
                "name": "scrape_page",
                "description": "抓取网页内容",
                "handler_name": "scrape_page",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "目标网页 URL"},
                        "selector": {"type": "string", "description": "CSS 选择器（可选）"},
                    },
                    "required": ["url"],
                },
            },
            {
                "name": "extract_links",
                "description": "提取页面所有链接",
                "handler_name": "extract_links",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "目标网页 URL"},
                    },
                    "required": ["url"],
                },
            },
        ],
    },
]


async def seed_templates(db: AsyncSession):
    """如果 templates 表为空则插入内置模板"""
    result = await db.execute(select(func.count(ServiceTemplate.id)))
    count = result.scalar() or 0
    if count > 0:
        logger.info(f"Templates table already has {count} records, skipping seed")
        return

    for tmpl_data in BUILTIN_TEMPLATES:
        tmpl = ServiceTemplate(
            name=tmpl_data["name"],
            slug=tmpl_data["slug"],
            description=tmpl_data["description"],
            category=tmpl_data["category"],
            icon=tmpl_data["icon"],
            code_template=tmpl_data["code_template"],
            tools_template=tmpl_data["tools_template"],
            dependencies=tmpl_data.get("dependencies", ""),
            is_builtin=True,
        )
        db.add(tmpl)

    await db.commit()
    logger.info(f"Seeded {len(BUILTIN_TEMPLATES)} built-in templates")

import ast
from typing import List, Tuple


DANGEROUS_MODULES = [
    "os", "subprocess", "shutil", "sys", "importlib",
    "ctypes", "socket", "signal", "multiprocessing",
]

DANGEROUS_FUNCTIONS = [
    "eval", "exec", "compile", "__import__",
    "globals", "locals", "getattr", "setattr", "delattr",
]


def validate_code(code: str) -> Tuple[bool, List[str], List[str]]:
    """Validate user code for syntax errors and dangerous patterns.

    Returns (valid, errors, warnings).
    """
    errors: List[str] = []
    warnings: List[str] = []

    # Syntax check
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        errors.append(f"Syntax error at line {e.lineno}: {e.msg}")
        return False, errors, warnings

    # Walk AST for dangerous patterns
    for node in ast.walk(tree):
        # Check imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_root = alias.name.split(".")[0]
                if module_root in DANGEROUS_MODULES:
                    warnings.append(
                        f"Line {node.lineno}: Import of '{alias.name}' may be restricted in production"
                    )
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                module_root = node.module.split(".")[0]
                if module_root in DANGEROUS_MODULES:
                    warnings.append(
                        f"Line {node.lineno}: Import from '{node.module}' may be restricted in production"
                    )

        # Check dangerous function calls
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in DANGEROUS_FUNCTIONS:
                    warnings.append(
                        f"Line {node.lineno}: Use of '{node.func.id}()' is potentially dangerous"
                    )
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr in ["system", "popen", "exec", "run"]:
                    warnings.append(
                        f"Line {node.lineno}: Use of '.{node.func.attr}()' is potentially dangerous"
                    )

    return len(errors) == 0, errors, warnings

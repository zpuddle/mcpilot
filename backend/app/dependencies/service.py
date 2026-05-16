from collections import defaultdict, deque
from typing import List, Tuple


def topological_sort(edges: List[Tuple[int, int]]) -> List[int]:
    """
    拓扑排序。edges = [(service_id, depends_on_id), ...]
    返回部署顺序（被依赖的在前）
    如果有循环依赖则抛出 ValueError
    """
    graph = defaultdict(list)
    in_degree = defaultdict(int)
    nodes = set()

    for src, dst in edges:
        graph[dst].append(src)  # dst 被 src 依赖
        in_degree[src] += 1
        nodes.add(src)
        nodes.add(dst)

    # 初始化入度为 0 的节点
    for node in nodes:
        if node not in in_degree:
            in_degree[node] = 0

    queue = deque([n for n in nodes if in_degree[n] == 0])
    result = []

    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(result) != len(nodes):
        raise ValueError("Circular dependency detected")

    return result


def detect_cycle(edges: List[Tuple[int, int]], new_edge: Tuple[int, int]) -> bool:
    """检测添加新边是否会产生循环"""
    all_edges = edges + [new_edge]
    try:
        topological_sort(all_edges)
        return False
    except ValueError:
        return True

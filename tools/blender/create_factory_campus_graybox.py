"""Generate the editable factory-campus graybox and its web GLB export."""

from __future__ import annotations

import argparse
import array
import hashlib
import math
import os
import re
import sys

import bmesh
import bpy
from mathutils import Vector


PLAN_SCALE = math.sqrt(2.0)


CANOPY_PROFILES = {
    "broadleaf": (
        (-0.42, -0.10, -0.10, 0.72, 0.62, 0.72),
        (0.40, -0.14, -0.06, 0.70, 0.60, 0.76),
        (-0.18, 0.36, 0.00, 0.68, 0.62, 0.78),
        (0.22, 0.33, 0.06, 0.68, 0.60, 0.74),
        (0.00, 0.02, 0.38, 0.64, 0.58, 0.72),
        (-0.02, -0.02, -0.34, 0.82, 0.72, 0.60),
        (-0.52, 0.18, 0.12, 0.46, 0.44, 0.56),
        (0.50, 0.16, 0.18, 0.48, 0.42, 0.54),
    ),
    "spreading": (
        (-0.58, -0.08, -0.12, 0.72, 0.54, 0.58),
        (0.58, -0.05, -0.08, 0.70, 0.52, 0.60),
        (-0.34, 0.34, 0.02, 0.66, 0.50, 0.58),
        (0.34, 0.34, 0.04, 0.64, 0.48, 0.58),
        (0.00, 0.04, 0.28, 0.74, 0.56, 0.60),
        (0.00, -0.12, -0.30, 0.92, 0.66, 0.48),
        (-0.72, 0.16, 0.04, 0.40, 0.38, 0.46),
        (0.72, 0.12, 0.06, 0.40, 0.36, 0.44),
    ),
    "columnar": (
        (-0.22, -0.10, -0.34, 0.48, 0.44, 0.72),
        (0.22, -0.06, -0.28, 0.46, 0.42, 0.74),
        (-0.18, 0.16, 0.06, 0.50, 0.44, 0.78),
        (0.18, 0.14, 0.12, 0.48, 0.42, 0.76),
        (0.00, -0.02, 0.48, 0.44, 0.40, 0.72),
        (0.00, 0.00, 0.82, 0.34, 0.32, 0.54),
        (-0.30, 0.02, 0.34, 0.36, 0.34, 0.56),
        (0.30, 0.02, 0.30, 0.36, 0.34, 0.58),
    ),
    "ornamental": (
        (-0.34, -0.18, -0.12, 0.58, 0.52, 0.62),
        (0.34, -0.15, -0.10, 0.56, 0.50, 0.64),
        (-0.28, 0.24, 0.00, 0.54, 0.50, 0.62),
        (0.28, 0.26, 0.04, 0.54, 0.48, 0.62),
        (0.00, 0.00, 0.34, 0.56, 0.50, 0.62),
        (0.00, 0.00, -0.30, 0.70, 0.62, 0.52),
        (-0.46, 0.08, 0.16, 0.38, 0.36, 0.44),
        (0.46, 0.08, 0.14, 0.38, 0.34, 0.46),
    ),
    "woodland": (
        (-0.44, -0.26, -0.18, 0.68, 0.58, 0.70),
        (0.38, -0.24, -0.06, 0.62, 0.58, 0.74),
        (-0.38, 0.28, 0.02, 0.64, 0.56, 0.72),
        (0.36, 0.32, 0.16, 0.62, 0.54, 0.70),
        (-0.10, 0.00, 0.42, 0.62, 0.56, 0.74),
        (0.08, -0.04, -0.36, 0.80, 0.70, 0.56),
        (-0.58, 0.02, 0.26, 0.42, 0.40, 0.50),
        (0.56, 0.06, 0.28, 0.42, 0.38, 0.48),
    ),
    "conifer": (
        (0.00, 0.00, -0.52, 0.82, 0.82, 0.36),
        (0.00, 0.00, -0.18, 0.70, 0.70, 0.34),
        (0.00, 0.00, 0.14, 0.58, 0.58, 0.32),
        (0.00, 0.00, 0.42, 0.46, 0.46, 0.30),
        (0.00, 0.00, 0.68, 0.32, 0.32, 0.28),
        (-0.22, 0.05, -0.30, 0.46, 0.42, 0.26),
        (0.22, -0.04, -0.02, 0.38, 0.36, 0.24),
        (-0.14, 0.10, 0.30, 0.30, 0.28, 0.22),
    ),
}
CANOPY_PROFILE_NAMES = tuple(CANOPY_PROFILES)


BUILDINGS = [
    ("main-production-hall", (12.0, 0.5), (16.8, 7.0, 3.8), "factory"),
    ("central-processing-hall", (-2.5, -5.9), (12.9, 5.1, 3.45), "factory"),
    ("rear-high-bay", (0.0, -13.0), (10.7, 4.5, 5.7), "factory"),
    ("north-east-workshop", (-11.5, -12.5), (5.9, 3.4, 3.1), "factory"),
    ("east-process-hall", (-14.0, -5.0), (6.7, 4.1, 3.35), "factory"),
    ("far-east-utility", (-22.0, 3.2), (3.6, 2.7, 2.3), "factory"),
    ("east-warehouse", (-14.0, 2.2), (7.9, 4.5, 3.0), "factory"),
    ("front-warehouse", (-3.0, 10.0), (8.1, 3.4, 3.2), "factory"),
    ("front-utility-annex", (-12.2, 10.5), (8.1, 2.25, 2.0), "factory"),
    ("laboratory", (-22.5, 10.5), (8.1, 2.0, 4.1), "office"),
    ("administration", (9.5, 11.3), (8.4, 5.4, 6.2), "administration"),
    ("gatehouse", (23.2, 14.7), (2.3, 1.7, 2.0), "office"),
]

BUILDING_IDENTITY_PROFILES = {
    "main-production-hall": ("production-monitor", "production", "hero"),
    "central-processing-hall": ("production-monitor", "production", "primary"),
    "rear-high-bay": ("production-monitor", "production", "primary"),
    "north-east-workshop": ("production-monitor", "production", "supporting"),
    "east-process-hall": ("utility-process", "process", "primary"),
    "far-east-utility": ("utility-process", "utilities", "primary"),
    "east-warehouse": ("warehouse-logistics", "warehouse", "primary"),
    "front-warehouse": ("warehouse-logistics", "warehouse", "primary"),
    "front-utility-annex": ("utility-process", "utilities", "supporting"),
    "laboratory": ("laboratory-analysis", "laboratory", "primary"),
    "administration": ("administration-arrival", "administration", "hero"),
    "gatehouse": ("access-control", "access", "supporting"),
}

BUILDING_FLOORS = {
    "main-production-hall": [
        ("L01", "一层生产作业区", "主生产线与物流通道", 1, "cyan"),
        ("L02", "二层设备夹层", "机电设备与检修平台", 2, "orange"),
        ("RF", "屋面设备层", "通风、采光与排烟设施", 3, "orange"),
    ],
    "central-processing-hall": [
        ("L01", "一层连续生产区", "连续化工艺生产空间", 1, "cyan"),
        ("L02", "二层管线夹层", "工艺管线与巡检通道", 2, "orange"),
        ("RF", "屋面设备层", "通风与环保处理设备", 3, "orange"),
    ],
    "rear-high-bay": [
        ("L01", "一层高跨作业区", "大型设备与吊装作业", 1, "cyan"),
        ("L02", "二层检修平台", "设备检修与观察平台", 2, "orange"),
        ("RF", "屋面设备层", "高跨排风与采光设施", 3, "orange"),
    ],
    "north-east-workshop": [
        ("L01", "一层辅助生产区", "辅助生产与物料周转", 1, "cyan"),
        ("RF", "屋面设备层", "通风与屋面检修空间", 2, "orange"),
    ],
    "east-process-hall": [
        ("L01", "一层工艺作业区", "工艺设备与操作岗位", 1, "cyan"),
        ("L02", "二层管线夹层", "公用管线与仪表桥架", 2, "orange"),
        ("RF", "屋面设备层", "排风与维护空间", 3, "orange"),
    ],
    "far-east-utility": [
        ("L01", "一层公用工程区", "动力与公用工程设备", 1, "cyan"),
        ("RF", "屋面设备平台", "室外机组与检修平台", 2, "orange"),
    ],
    "east-warehouse": [
        ("L01", "一层成品仓储区", "成品存储与出入库作业", 1, "cyan"),
        ("L02", "二层货架夹层", "轻型物料与盘点通道", 2, "cyan"),
        ("RF", "屋面设备层", "消防排烟与采光设施", 3, "orange"),
    ],
    "front-warehouse": [
        ("L01", "一层原料仓储区", "原料存储与收发作业", 1, "cyan"),
        ("L02", "二层货架夹层", "辅料存储与盘点通道", 2, "cyan"),
        ("RF", "屋面设备层", "消防排烟与采光设施", 3, "orange"),
    ],
    "front-utility-annex": [
        ("L01", "一层辅助设备区", "公用辅助设备与配电", 1, "cyan"),
        ("RF", "屋面维护层", "设备维护与通风空间", 2, "orange"),
    ],
    "laboratory": [
        ("L01", "一层样品处理区", "收样、制样与留样空间", 1, "cyan"),
        ("L02", "二层分析实验区", "仪器分析与质量检测", 2, "cyan"),
        ("RF", "屋面设备层", "实验排风与净化设备", 3, "orange"),
    ],
    "administration": [
        ("L01", "一层接待服务区", "园区接待与综合服务", 1, "cyan"),
        ("L02", "二层综合办公区", "行政办公与协同空间", 2, "cyan"),
        ("L03", "三层会议指挥区", "会议、调度与应急指挥", 3, "cyan"),
    ],
    "gatehouse": [
        ("L01", "一层门岗值守区", "人员车辆核验与值守", 1, "cyan"),
        ("RF", "屋面设备层", "门禁通信与维护设备", 2, "orange"),
    ],
}


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend-output", required=True)
    parser.add_argument("--glb-output", required=True)
    return parser.parse_args(args)


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def remove_object_tree(obj) -> None:
    for child in list(obj.children):
        remove_object_tree(child)
    bpy.data.objects.remove(obj, do_unlink=True)


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    transmission: float = 0.0,
    ior: float = 1.45,
    coat_weight: float = 0.0,
    emission_color: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
):
    value = bpy.data.materials.new(name)
    value.diffuse_color = color
    value.use_nodes = True
    shader = next(node for node in value.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = color
    alpha_socket = shader.inputs.get("Alpha")
    if alpha_socket is not None:
        alpha_socket.default_value = color[3]
    if color[3] < 1.0:
        value.surface_render_method = "DITHERED"
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    for socket_name, socket_value in (
        ("Transmission Weight", transmission),
        ("IOR", ior),
        ("Coat Weight", coat_weight),
    ):
        socket = shader.inputs.get(socket_name)
        if socket is not None:
            socket.default_value = socket_value
    if emission_color is not None:
        emission_socket = shader.inputs.get("Emission Color")
        strength_socket = shader.inputs.get("Emission Strength")
        if emission_socket is not None:
            emission_socket.default_value = emission_color
        if strength_socket is not None:
            strength_socket.default_value = emission_strength
    return value


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _surface_height(u: float, v: float, seed: int) -> float:
    """Return a deterministic, tileable micro-height field for generated PBR maps."""
    phase = seed * 0.173
    broad = math.sin((u * 3.0 + phase) * math.tau) * math.cos((v * 4.0 - phase) * math.tau)
    grain = math.sin((u * 17.0 + v * 11.0 + phase) * math.tau)
    fleck = math.cos((u * 29.0 - v * 23.0 - phase) * math.tau)
    return broad * 0.50 + grain * 0.32 + fleck * 0.18


def generated_pbr_image(
    family: str,
    channel: str,
    base_color: tuple[float, float, float],
    roughness: float,
    seed: int,
    size: int = 256,
):
    image = bpy.data.images.new(
        f"PBR__{family}__{channel}",
        width=size,
        height=size,
        alpha=True,
    )
    if channel in {"normal", "roughness"}:
        image.colorspace_settings.name = "Non-Color"
    pixels = []
    step = 1.0 / size
    for y in range(size):
        v = y * step
        for x in range(size):
            u = x * step
            height = _surface_height(u, v, seed)
            if channel == "base-color":
                shade = 0.92 + height * 0.105
                pixels.extend((*(_clamp(component * shade) for component in base_color), 1.0))
            elif channel == "roughness":
                value = _clamp(roughness + height * 0.055)
                pixels.extend((value, value, value, 1.0))
            else:
                dx = _surface_height((u + step) % 1.0, v, seed) - height
                dy = _surface_height(u, (v + step) % 1.0, seed) - height
                pixels.extend((_clamp(0.5 - dx * 0.72), _clamp(0.5 - dy * 0.72), 1.0, 1.0))
    image.pixels.foreach_set(pixels)
    image.update()
    image["pbrChannel"] = channel
    image["pbrFamily"] = family
    image.pack()
    return image


def apply_generated_pbr(
    mat,
    family: str,
    base_color: tuple[float, float, float],
    roughness: float,
    seed: int,
) -> None:
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = next(node for node in nodes if node.type == "BSDF_PRINCIPLED")
    channels = {
        channel: generated_pbr_image(family, channel, base_color, roughness, seed)
        for channel in ("base-color", "normal", "roughness")
    }
    base_node = nodes.new("ShaderNodeTexImage")
    base_node.name = f"PBR__{family}__base-color"
    base_node.image = channels["base-color"]
    base_node.extension = "REPEAT"
    base_node.location = (-620, 160)
    links.new(base_node.outputs["Color"], shader.inputs["Base Color"])

    roughness_node = nodes.new("ShaderNodeTexImage")
    roughness_node.name = f"PBR__{family}__roughness"
    roughness_node.image = channels["roughness"]
    roughness_node.extension = "REPEAT"
    roughness_node.location = (-620, -20)
    links.new(roughness_node.outputs["Color"], shader.inputs["Roughness"])

    normal_node = nodes.new("ShaderNodeTexImage")
    normal_node.name = f"PBR__{family}__normal"
    normal_node.image = channels["normal"]
    normal_node.extension = "REPEAT"
    normal_node.location = (-620, -210)
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.name = f"PBR__{family}__normal-map"
    normal_map.inputs["Strength"].default_value = 0.34
    normal_map.location = (-350, -190)
    links.new(normal_node.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])
    mat["pbrFamily"] = family


def configure_ground_pbr_materials(mats) -> None:
    specs = (
        ("asphalt", "asphalt", (0.075, 0.085, 0.092), 0.93, 11, "new-asphalt", 4.6),
        ("aged_asphalt", "aged-asphalt", (0.105, 0.105, 0.098), 0.95, 17, "aged-asphalt", 4.8),
        ("concrete", "concrete", (0.54, 0.56, 0.55), 0.86, 23),
        ("loading_concrete", "loading-concrete", (0.46, 0.47, 0.45), 0.90, 29, "loading-concrete", 4.2),
        ("paving", "entry-paving", (0.58, 0.55, 0.49), 0.82, 31, "entry-paving", 3.4),
        ("parking_surface", "parking-surface", (0.105, 0.115, 0.118), 0.92, 37, "parking-surface", 4.6),
        ("walkway", "walkway", (0.60, 0.61, 0.58), 0.88, 41, "walkway", 3.2),
        ("lawn", "lawn", (0.08, 0.20, 0.10), 0.95, 43, "lawn", 4.8),
        ("bioswale_soil", "bioswale-soil", (0.105, 0.075, 0.045), 0.96, 59, "bare-soil", 3.6),
        ("planting_mulch", "planting-mulch", (0.115, 0.068, 0.038), 0.97, 67, "mulch", 3.2),
        ("forest_ground", "forest-ground", (0.10, 0.25, 0.11), 0.96, 71, "forest-floor", 5.0),
    )
    for spec in specs:
        key, family, color, roughness, seed, *ground_contract = spec
        if key not in mats:
            continue
        apply_generated_pbr(mats[key], family, color, roughness, seed)
        for node in mats[key].node_tree.nodes:
            if node.type == "NORMAL_MAP":
                node.inputs["Strength"].default_value = 0.10
        if ground_contract:
            role, tile_size = ground_contract
            mats[key]["groundMaterialRole"] = role
            mats[key]["groundTileSize"] = tile_size


def configure_vegetation_pbr_materials(mats) -> None:
    specs = (
        ("trunk", "tree-bark", (0.145, 0.082, 0.040), 0.96, 79, None),
        ("foliage", "foliage-deep", (0.040, 0.175, 0.065), 0.94, 83, "deep"),
        ("foliage_light", "foliage-mid", (0.075, 0.255, 0.095), 0.92, 89, "mid"),
        ("foliage_sunlit", "foliage-sunlit", (0.155, 0.335, 0.105), 0.90, 93, "sunlit"),
        ("foliage_warm", "foliage-warm", (0.185, 0.265, 0.065), 0.93, 97, "warm"),
        ("forest_foliage", "forest-foliage", (0.052, 0.215, 0.075), 0.95, 101, "forest-deep"),
        ("forest_foliage_light", "forest-foliage-light", (0.105, 0.305, 0.105), 0.93, 103, "forest-light"),
    )
    for key, family, color, roughness, seed, layer in specs:
        apply_generated_pbr(mats[key], family, color, roughness, seed)
        mats[key].use_backface_culling = False
        if layer:
            mats[key]["vegetationPbrLayer"] = layer


ARCHITECTURAL_PBR_FAMILIES = {
    "industrial-coated-metal": (
        "coated-metal",
        ("factory_wall", "factory_panel_light", "factory_panel_mid", "process_wall", "process_panel_light", "process_panel_mid", "utility_wall", "utility_panel_light", "utility_panel_mid", "laboratory_wall", "laboratory_panel_light", "laboratory_panel_mid"),
        0.65,
        0.05,
        0.08,
        131,
    ),
    "warehouse-sandwich-panel": (
        "warehouse-panel",
        ("warehouse_wall", "warehouse_panel_light", "warehouse_panel_mid"),
        0.72,
        0.03,
        0.09,
        149,
    ),
    "administration-limestone": (
        "limestone",
        ("admin_wall", "admin_stone_light", "admin_stone_dark"),
        0.78,
        0.0,
        0.10,
        167,
    ),
    "architectural-concrete": (
        "concrete",
        ("plinth", "curb", "sidewalk"),
        0.82,
        0.0,
        0.11,
        181,
    ),
    "galvanized-roof": (
        "galvanized",
        ("roof", "roof_rib", "gutter", "corner_flashing"),
        0.62,
        0.10,
        0.10,
        199,
    ),
}


def _architectural_height(u: float, v: float, seed: int, pattern: str) -> float:
    phase = seed * 0.071
    # Keep authored variation below the dashboard camera's minification limit.
    # Physical cladding joints carry the close-range detail, so a broad texture
    # field reads as material variation without producing moving interference.
    grain = math.sin((u * 3.0 + v * 2.0 + phase) * math.tau) * 0.035
    macro = math.sin((u + phase) * math.tau) * math.cos((v * 2.0 - phase) * math.tau) * 0.35
    if pattern == "coated-metal":
        return macro + math.sin((u * 2.0 + phase) * math.tau) * 0.10 + math.cos((v * 2.0 - phase) * math.tau) * 0.035 + grain
    if pattern == "warehouse-panel":
        return macro + math.sin((u * 2.0 + phase) * math.tau) * 0.09 + math.cos((v + phase) * math.tau) * 0.05 + grain * 0.62
    if pattern == "limestone":
        cloud = math.sin((u * 2.0 + phase) * math.tau) * math.cos((v * 2.0 - phase) * math.tau)
        vein = math.sin((u * 2.0 + v + phase) * math.tau)
        return macro * 0.72 + cloud * 0.40 + vein * 0.10 + grain * 0.40
    if pattern == "concrete":
        cloud = math.sin((u * 2.0 + phase) * math.tau) * math.cos((v * 2.0 - phase) * math.tau)
        pores = abs(math.sin((u * 4.0 + phase) * math.tau) * math.cos((v * 3.0 - phase) * math.tau)) ** 7
        return macro * 0.68 + cloud * 0.31 + grain * 0.48 - pores * 0.20
    brushed = math.sin((u * 3.0 + phase) * math.tau) * 0.10 + math.sin((u * 5.0 - phase) * math.tau) * 0.035
    return macro * 0.42 + brushed + math.cos((v * 2.0 + phase) * math.tau) * 0.06 + grain * 0.30


def generated_architectural_image(
    family: str,
    variant: str,
    channel: str,
    base_color: tuple[float, float, float],
    roughness: float,
    seed: int,
    pattern: str,
    size: int = 256,
):
    suffix = variant if channel == "base-color" else "shared"
    image = bpy.data.images.new(
        f"PBR__architectural__{family}__{suffix}__{channel}",
        width=size,
        height=size,
        alpha=True,
    )
    if channel in {"normal", "roughness", "occlusion"}:
        image.colorspace_settings.name = "Non-Color"
    pixels = []
    step = 1.0 / size
    for y in range(size):
        v = y * step
        for x in range(size):
            u = x * step
            height = _architectural_height(u, v, seed, pattern)
            if channel == "base-color":
                amplitude = {
                    "coated-metal": 0.10,
                    "warehouse-panel": 0.11,
                    "limestone": 0.09,
                    "concrete": 0.09,
                    "galvanized": 0.07,
                }[pattern]
                bounded_height = max(-0.75, min(0.75, height))
                shade = 0.985 + bounded_height * amplitude
                temperature = math.sin((u * 2.0 + v + seed * 0.031) * math.tau) * 0.014
                pixels.extend((
                    _clamp(base_color[0] * shade + temperature),
                    _clamp(base_color[1] * shade + temperature * 0.35),
                    _clamp(base_color[2] * shade - temperature * 0.45),
                    1.0,
                ))
            elif channel == "roughness":
                value = _clamp(roughness + height * (0.065 if pattern == "galvanized" else 0.11))
                pixels.extend((value, value, value, 1.0))
            elif channel == "occlusion":
                value = _clamp(0.94 + min(0.0, height) * 0.14)
                pixels.extend((value, value, value, 1.0))
            else:
                dx = _architectural_height((u + step) % 1.0, v, seed, pattern) - height
                dy = _architectural_height(u, (v + step) % 1.0, seed, pattern) - height
                strength = 0.56 if pattern in {"limestone", "concrete"} else 0.38
                pixels.extend((_clamp(0.5 - dx * strength), _clamp(0.5 - dy * strength), 1.0, 1.0))
    image.pixels.foreach_set(pixels)
    image.update()
    image["pbrChannel"] = channel
    image["pbrFamily"] = family
    image["architecturalPbr"] = True
    image.pack()
    return image


def ensure_gltf_material_output_group():
    group = bpy.data.node_groups.get("glTF Material Output")
    if group is not None:
        return group
    group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    group.interface.new_socket("Occlusion", socket_type="NodeSocketFloat")
    group.nodes.new("NodeGroupInput")
    group.nodes.new("NodeGroupOutput")
    return group


def apply_architectural_pbr(
    mat,
    family: str,
    variant: str,
    base_image,
    shared_images,
    roughness: float,
    metallic: float,
    normal_strength: float,
) -> None:
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = next(node for node in nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic

    base_node = nodes.new("ShaderNodeTexImage")
    base_node.name = f"PBR__{family}__{variant}__base-color"
    base_node.image = base_image
    base_node.extension = "REPEAT"
    base_node.location = (-760, 220)
    links.new(base_node.outputs["Color"], shader.inputs["Base Color"])

    roughness_node = nodes.new("ShaderNodeTexImage")
    roughness_node.name = f"PBR__{family}__roughness"
    roughness_node.image = shared_images["roughness"]
    roughness_node.extension = "REPEAT"
    roughness_node.location = (-760, 20)
    links.new(roughness_node.outputs["Color"], shader.inputs["Roughness"])

    normal_node = nodes.new("ShaderNodeTexImage")
    normal_node.name = f"PBR__{family}__normal"
    normal_node.image = shared_images["normal"]
    normal_node.extension = "REPEAT"
    normal_node.location = (-760, -180)
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.name = f"PBR__{family}__normal-map"
    normal_map.inputs["Strength"].default_value = normal_strength
    normal_map.location = (-460, -160)
    links.new(normal_node.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])

    occlusion_node = nodes.new("ShaderNodeTexImage")
    occlusion_node.name = f"PBR__{family}__occlusion"
    occlusion_node.image = shared_images["occlusion"]
    occlusion_node.extension = "REPEAT"
    occlusion_node.location = (-760, -390)
    separate = nodes.new("ShaderNodeSeparateColor")
    separate.name = f"PBR__{family}__occlusion-red"
    separate.location = (-480, -390)
    settings = nodes.new("ShaderNodeGroup")
    settings.name = f"PBR__{family}__gltf-output"
    settings.node_tree = ensure_gltf_material_output_group()
    settings.location = (-220, -390)
    links.new(occlusion_node.outputs["Color"], separate.inputs["Color"])
    links.new(separate.outputs["Red"], settings.inputs["Occlusion"])
    mat["architecturalPbrFamily"] = family
    mat["architecturalPbrVariant"] = variant


def configure_architectural_pbr_materials(mats) -> None:
    for family, (pattern, keys, roughness, metallic, normal_strength, seed) in ARCHITECTURAL_PBR_FAMILIES.items():
        shared_images = {
            channel: generated_architectural_image(
                family,
                "shared",
                channel,
                (0.5, 0.5, 0.5),
                roughness,
                seed,
                pattern,
            )
            for channel in ("normal", "roughness", "occlusion")
        }
        for variant_index, key in enumerate(keys):
            mat = mats[key]
            color = tuple(mat.diffuse_color[:3])
            base_image = generated_architectural_image(
                family,
                key,
                "base-color",
                color,
                roughness,
                seed + variant_index * 3,
                pattern,
            )
            apply_architectural_pbr(
                mat,
                family,
                key,
                base_image,
                shared_images,
                roughness,
                metallic,
                normal_strength,
            )


def configure_ground_uv_tiling() -> None:
    tile_sizes = {
        "MAT__asphalt": 4.6,
        "MAT__aged-asphalt": 4.8,
        "MAT__concrete": 4.2,
        "MAT__loading-concrete": 4.2,
        "MAT__entry-paving": 3.4,
        "MAT__parking-surface": 4.6,
        "MAT__walkway": 3.2,
        "MAT__lawn": 4.8,
        "MAT__bioswale-soil": 3.6,
        "MAT__planting-mulch": 3.2,
        "MAT__forest-ground": 5.0,
    }
    seen_meshes = set()
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.data in seen_meshes or not obj.data.materials:
            continue
        mat = obj.data.materials[0]
        tile_size = tile_sizes.get(mat.name if mat else "")
        if tile_size is None or not obj.data.uv_layers:
            continue
        if obj.data.get("pbrUvRepeat"):
            seen_meshes.add(obj.data)
            continue
        repeat_x = max(1.0, obj.dimensions.x / tile_size)
        repeat_y = max(1.0, obj.dimensions.y / tile_size)
        for loop_uv in obj.data.uv_layers.active.data:
            loop_uv.uv.x *= repeat_x
            loop_uv.uv.y *= repeat_y
        obj.data["pbrUvRepeat"] = (repeat_x, repeat_y)
        seen_meshes.add(obj.data)


def configure_architectural_uv_tiling() -> None:
    tile_sizes = {
        "industrial-coated-metal": 4.5,
        "warehouse-sandwich-panel": 4.5,
        "administration-limestone": 3.2,
        "architectural-concrete": 3.2,
        "galvanized-roof": 5.0,
    }
    seen_meshes = set()
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.data in seen_meshes or not obj.data.materials or not obj.data.uv_layers:
            continue
        mat = obj.data.materials[0]
        family = mat.get("architecturalPbrFamily") if mat else None
        tile_size = tile_sizes.get(family)
        if tile_size is None:
            continue
        repeat_x = max(1.0, obj.dimensions.x / tile_size)
        repeat_y = max(1.0, obj.dimensions.y / tile_size)
        for loop_uv in obj.data.uv_layers.active.data:
            loop_uv.uv.x *= repeat_x
            loop_uv.uv.y *= repeat_y
        obj.data["architecturalPbrUvRepeat"] = (repeat_x, repeat_y)
        seen_meshes.add(obj.data)


def empty(name: str, location=(0.0, 0.0, 0.0), parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_type = "CUBE"
    obj.empty_display_size = 0.35
    obj.parent = parent
    obj.location = location
    return obj


def box(name, size, location, mat, parent=None, bevel=0.04, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0) if parent else location)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    if parent:
        obj.location = location
    obj.dimensions = size
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new(name="EdgeSoftening", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 1
    return obj


def cylinder(name, radius, depth, location, mat, parent=None, rotation=(0, 0, 0), vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(0, 0, 0) if parent else location)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    if parent:
        obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return obj


def tapered_trunk(name, base_radius, top_radius, depth, location, mat, parent=None, vertices=9):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=base_radius,
        radius2=top_radius,
        depth=depth,
        location=(0, 0, 0) if parent else location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    if parent:
        obj.location = location
    obj.data.materials.append(mat)
    obj["vegetationForm"] = "tapered-trunk"
    obj["baseRadius"] = base_radius
    obj["topRadius"] = top_radius
    return obj


def clustered_crown(
    name,
    radius,
    location,
    mat,
    parent=None,
    variant=0,
    species="broadleaf",
    tier="mid",
    layer_materials=(),
):
    mesh = bpy.data.meshes.new(f"{name}__clustered-mesh")
    bm = bmesh.new()
    lobe_specs = CANOPY_PROFILES.get(species, CANOPY_PROFILES["broadleaf"])
    angle = math.radians(variant * 17)
    cosine = math.cos(angle)
    sine = math.sin(angle)
    materials = []
    for candidate in (mat, *layer_materials):
        if candidate is not None and candidate not in materials:
            materials.append(candidate)
    subdivisions = 2
    lobe_scale_factor = 0.62 if tier in {"near", "mid"} else 1.0
    offset_scale_factor = 1.08 if tier in {"near", "mid"} else 1.0
    for lobe_index, (offset_x, offset_y, offset_z, scale_x, scale_y, scale_z) in enumerate(lobe_specs):
        created = bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
        material_index = (lobe_index * 5 + variant) % max(1, len(materials))
        for face in created.get("faces", ()):
            face.material_index = material_index
        for vertex in created["verts"]:
            local_x = vertex.co.x * scale_x * lobe_scale_factor + offset_x * radius * offset_scale_factor
            local_y = vertex.co.y * scale_y * lobe_scale_factor + offset_y * radius * offset_scale_factor
            vertex.co.x = local_x * cosine - local_y * sine
            vertex.co.y = local_x * sine + local_y * cosine
            vertex.co.z = vertex.co.z * scale_z * lobe_scale_factor + offset_z * radius * offset_scale_factor
    bm.to_mesh(mesh)
    bm.free()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    for material_value in materials:
        obj.data.materials.append(material_value)
    obj["vegetationForm"] = "clustered-canopy"
    obj["crownVariant"] = variant
    obj["vegetationSpecies"] = species
    obj["vegetationTier"] = tier
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.smart_project(island_margin=0.025)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)
    return obj


def create_branch_structure(name, location, radius, mat, parent=None, variant=0):
    branch_root = empty(name, location, parent)
    branch_root["vegetationDetail"] = "branch-group"
    for branch_index in range(4):
        azimuth = math.radians((variant * 29 + branch_index * 91) % 360)
        length = radius * (0.72 + branch_index * 0.06)
        branch = cylinder(
            f"{name}__limb-{branch_index + 1:02d}",
            radius * (0.045 - branch_index * 0.004),
            length,
            (
                math.cos(azimuth) * radius * 0.16,
                math.sin(azimuth) * radius * 0.16,
                branch_index * radius * 0.055,
            ),
            mat,
            branch_root,
            rotation=(math.radians(58), math.radians(12), azimuth),
            vertices=7,
        )
        branch["vegetationDetail"] = "branch-structure"
        branch["vegetationTier"] = "near"
        branch["branchOrder"] = 1
        branch["branchParent"] = name
        for fork_index in range(2):
            fork_azimuth = azimuth + math.radians(-24 if fork_index == 0 else 28)
            fork = cylinder(
                f"{name}__limb-{branch_index + 1:02d}__fork-{fork_index + 1:02d}",
                radius * (0.021 - branch_index * 0.0015),
                radius * (0.32 + fork_index * 0.045),
                (
                    math.cos(azimuth) * radius * 0.42 + math.cos(fork_azimuth) * radius * 0.08,
                    math.sin(azimuth) * radius * 0.42 + math.sin(fork_azimuth) * radius * 0.08,
                    radius * (0.18 + branch_index * 0.055 + fork_index * 0.045),
                ),
                mat,
                branch_root,
                rotation=(math.radians(64 - fork_index * 5), math.radians(16), fork_azimuth),
                vertices=6,
            )
            fork["vegetationDetail"] = "branch-structure"
            fork["vegetationTier"] = "near"
            fork["branchOrder"] = 2
            fork["branchParent"] = branch.name
    return branch_root


def create_vegetation_ecology(mats, campus):
    """Integrate near tree bases and the forest edge without changing tree positions."""
    existing = bpy.data.objects.get("SITE__vegetation-ecology")
    if existing:
        remove_object_tree(existing)
    group = empty("SITE__vegetation-ecology", parent=campus)
    group["ecologySystem"] = "anchored-near-tree-and-forest-understory"

    def tag(obj, role, anchor_name, zone):
        obj["ecologyRole"] = role
        obj["anchorName"] = anchor_name
        obj["ecologyZone"] = zone
        obj["layerRole"] = "vegetation-ecology"
        return obj

    near_trunks = sorted(
        [obj for obj in bpy.data.objects if obj.name.startswith("LANDSCAPE__inner-tree-trunk-")],
        key=lambda obj: obj.name,
    )
    for index, trunk in enumerate(near_trunks, start=1):
        x, y = trunk.matrix_world.translation.x, trunk.matrix_world.translation.y
        soil = cylinder(
            f"VEGETATION_ECOLOGY__tree-soil-{index:02d}",
            0.49,
            0.025,
            (x, y, 0.087),
            mats["bioswale_soil"],
            group,
            vertices=18,
        )
        soil.scale = (1.0, 0.92 + (index % 3) * 0.035, 1.0)
        tag(soil, "bare-soil-transition", trunk.name, "near-tree-base")
        for tuft_index in range(2):
            angle = math.radians(index * 67 + tuft_index * 154)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.085, location=(0, 0, 0))
            tuft = bpy.context.object
            tuft.name = f"VEGETATION_ECOLOGY__tree-grass-{index:02d}-{tuft_index + 1:02d}"
            tuft.parent = group
            tuft.location = (x + math.cos(angle) * 0.43, y + math.sin(angle) * 0.40, 0.17)
            tuft.scale = (0.62, 0.48, 1.35 + (index % 3) * 0.12)
            tuft.rotation_euler[2] = angle
            tuft.data.materials.append(mats["ornamental_grass"])
            tag(tuft, "sparse-grass", trunk.name, "near-tree-base")

    forest_anchor = bpy.data.objects.get("ENV__forest-backdrop")
    anchor_name = forest_anchor.name if forest_anchor else "ENV__background"
    shrub_prototype = None
    for index in range(18):
        x = -30.2 + index * 3.55 + math.sin(index * 1.71) * 0.42
        leaf_y = -25.35 + math.sin(index * 1.19) * 0.36
        litter = cylinder(
            f"VEGETATION_ECOLOGY__leaf-litter-{index + 1:02d}",
            0.34,
            0.025,
            (x, leaf_y, 0.040),
            mats["planting_mulch"],
            group,
            vertices=12,
        )
        litter.scale = (1.25 + (index % 3) * 0.14, 0.58 + (index % 4) * 0.07, 1.0)
        litter.rotation_euler[2] = math.radians((index * 37) % 180)
        tag(litter, "leaf-litter", anchor_name, "forest-edge")

        shrub_y = -26.15 + math.sin(index * 1.47 + 0.8) * 0.52
        if shrub_prototype is None:
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.24, location=(0, 0, 0))
            shrub = bpy.context.object
            shrub_prototype = shrub
            shrub.name = "VEGETATION_ECOLOGY__understory-01"
            shrub.parent = group
            shrub.location = (x + 0.52, shrub_y, 0.22)
            shrub.data.materials.append(mats["understory_deep"])
        else:
            shrub = linked_mesh_instance(
                f"VEGETATION_ECOLOGY__understory-{index + 1:02d}",
                shrub_prototype,
                (x + 0.52, shrub_y, 0.22),
                group,
            )
        shrub.scale = (1.24 + (index % 5) * 0.11, 0.72 + (index % 3) * 0.09, 0.62 + (index % 4) * 0.07)
        shrub.rotation_euler[2] = math.radians((index * 53) % 360)
        tag(shrub, "low-understory", anchor_name, "forest-edge")
    return group


def create_vegetation_transition_realism(mats, campus):
    """Break the planted perimeter into an irregular tree, shrub, and meadow gradient."""
    existing = bpy.data.objects.get("VEGETATION__transition-realism")
    if existing:
        remove_object_tree(existing)
    group = empty("VEGETATION__transition-realism", parent=campus)
    group["ecologySystem"] = "irregular-forest-edge"
    group["designIntent"] = "soft boundary with shared-mesh ecological layers"

    for obj in bpy.data.objects:
        if obj.name.startswith("ENV__edge-shrub-"):
            if "ecologyRole" in obj:
                del obj["ecologyRole"]
            obj["ecologyTransitionRole"] = "forest-edge-shrub"
            obj["ecologyZone"] = "forest-transition"
        elif obj.name.startswith("VEGETATION_ECOLOGY__understory-"):
            obj["ecologyTransitionRole"] = "forest-edge-shrub"
        elif obj.name.startswith("ENV__transition-meadow-"):
            if "ecologyRole" in obj:
                del obj["ecologyRole"]
            obj["ecologyTransitionRole"] = "meadow-transition"
            obj["ecologyZone"] = "forest-transition"

    for obj in bpy.data.objects:
        if not obj.name.startswith(("ENV__tree-trunk-", "ENV__tree-crown-")):
            continue
        suffix = obj.name.rsplit("-", 1)[-1].split(".", 1)[0]
        if not suffix.isdigit():
            continue
        index = int(suffix)
        if "transitionBaseLocation" not in obj:
            obj["transitionBaseLocation"] = tuple(obj.location)
        base = obj["transitionBaseLocation"]
        offset_x = math.sin(index * 2.31 + 0.4) * 0.52
        offset_y = math.cos(index * 1.73 + 0.8) * 0.44
        obj.location.x = base[0] + offset_x
        obj.location.y = base[1] + offset_y
        if obj.name.startswith("ENV__tree-crown-"):
            if "transitionBaseScale" not in obj:
                obj["transitionBaseScale"] = tuple(obj.scale)
            base_scale = obj["transitionBaseScale"]
            width_variation = 0.88 + (index % 7) * 0.045
            height_variation = 0.92 + ((index * 3) % 6) * 0.055
            obj.scale = (
                base_scale[0] * width_variation,
                base_scale[1] * (0.94 + (index % 5) * 0.035),
                base_scale[2] * height_variation,
            )
            if "ecologyRole" in obj:
                del obj["ecologyRole"]
            obj["ecologyTransitionRole"] = "canopy-gradient"
    return group


def linked_mesh_instance(name, prototype, location, parent, scale=(1, 1, 1), rotation=(0, 0, 0)):
    obj = prototype.copy()
    obj.data = prototype.data
    obj.name = name
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = rotation
    return obj


def create_site_composition(mats, campus):
    """Dissolve the rectangular environment edge and establish a small hierarchy of specimen trees."""
    for root_name in ("SITE__horizon-transition", "VEGETATION__hero-specimens"):
        existing = bpy.data.objects.get(root_name)
        if existing:
            remove_object_tree(existing)

    horizon_root = empty("SITE__horizon-transition", parent=campus)
    horizon_root["landscapeSystem"] = "layered-horizon-transition"
    horizon_root["designIntent"] = "overlapping low-frequency islands dissolve the rectangular campus board"

    horizon_specs = (
        ("forest-floor-island", -42.0, -65.0, 19.0, 11.0, -8, "forest_ground"),
        ("meadow-island", -25.0, -66.0, 18.0, 10.0, 7, "lawn"),
        ("forest-floor-island", -8.0, -64.5, 20.0, 11.5, -5, "forest_ground"),
        ("scrub-island", 9.0, -66.0, 18.5, 10.2, 11, "forest_ground"),
        ("forest-floor-island", 26.0, -64.8, 19.0, 11.2, -9, "forest_ground"),
        ("meadow-island", 43.0, -65.5, 18.0, 10.4, 6, "lawn"),
        ("forest-floor-island", -56.0, -45.0, 11.0, 20.0, 9, "forest_ground"),
        ("drainage-island", -57.0, -27.0, 10.5, 19.0, -6, "lawn"),
        ("meadow-island", -56.0, -9.0, 11.0, 20.0, 8, "lawn"),
        ("scrub-island", -55.5, 12.0, 12.0, 20.0, -7, "forest_ground"),
        ("meadow-island", -55.0, 28.0, 12.0, 13.0, 5, "lawn"),
        ("forest-floor-island", 56.0, -44.0, 11.0, 20.0, -8, "forest_ground"),
        ("drainage-island", 57.0, -25.0, 10.5, 19.5, 7, "lawn"),
        ("scrub-island", 56.0, -6.0, 11.0, 20.0, -9, "forest_ground"),
        ("meadow-island", 55.5, 14.0, 12.0, 19.0, 6, "lawn"),
        ("forest-floor-island", 55.0, 29.0, 12.0, 13.0, -5, "forest_ground"),
    )
    for index, (role, x, y, width, depth, angle, material_key) in enumerate(horizon_specs, start=1):
        island = cylinder(
            f"HORIZON__{role}-{index:02d}",
            1.0,
            0.045,
            (x, y, 0.015 + (index % 3) * 0.021),
            mats[material_key],
            horizon_root,
            vertices=20,
        )
        island.scale = (width / 2, depth / 2, 1.0)
        island.rotation_euler[2] = math.radians(angle)
        island["horizonRole"] = role
        island["clearanceClass"] = "perimeter-transition"
        island["visibilityTier"] = "far"
        island["detailScale"] = "macro"

    hero_root = empty("VEGETATION__hero-specimens", parent=campus)
    hero_root["landscapeSystem"] = "hierarchical-hero-planting"
    hero_root["designIntent"] = "specimen trees frame functional destinations without blocking circulation"
    trunk_source = bpy.data.objects.get("LANDSCAPE__inner-tree-trunk-01") or bpy.data.objects.get("TREE__trunk-01")
    crown_sources = [
        obj
        for obj in bpy.data.objects
        if obj.type == "MESH" and obj.name.startswith("LANDSCAPE__inner-tree-crown-")
    ]
    crown_sources.sort(key=lambda obj: obj.name)
    if not trunk_source or not crown_sources:
        raise RuntimeError("site composition requires existing landscape tree prototypes")

    hero_specs = (
        (5.2, 18.2, "administration-buffer", "near", 1.58, 1.78),
        (20.2, 18.8, "administration-buffer", "near", 1.48, 1.70),
        (17.5, 11.0, "parking-buffer", "near", 1.42, 1.62),
        (30.2, 14.5, "parking-buffer", "mid", 1.48, 1.68),
        (5.0, -23.0, "sports-buffer", "mid", 1.52, 1.72),
        (35.0, -22.0, "sports-buffer", "mid", 1.56, 1.78),
        (-22.5, 17.2, "pedestrian-buffer", "near", 1.44, 1.66),
        (-8.0, 18.0, "pedestrian-buffer", "near", 1.50, 1.72),
        (-31.5, 8.5, "pedestrian-buffer", "mid", 1.42, 1.62),
        (31.8, 3.5, "pedestrian-buffer", "mid", 1.46, 1.66),
    )
    for index, (x, y, clearance, tier, width_scale, height_scale) in enumerate(hero_specs, start=1):
        tree = empty(f"HERO_TREE__{index:02d}", (x, y, 0), hero_root)
        tree["landscapeRole"] = "hero-tree"
        tree["clearanceClass"] = clearance
        tree["vegetationTier"] = tier
        tree["visibilityTier"] = "far"
        tree["functionalAnchor"] = clearance.removesuffix("-buffer")

        trunk = linked_mesh_instance(
            f"HERO_TREE__{index:02d}__trunk",
            trunk_source,
            (0, 0, 0.56),
            tree,
            scale=(width_scale, width_scale, height_scale),
            rotation=(0, 0, math.radians((index * 53) % 360)),
        )
        crown_source = crown_sources[(index - 1) % len(crown_sources)]
        crown = linked_mesh_instance(
            f"HERO_TREE__{index:02d}__crown",
            crown_source,
            (0, 0, 1.55 + (index % 3) * 0.08),
            tree,
            scale=(width_scale, width_scale * (0.92 + (index % 2) * 0.08), height_scale),
            rotation=(0, 0, math.radians((index * 67) % 360)),
        )
        for obj in (trunk, crown):
            obj["landscapeRole"] = "hero-tree-component"
            obj["clearanceClass"] = clearance
            obj["vegetationTier"] = tier
            obj["visibilityTier"] = "far"
            obj["sharedPrototype"] = trunk_source.name if obj is trunk else crown_source.name

    campus["siteCompositionPass"] = "layered-horizon-and-hero-planting-v1"
    campus["horizonTransitionCount"] = len(horizon_specs)
    campus["heroSpecimenCount"] = len(hero_specs)
    bpy.context.scene["siteCompositionPass"] = "2026-08-23"
    return {"horizon": len(horizon_specs), "heroes": len(hero_specs)}


MATERIAL_REUSE_ALIASES = {
    "MAT__process-wall": "MAT__factory-wall",
    "MAT__utility-wall": "MAT__factory-wall",
    "MAT__laboratory-wall": "MAT__factory-wall",
    "MAT__process-panel-light": "MAT__factory-panel-light",
    "MAT__process-panel-mid": "MAT__factory-panel-mid",
    "MAT__utility-panel-light": "MAT__factory-panel-light",
    "MAT__utility-panel-mid": "MAT__factory-panel-mid",
    "MAT__laboratory-panel-light": "MAT__factory-panel-light",
    "MAT__laboratory-panel-mid": "MAT__factory-panel-mid",
    "MAT__forest-foliage": "MAT__foliage",
    "MAT__forest-foliage-light": "MAT__foliage-light",
    "MAT__entry-paving": "MAT__walkway",
    "MAT__sidewalk": "MAT__walkway",
    "MAT__parking-surface": "MAT__asphalt",
    "MAT__aged-asphalt": "MAT__asphalt",
    "MAT__tactile-paving": "MAT__safety-yellow",
    "MAT__ground-oil-mark": "MAT__ground-tire-wear",
    "MAT__ground-drain-discoloration": "MAT__ground-contact-transition",
    "MAT__ground-dock-abrasion": "MAT__ground-tire-wear",
    "MAT__ground-asphalt-repair": "MAT__asphalt-repair-warm",
    "MAT__recycling-blue": "MAT__blue-accent",
    "MAT__utility-iron": "MAT__vent",
}


def _material_base_name(name):
    return re.sub(r"\.\d{3}$", "", name)


def consolidate_reusable_materials():
    """Merge small, visually equivalent finish variants while preserving primary PBR families."""
    canonical = {}
    for material_value in bpy.data.materials:
        canonical.setdefault(_material_base_name(material_value.name), material_value)
    replacements = {
        source: canonical[target]
        for source, target in MATERIAL_REUSE_ALIASES.items()
        if source in canonical and target in canonical
    }
    replaced_slots = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            if not slot.material:
                continue
            replacement = replacements.get(_material_base_name(slot.material.name))
            if replacement and replacement != slot.material:
                slot.material = replacement
                replaced_slots += 1
    for material_value in list(bpy.data.materials):
        if material_value.users == 0:
            bpy.data.materials.remove(material_value)
    return replaced_slots


def _foreach_bytes(collection, attribute, typecode, value_count):
    values = array.array(typecode, [0]) * value_count
    if value_count:
        collection.foreach_get(attribute, values)
    return values.tobytes()


def _mesh_geometry_signature(mesh):
    if mesh.shape_keys or mesh.color_attributes:
        return None
    digest = hashlib.blake2b(digest_size=20)
    digest.update(f"{len(mesh.vertices)}:{len(mesh.edges)}:{len(mesh.loops)}:{len(mesh.polygons)}".encode())
    digest.update(_foreach_bytes(mesh.vertices, "co", "f", len(mesh.vertices) * 3))
    digest.update(_foreach_bytes(mesh.edges, "vertices", "i", len(mesh.edges) * 2))
    digest.update(_foreach_bytes(mesh.loops, "vertex_index", "i", len(mesh.loops)))
    for attribute in ("loop_start", "loop_total", "material_index"):
        digest.update(_foreach_bytes(mesh.polygons, attribute, "i", len(mesh.polygons)))
    for uv_layer in mesh.uv_layers:
        digest.update(uv_layer.name.encode())
        digest.update(_foreach_bytes(uv_layer.data, "uv", "f", len(uv_layer.data) * 2))
    digest.update("|".join(_material_base_name(mat.name) if mat else "" for mat in mesh.materials).encode())
    digest.update(repr(sorted((key, mesh[key]) for key in mesh.keys())).encode())
    return digest.hexdigest()


def _reusable_modifier_signature(obj):
    if not obj.modifiers:
        return ("NONE",)
    if any(modifier.type != "BEVEL" for modifier in obj.modifiers):
        return None
    return tuple(
        (
            modifier.type,
            round(modifier.width, 6),
            modifier.segments,
            modifier.limit_method,
            getattr(modifier, "affect", "EDGES"),
            round(getattr(modifier, "angle_limit", 0.0), 6),
            getattr(modifier, "offset_type", "OFFSET"),
            bool(getattr(modifier, "clamp_overlap", False)),
        )
        for modifier in obj.modifiers
    )


def _apply_reusable_modifiers(obj):
    if not obj.modifiers:
        return
    obj.data = obj.data.copy()
    bpy.ops.object.select_all(action="DESELECT")
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)


def deduplicate_reusable_meshes():
    """Link byte-identical meshes, baking identical bevel stacks once per prototype."""
    groups = {}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.vertex_groups:
            continue
        geometry_signature = _mesh_geometry_signature(obj.data)
        modifier_signature = _reusable_modifier_signature(obj)
        if geometry_signature is None or modifier_signature is None:
            continue
        groups.setdefault((geometry_signature, modifier_signature), []).append(obj)

    reused_objects = 0
    reusable_groups = 0
    for (geometry_signature, modifier_signature), objects in groups.items():
        if len(objects) < 2:
            continue
        prototype = objects[0]
        if modifier_signature != ("NONE",):
            _apply_reusable_modifiers(prototype)
        prototype_mesh = prototype.data
        group_id = geometry_signature[:12]
        prototype["assetReuseGroup"] = group_id
        prototype["assetReuseRole"] = "prototype"
        for obj in objects[1:]:
            for modifier in list(obj.modifiers):
                obj.modifiers.remove(modifier)
            obj.data = prototype_mesh
            obj["assetReuseGroup"] = group_id
            obj["assetReuseRole"] = "instance"
            reused_objects += 1
        reusable_groups += 1

    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    return reusable_groups, reused_objects


def tag_distance_visibility_tiers():
    near_tokens = (
        "shadow-joint", "pressed-batten", "roof-rib", "wall-rib", "downpipe", "storm-drain",
        "paving-joint", "ground-", "sports-wire", "fence-wire", "weathering", "patina", "abrasion",
    )
    mid_tokens = (
        "tree-trunk", "branch", "street-", "bench", "bollard", "lamp", "sign", "bin-", "grate",
        "gutter", "curb", "flower", "ornamental", "understory", "person", "worker", "pedestrian",
    )
    counts = {"near": 0, "mid": 0}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        name = obj.name.lower()
        if obj.get("detailTier") == "micro" or obj.get("vegetationDetail") == "branch-structure" or any(token in name for token in near_tokens):
            tier = "near"
        elif any(token in name for token in mid_tokens):
            tier = "mid"
        else:
            continue
        obj["visibilityTier"] = tier
        counts[tier] += 1
    return counts


def optimize_asset_reuse_and_visibility(campus):
    material_slots = consolidate_reusable_materials()
    reusable_groups, reused_objects = deduplicate_reusable_meshes()
    visibility_counts = tag_distance_visibility_tiers()
    campus["assetEfficiencyPass"] = "geometry-signature-v1"
    campus["assetReuseGroups"] = reusable_groups
    campus["assetReuseInstances"] = reused_objects
    campus["visibilityNearCount"] = visibility_counts["near"]
    campus["visibilityMidCount"] = visibility_counts["mid"]
    campus["consolidatedMaterialSlots"] = material_slots
    bpy.context.scene["assetEfficiencyPass"] = "geometry-signature-v1"
    return {
        "groups": reusable_groups,
        "instances": reused_objects,
        "near": visibility_counts["near"],
        "mid": visibility_counts["mid"],
        "material_slots": material_slots,
    }


def mark_interior(obj, role="interior-prop"):
    obj["layerRole"] = role
    return obj


def mark_construction(obj, role, bevel_width=None, opening_depth=None):
    """Attach GLB-safe architectural construction semantics to visible geometry."""
    obj["constructionRole"] = role
    obj["layerRole"] = f"architectural-{role}"
    if bevel_width is not None:
        obj["bevelWidth"] = bevel_width
    if opening_depth is not None:
        obj["openingDepth"] = opening_depth
    return obj


def create_low_poly_walker(building_id, floor_id, width, depth, floor_base, floor_index, mats, interior):
    walker_name = f"WALKER__{building_id}__{floor_id}__01"
    start_x = -max(0.22, width * 0.28)
    walker = empty(walker_name, (start_x, depth * 0.27, floor_base + 0.13), interior)
    walker.scale = (1.4, 1.4, 1.4)
    walker["motionPath"] = "floor-walk"
    walker["motionDistance"] = max(0.45, width * 0.48)
    walker["motionSpeed"] = 0.075 + (floor_index % 3) * 0.012
    walker["motionPhase"] = ((len(building_id) + floor_index * 3) % 10) / 10
    walker["layerRole"] = "interior-person"

    mark_interior(box(f"{walker_name}__body", (0.12, 0.075, 0.20), (0, 0, 0.24), mats["workwear"], walker, 0.025))
    mark_interior(box(f"{walker_name}__vest", (0.125, 0.082, 0.075), (0, 0.006, 0.27), mats["safety_vest"], walker, 0.012))
    for side, label in ((-1, "left"), (1, "right")):
        mark_interior(box(f"{walker_name}__leg-{label}", (0.045, 0.052, 0.15), (side * 0.032, 0, 0.09), mats["workwear"], walker, 0.012))
        mark_interior(box(f"{walker_name}__arm-{label}", (0.038, 0.045, 0.17), (side * 0.082, 0, 0.235), mats["workwear"], walker, 0.012))
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.062, location=(0, 0, 0))
    head = bpy.context.object
    head.name = f"{walker_name}__head"
    head.parent = walker
    head.location = (0, 0, 0.405)
    head.data.materials.append(mats["skin"])
    mark_interior(head)
    mark_interior(cylinder(f"{walker_name}__helmet", 0.071, 0.045, (0, 0, 0.458), mats["hardhat"], walker, vertices=12))
    mark_interior(box(f"{walker_name}__helmet-brim", (0.17, 0.10, 0.018), (0, 0.018, 0.438), mats["hardhat"], walker, 0.008))
    return walker


def create_site_patrol_walker(index, location, axis, distance, speed, phase, mats, parent, name=None):
    walker_name = name or f"PATROL__campus-{index:02d}"
    walker = empty(walker_name, location, parent)
    walker.scale = (1.65, 1.65, 1.65)
    walker["motionPath"] = "site-patrol"
    walker["motionAxis"] = axis
    walker["motionDistance"] = distance
    walker["motionSpeed"] = speed
    walker["motionPhase"] = phase
    walker["layerRole"] = "site-person"

    box(f"{walker_name}__body", (0.12, 0.075, 0.20), (0, 0, 0.24), mats["workwear"], walker, 0.025)
    box(f"{walker_name}__vest", (0.125, 0.082, 0.075), (0, 0.006, 0.27), mats["safety_vest"], walker, 0.012)
    for side, label in ((-1, "left"), (1, "right")):
        box(f"{walker_name}__leg-{label}", (0.045, 0.052, 0.15), (side * 0.032, 0, 0.09), mats["workwear"], walker, 0.012)
        box(f"{walker_name}__arm-{label}", (0.038, 0.045, 0.17), (side * 0.082, 0, 0.235), mats["workwear"], walker, 0.012)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.062, location=(0, 0, 0))
    head = bpy.context.object
    head.name = f"{walker_name}__head"
    head.parent = walker
    head.location = (0, 0, 0.405)
    head.data.materials.append(mats["skin"])
    cylinder(f"{walker_name}__helmet", 0.071, 0.045, (0, 0, 0.458), mats["hardhat"], walker, vertices=12)
    box(f"{walker_name}__helmet-brim", (0.17, 0.10, 0.018), (0, 0.018, 0.438), mats["hardhat"], walker, 0.008)
    return walker


def create_operational_roof_and_services(building_id, width, depth, height, mats, root):
    """Add compact, maintainable roof plant and facade-mounted utility services."""
    if building_id not in {
        "main-production-hall",
        "central-processing-hall",
        "east-process-hall",
        "far-east-utility",
        "east-warehouse",
        "front-warehouse",
    }:
        return

    roof_z = height + 0.31
    walkway = box(
        f"ROOF_OPS__{building_id}__maintenance-walkway",
        (width * 0.68, 0.48, 0.075),
        (0, -depth * 0.18, roof_z),
        mats["gutter"],
        root,
        0.015,
    )
    walkway["layerRole"] = "roof-maintenance-walkway"
    walkway["surfaceType"] = "anti-slip-grating"
    for index, side in enumerate((-1, 1), start=1):
        rail = box(
            f"ROOF_OPS__{building_id}__guardrail-{index:02d}",
            (width * 0.69, 0.035, 0.045),
            (0, -depth * 0.18 + side * 0.27, roof_z + 0.48),
            mats["safety_yellow"],
            root,
            0.006,
        )
        rail["layerRole"] = "roof-safety-rail"
        box(
            f"ROOF_OPS__{building_id}__guardrail-mid-{index:02d}",
            (width * 0.69, 0.03, 0.035),
            (0, -depth * 0.18 + side * 0.27, roof_z + 0.25),
            mats["safety_yellow"],
            root,
            0.005,
        )["layerRole"] = "roof-safety-rail"
        for post_index in range(5):
            post_x = -width * 0.34 + post_index * width * 0.17
            box(
                f"ROOF_OPS__{building_id}__guardrail-post-{index:02d}-{post_index + 1:02d}",
                (0.04, 0.04, 0.50),
                (post_x, -depth * 0.18 + side * 0.27, roof_z + 0.25),
                mats["safety_yellow"],
                root,
                0.005,
            )["layerRole"] = "roof-safety-rail"

    hvac_count = 2 if width >= 7 else 1
    for index in range(hvac_count):
        px = (index - (hvac_count - 1) / 2) * min(2.2, width * 0.28)
        unit = box(
            f"ROOF_OPS__{building_id}__hvac-unit-{index + 1:02d}",
            (1.25, 0.82, 0.64),
            (px, depth * 0.16, height + 0.62),
            mats["interior_equipment"],
            root,
            0.055,
        )
        unit["layerRole"] = "roof-hvac"
        for slat in range(5):
            box(
                f"ROOF_OPS__{building_id}__hvac-unit-{index + 1:02d}__louver-{slat + 1:02d}",
                (0.88, 0.035, 0.045),
                (px, depth * 0.16 + 0.43, height + 0.43 + slat * 0.09),
                mats["vent"],
                root,
                0.004,
            )

    duct = box(
        f"ROOF_OPS__{building_id}__duct-run",
        (max(1.4, width * 0.36), 0.34, 0.30),
        (0, 0, height + 0.52),
        mats["gutter"],
        root,
        0.035,
    )
    duct["layerRole"] = "roof-duct"
    for side in (-1, 1):
        ladder_rail = box(
            f"ROOF_OPS__{building_id}__access-ladder-rail-{side:+d}",
            (0.045, 0.055, min(2.2, height * 0.68)),
            (width * 0.38 + side * 0.17, -depth / 2 - 0.06, height * 0.52),
            mats["pipe"],
            root,
            0.006,
        )
        ladder_rail["layerRole"] = "roof-access-ladder"
    for rung in range(6):
        ladder_rung = box(
            f"ROOF_OPS__{building_id}__access-ladder-rung-{rung + 1:02d}",
            (0.39, 0.06, 0.035),
            (width * 0.38, -depth / 2 - 0.08, 0.42 + rung * min(0.32, height * 0.095)),
            mats["pipe"],
            root,
            0.004,
        )
        ladder_rung["layerRole"] = "roof-access-ladder"

    fire_cabinet = box(
        f"SERVICE_OPS__{building_id}__fire-cabinet",
        (0.48, 0.12, 0.72),
        (-width * 0.34, depth / 2 + 0.10, 0.84),
        mats["fire_red"],
        root,
        0.025,
    )
    fire_cabinet["layerRole"] = "fire-service"
    electrical_panel = box(
        f"SERVICE_OPS__{building_id}__electrical-panel",
        (0.62, 0.13, 0.86),
        (width * 0.34, depth / 2 + 0.10, 0.92),
        mats["interior_storage"],
        root,
        0.025,
    )
    electrical_panel["layerRole"] = "electrical-service"
    box(
        f"SERVICE_OPS__{building_id}__electrical-warning",
        (0.22, 0.035, 0.20),
        (width * 0.34, depth / 2 + 0.18, 1.02),
        mats["safety_yellow"],
        root,
        0.008,
    )["layerRole"] = "electrical-warning"

    for index, px in enumerate((-width * 0.18, width * 0.04), start=1):
        entry = cylinder(
            f"SERVICE_OPS__{building_id}__pipe-entry-{index:02d}",
            0.085,
            0.42,
            (px, depth / 2 + 0.16, 0.62 + index * 0.24),
            mats["pipe_accent"],
            root,
            rotation=(math.pi / 2, 0, 0),
            vertices=12,
        )
        entry["layerRole"] = "utility-pipe-entry"


def create_warehouse_loading_activity(building_id, width, depth, mats, root):
    """Create a small working loading scene on each warehouse apron."""
    if building_id not in {"front-warehouse", "east-warehouse"}:
        return

    apron_y = depth / 2 + 0.82
    phase = 0.18 if building_id == "front-warehouse" else 0.62
    for stack_index, px in enumerate((-width * 0.31, -width * 0.20), start=1):
        stack = empty(f"LOGISTICS_OPS__{building_id}__pallet-stack-{stack_index:02d}", (px, apron_y, 0), root)
        stack["layerRole"] = "warehouse-staging"
        for level in range(2):
            box(
                f"LOGISTICS_OPS__{building_id}__pallet-stack-{stack_index:02d}__load-{level + 1:02d}",
                (0.56, 0.42, 0.25),
                (0, 0, 0.18 + level * 0.27),
                mats["interior_worktop"],
                stack,
                0.012,
            )
            for runner in (-0.15, 0.15):
                box(
                    f"LOGISTICS_OPS__{building_id}__pallet-stack-{stack_index:02d}__runner-{level + 1:02d}-{runner:+.2f}",
                    (0.50, 0.05, 0.045),
                    (0, runner, 0.055 + level * 0.27),
                    mats["plinth"],
                    stack,
                    0.003,
                )

    forklift = empty(f"LOGISTICS_OPS__{building_id}__forklift", (width * 0.03, apron_y, 0.10), root)
    forklift["vehicleType"] = "forklift"
    forklift["layerRole"] = "warehouse-vehicle"
    forklift["motionPath"] = "yard-shuttle"
    forklift["motionAxis"] = "x"
    forklift["motionDistance"] = min(2.1, width * 0.27)
    forklift["motionSpeed"] = 0.052
    forklift["motionPhase"] = phase
    box(f"{forklift.name}__body", (0.92, 0.62, 0.46), (0, 0, 0.31), mats["safety_yellow"], forklift, 0.07)
    box(f"{forklift.name}__counterweight", (0.34, 0.68, 0.58), (-0.36, 0, 0.40), mats["safety_yellow"], forklift, 0.09)
    for side in (-1, 1):
        cylinder(f"{forklift.name}__wheel-{side:+d}", 0.17, 0.10, (-0.24, side * 0.34, 0.19), mats["tire"], forklift, rotation=(math.pi / 2, 0, 0), vertices=12)
        box(f"{forklift.name}__mast-{side:+d}", (0.07, 0.07, 1.18), (0.43, side * 0.20, 0.70), mats["pipe"], forklift, 0.007)
        box(f"{forklift.name}__fork-{side:+d}", (0.78, 0.06, 0.055), (0.76, side * 0.18, 0.10), mats["pipe"], forklift, 0.005)
    box(f"{forklift.name}__overhead-guard", (0.66, 0.62, 0.07), (-0.05, 0, 1.04), mats["pipe"], forklift, 0.012)

    loader = create_site_patrol_walker(
        1,
        (-width * 0.05, apron_y + 0.62, 0.12),
        "x",
        min(1.5, width * 0.18),
        0.048,
        phase + 0.14,
        mats,
        root,
        name=f"LOGISTICS_OPS__{building_id}__loader-01",
    )
    loader["layerRole"] = "warehouse-loading-crew"

    for index, px in enumerate((-width * 0.43, width * 0.43), start=1):
        bollard = cylinder(
            f"LOGISTICS_OPS__{building_id}__dock-bollard-{index:02d}",
            0.065,
            0.72,
            (px, depth / 2 + 0.26, 0.42),
            mats["safety_yellow"],
            root,
            vertices=12,
        )
        bollard["layerRole"] = "loading-safety"


def create_chair(prefix, location, mats, parent, rotation=0):
    chair = empty(prefix, location, parent)
    chair.rotation_euler[2] = rotation
    mark_interior(box(f"{prefix}__seat", (0.22, 0.22, 0.06), (0, 0, 0.15), mats["interior_storage"], chair, 0.025))
    mark_interior(box(f"{prefix}__back", (0.22, 0.055, 0.25), (0, -0.085, 0.28), mats["interior_storage"], chair, 0.025))
    for leg_index, (px, py) in enumerate(((-.075, -.07), (.075, -.07), (-.075, .07), (.075, .07)), start=1):
        mark_interior(box(f"{prefix}__leg-{leg_index:02d}", (.025, .025, .14), (px, py, .07), mats["interior_equipment"], chair, .006))
    return chair


def create_sofa(prefix, location, width, mats, parent, rotation=0):
    sofa = empty(prefix, location, parent)
    sofa.rotation_euler[2] = rotation
    mark_interior(box(prefix, (width, .34, .12), (0, 0, .16), mats["interior_storage"], sofa, .045))
    mark_interior(box(f"{prefix}__back", (width, .10, .34), (0, -.13, .31), mats["interior_storage"], sofa, .045))
    for side, px in enumerate((-width * .45, width * .45), start=1):
        mark_interior(box(f"{prefix}__arm-{side:02d}", (.11, .34, .22), (px, 0, .23), mats["interior_storage"], sofa, .035))
    return sofa


def create_zone(name, location, parent, usage, clear_aisle_width):
    zone = empty(name, location, parent)
    zone["layerRole"] = "interior-zone"
    zone["usage"] = usage
    zone["clearAisleWidth"] = clear_aisle_width
    return zone


def create_desk_cluster(prefix, width, depth, mats, parent):
    for index, px in enumerate((-width * 0.16, width * 0.16), start=1):
        mark_interior(box(
            f"{prefix}__desk-{index:02d}",
            (width * 0.25, depth * 0.18, 0.15),
            (px, 0, 0.09),
            mats["interior_worktop"],
            parent,
            0.025,
        ))
        create_chair(f"{prefix}__chair-{index:02d}", (px, depth * 0.16, 0), mats, parent, math.pi)


def create_lounge_cluster(prefix, width, depth, mats, parent):
    create_sofa(f"{prefix}__sofa-01", (width * 0.08, -depth * 0.08, 0), width * 0.38, mats, parent)
    create_sofa(f"{prefix}__sofa-02", (-width * 0.24, depth * 0.12, 0), width * 0.28, mats, parent, math.pi / 2)
    mark_interior(box(
        f"{prefix}__coffee-table-01",
        (width * 0.24, depth * 0.18, 0.10),
        (-width * 0.08, depth * 0.10, 0.06),
        mats["interior_worktop"],
        parent,
        0.025,
    ))


def create_factory_work_cell(prefix, width, depth, mats, parent):
    mark_interior(box(f"{prefix}__worktable-01", (width * .34, depth * .16, .18), (0, 0, .10), mats["interior_worktop"], parent, .025))
    mark_interior(box(f"{prefix}__tool-cart-01", (width * .12, depth * .15, .24), (-width * .27, 0, .13), mats["interior_storage"], parent, .018))
    mark_interior(box(f"{prefix}__control-panel-01", (width * .13, .12, .38), (width * .27, -depth * .04, .20), mats["interior_equipment"], parent, .018))


def create_packing_cell(prefix, width, depth, mats, parent):
    mark_interior(box(f"{prefix}__packing-table-01", (width * .42, depth * .20, .18), (0, 0, .10), mats["interior_worktop"], parent, .025))
    for index, px in enumerate((-width * .29, width * .29), start=1):
        mark_interior(box(f"{prefix}__dispatch-bin-{index:02d}", (width * .14, depth * .18, .20), (px, 0, .11), mats["interior_storage"], parent, .018))


def create_floor_interior(building_id, floor_id, usage, width, depth, floor_height, floor_base, floor_index, mats, floor_root):
    interior = empty(f"INTERIOR__{building_id}__{floor_id}", parent=floor_root)
    interior["buildingId"] = building_id
    interior["floorId"] = floor_id
    interior["layerRole"] = "floor-interior"
    prefix = f"PROP__{building_id}__{floor_id}"
    prop_z = floor_base + 0.18
    max_height = max(0.16, min(0.42, floor_height * 0.42))

    if floor_id == "RF":
        mark_interior(box(f"{prefix}__hvac-01", (width * 0.24, depth * 0.22, max_height), (-width * 0.18, 0, prop_z + max_height / 2), mats["interior_equipment"], interior, 0.035))
        mark_interior(box(f"{prefix}__duct-01", (width * 0.34, 0.12, 0.12), (width * 0.16, -depth * 0.16, prop_z + 0.18), mats["interior_worktop"], interior, 0.018))
        for index, px in enumerate((-width * 0.24, width * 0.02), start=1):
            mark_interior(cylinder(f"{prefix}__roof-fan-{index:02d}", 0.10, 0.16, (px, depth * 0.16, prop_z + 0.12), mats["interior_equipment"], interior, vertices=10))
    elif building_id == "gatehouse":
        mark_interior(box(f"{prefix}__checkpoint-desk-01", (width * 0.42, depth * 0.18, 0.18), (-width * 0.12, -depth * 0.12, prop_z + 0.10), mats["interior_worktop"], interior, 0.025))
        mark_interior(box(f"{prefix}__access-console-01", (0.22, 0.12, 0.20), (width * 0.24, -depth * 0.12, prop_z + 0.12), mats["interior_equipment"], interior, 0.018))
        create_chair(f"{prefix}__operator-chair-01", (-width * .12, depth * .10, prop_z), mats, interior, math.pi)
        mark_interior(box(f"{prefix}__storage-cabinet-01", (.24, .16, max_height), (-width * .30, depth * .22, prop_z + max_height / 2), mats["interior_storage"], interior, .018))
    elif building_id == "administration":
        if floor_id == "L03":
            meeting_zone = create_zone(f"ZONE__{building_id}__{floor_id}__meeting", (0, 0, prop_z), interior, "meeting-command", .72)
            mark_interior(box(f"{prefix}__meeting-table-01", (width * 0.42, depth * 0.18, 0.16), (0, 0, prop_z + 0.09), mats["interior_worktop"], interior, 0.035))
            mark_interior(box(f"{prefix}__display-wall-01", (width * 0.30, 0.08, 0.30), (0, -depth * 0.28, prop_z + 0.24), mats["interior_equipment"], interior, 0.018))
            for index, (px, py, rot) in enumerate(((-width*.22, 0, -math.pi/2), (width*.22, 0, math.pi/2), (0, depth*.18, math.pi)), start=1):
                create_chair(f"{prefix}__meeting-chair-{index:02d}", (px, py, prop_z), mats, interior, rot)
        else:
            office_zone = create_zone(f"ZONE__{building_id}__{floor_id}__open-office", (-width * .10, -depth * .16, prop_z), interior, "open-office", .68)
            lounge_zone = create_zone(f"ZONE__{building_id}__{floor_id}__lounge", (width * .18, depth * .12, prop_z), interior, "reception-lounge", .62)
            create_desk_cluster(prefix, width * .58, depth * .46, mats, office_zone)
            create_lounge_cluster(prefix, width * .42, depth * .40, mats, lounge_zone)
            mark_interior(box(f"{prefix}__partition-01", (0.06, depth * 0.42, 0.28), (width * 0.30, 0, prop_z + 0.18), mats["interior_equipment"], interior, 0.015))
    elif building_id == "laboratory":
        for index, py in enumerate((-depth * 0.16, depth * 0.16), start=1):
            mark_interior(box(f"{prefix}__lab-bench-{index:02d}", (width * 0.48, depth * 0.12, 0.18), (0, py, prop_z + 0.10), mats["interior_worktop"], interior, 0.025))
        mark_interior(box(f"{prefix}__analyzer-01", (0.22, 0.18, 0.22), (-width * 0.20, depth * 0.16, prop_z + 0.22), mats["interior_equipment"], interior, 0.025))
        mark_interior(box(f"{prefix}__sample-cart-01", (.28, .20, .20), (width * .27, 0, prop_z + .11), mats["interior_storage"], interior, .018))
        create_chair(f"{prefix}__lab-stool-01", (width * .18, -depth * .16, prop_z), mats, interior)
    elif "warehouse" in building_id:
        for index, py in enumerate((-depth * 0.18, depth * 0.18), start=1):
            mark_interior(box(f"{prefix}__rack-{index:02d}", (width * 0.50, 0.12, max_height), (-width * 0.04, py, prop_z + max_height / 2), mats["interior_storage"], interior, 0.018))
        mark_interior(box(f"{prefix}__pallet-01", (width * 0.18, depth * 0.18, 0.10), (width * 0.28, 0, prop_z + 0.05), mats["interior_worktop"], interior, 0.018))
        packing_zone = create_zone(f"ZONE__{building_id}__{floor_id}__packing", (width * .18, 0, prop_z), interior, "packing-dispatch", .70)
        create_packing_cell(prefix, width * .46, depth * .54, mats, packing_zone)
    else:
        for index, px in enumerate((-width * 0.20, width * 0.12), start=1):
            mark_interior(box(f"{prefix}__process-skid-{index:02d}", (width * 0.22, depth * 0.24, max_height), (px, -depth * 0.10, prop_z + max_height / 2), mats["interior_equipment"], interior, 0.035))
        mark_interior(box(f"{prefix}__control-cabinet-01", (width * 0.18, 0.14, max_height * 0.90), (width * 0.28, depth * 0.20, prop_z + max_height * 0.45), mats["interior_worktop"], interior, 0.018))
        process_zone = create_zone(f"ZONE__{building_id}__{floor_id}__process-line", (0, depth * .12, prop_z), interior, "process-operation", .72)
        aisle_zone = create_zone(f"ZONE__{building_id}__{floor_id}__inspection-aisle", (0, depth * .31, prop_z), interior, "inspection-aisle", .78)
        create_factory_work_cell(prefix, width * .64, depth * .52, mats, process_zone)
        for stripe_index, px in enumerate((-width * .30, width * .30), start=1):
            mark_interior(box(f"{prefix}__aisle-line-{stripe_index:02d}", (.035, depth * .56, .012), (px, 0, .018), mats["safety_vest"], aisle_zone, 0))

    if floor_id != "RF":
        create_low_poly_walker(building_id, floor_id, width, depth, floor_base, floor_index, mats, interior)
    return interior


def create_floor_spaces(building_id, width, depth, height, mats, building_root):
    floors = BUILDING_FLOORS[building_id]
    floor_height = height / len(floors)
    for index, (floor_id, floor_name, usage, level, tone) in enumerate(floors):
        floor_root = empty(f"FLOOR__{building_id}__{floor_id}", parent=building_root)
        floor_root["buildingId"] = building_id
        floor_root["floorId"] = floor_id
        floor_root["floorName"] = floor_name
        floor_root["usage"] = usage
        floor_root["level"] = level
        floor_root["tone"] = tone
        floor_root["interactive"] = True

        floor_base = index * floor_height
        slab = box(
            f"FLOOR_MESH__{building_id}__{floor_id}__slab",
            (width * 0.90, depth * 0.84, 0.10),
            (0, 0, floor_base + 0.10),
            mats["floor_slab"],
            floor_root,
            0.018,
        )
        slab["layerRole"] = "floor-slab"
        space = box(
            f"FLOOR_MESH__{building_id}__{floor_id}__space",
            (width * 0.82, depth * 0.72, max(0.36, floor_height * 0.80)),
            (0, 0, floor_base + floor_height * 0.50),
            mats["floor_space_orange"] if tone == "orange" else mats["floor_space_cyan"],
            floor_root,
            0.035,
        )
        space["layerRole"] = "floor-volume"
        space["sectionHeightRatio"] = 0.80
        core = box(
            f"FLOOR_MESH__{building_id}__{floor_id}__core",
            (max(0.22, width * 0.10), max(0.22, depth * 0.16), max(0.36, floor_height * 0.84)),
            (-width * 0.31, -depth * 0.22, floor_base + floor_height * 0.50),
            mats["floor_core"],
            floor_root,
            0.025,
        )
        core["layerRole"] = "floor-core"
        create_floor_interior(building_id, floor_id, usage, width, depth, floor_height, floor_base, index, mats, floor_root)
    return floors


def create_main_production_facade(width, depth, height, mats, root):
    """Give the primary hall a readable structural rhythm and a working loading edge."""
    front_y = depth / 2

    wall_rib_height = height - 0.48
    wall_rib_z = 0.34 + wall_rib_height / 2
    front_rib_count = max(24, round(width / 0.48))
    for index in range(front_rib_count):
        px = -width / 2 + (index + 0.5) * width / front_rib_count
        box(
            f"MAIN__wall-rib-front-{index + 1:02d}",
            (0.032, 0.052, wall_rib_height),
            (px, front_y + 0.075, wall_rib_z),
            mats["wall_rib"],
            root,
            0.004,
        )

    side_rib_count = max(8, round(depth / 0.48))
    for index in range(side_rib_count):
        py = -depth / 2 + (index + 0.5) * depth / side_rib_count
        box(
            f"MAIN__wall-rib-side-{index + 1:02d}",
            (0.052, 0.032, wall_rib_height),
            (-width / 2 - 0.075, py, wall_rib_z),
            mats["wall_rib"],
            root,
            0.004,
        )

    portal_xs = (-width * 0.43, -width * 0.22, 0, width * 0.22, width * 0.43)
    for index, px in enumerate(portal_xs, start=1):
        box(
            f"MAIN__portal-frame-{index:02d}",
            (0.15, 0.24, height - 0.38),
            (px, front_y + 0.14, height / 2 + 0.02),
            mats["facade_frame"],
            root,
            0.018,
        )
    box(
        "MAIN__portal-frame-header",
        (width * 0.90, 0.24, 0.16),
        (0, front_y + 0.14, height - 0.34),
        mats["facade_frame"],
        root,
        0.018,
    )

    for index, pz in enumerate((0.72, 1.34, 2.05), start=1):
        box(
            f"MAIN__wall-band-{index:02d}",
            (width * 0.88, 0.09, 0.055),
            (0, front_y + 0.095, pz),
            mats["wall_secondary"],
            root,
            0.008,
        )

    clerestory_count = max(7, min(9, round(width / 1.8)))
    clerestory_xs = [
        -width * 0.42 + index * width * 0.84 / max(1, clerestory_count - 1)
        for index in range(clerestory_count)
    ]
    clerestory_z = height * 0.62
    for index, px in enumerate(clerestory_xs, start=1):
        box(
            f"MAIN__clerestory-reveal-{index:02d}",
            (0.78, 0.16, 0.46),
            (px, front_y + 0.005, clerestory_z),
            mats["facade_frame"],
            root,
            0.012,
        )
        for edge, z_offset in (("top", 0.245), ("sill", -0.245)):
            box(
                f"MAIN__clerestory-frame-{edge}-{index:02d}",
                (0.82, 0.11, 0.075),
                (px, front_y + 0.165, clerestory_z + z_offset),
                mats["wall_rib"],
                root,
                0.006,
            )
        for edge, x_offset in (("left", -0.405), ("right", 0.405)):
            box(
                f"MAIN__clerestory-frame-{edge}-{index:02d}",
                (0.07, 0.11, 0.56),
                (px + x_offset, front_y + 0.165, clerestory_z),
                mats["wall_rib"],
                root,
                0.006,
            )

    dock_width = 5.4
    box(
        "MAIN__loading-dock-platform",
        (dock_width, 0.90, 0.34),
        (width * 0.16, front_y + 0.48, 0.17),
        mats["concrete"],
        root,
        0.035,
    )
    canopy_x = width * 0.18
    box(
        "MAIN__loading-canopy",
        (5.95, 1.18, 0.14),
        (canopy_x, front_y + 0.58, 2.48),
        mats["facade_frame"],
        root,
        0.025,
        rotation=(math.radians(-2.5), 0, 0),
    )
    for index, px in enumerate((canopy_x - 2.45, canopy_x, canopy_x + 2.45), start=1):
        box(
            f"MAIN__loading-canopy-bracket-{index:02d}",
            (0.10, 0.78, 0.10),
            (px, front_y + 0.34, 2.20),
            mats["facade_frame"],
            root,
            0.008,
            rotation=(math.radians(-34), 0, 0),
        )
    box(
        "MAIN__loading-dock-ramp",
        (1.55, 0.82, 0.18),
        (width * 0.16 - dock_width / 2 - 0.72, front_y + 0.49, 0.09),
        mats["concrete"],
        root,
        0.025,
        rotation=(0, math.radians(-7), 0),
    )
    for index, px in enumerate((width * 0.02, width * 0.18, width * 0.34), start=1):
        door_width = 1.45
        door_height = 1.58
        box(
            f"MAIN__sectional-door-{index:02d}",
            (door_width, 0.12, door_height),
            (px, front_y + 0.105, 0.34 + door_height / 2),
            mats["wall_secondary"],
            root,
            0.015,
        )
        for slat in range(6):
            box(
                f"MAIN__sectional-door-slat-{index:02d}-{slat + 1:02d}",
                (door_width - 0.10, 0.035, 0.028),
                (px, front_y + 0.175, 0.48 + slat * (door_height - 0.18) / 5),
                mats["wall_rib"],
                root,
                0.004,
            )
        box(
            f"MAIN__sectional-door-frame-{index:02d}",
            (door_width + 0.20, 0.21, 0.13),
            (px, front_y + 0.16, 0.34 + door_height + 0.05),
            mats["facade_frame"],
            root,
            0.012,
        )
        for side in (-1, 1):
            box(
                f"MAIN__sectional-door-frame-{index:02d}-side-{side:+d}",
                (0.12, 0.21, door_height + 0.10),
                (px + side * (door_width / 2 + 0.04), front_y + 0.16, 0.34 + door_height / 2),
                mats["facade_frame"],
                root,
                0.012,
            )
            box(
                f"MAIN__dock-bumper-{index:02d}-{side:+d}",
                (0.12, 0.16, 0.36),
                (px + side * (door_width / 2 - 0.12), front_y + 0.58, 0.43),
                mats["dock_rubber"],
                root,
                0.025,
            )

        box(
            f"MAIN__exterior-light-{index:02d}",
            (0.42, 0.22, 0.12),
            (px, front_y + 0.27, 2.24),
            mats["luminaire"],
            root,
            0.025,
            rotation=(math.radians(10), 0, 0),
        )

    for pipe_index, px in enumerate((-width * 0.46, width * 0.46), start=1):
        cylinder(
            f"MAIN__downpipe-{pipe_index:02d}",
            0.055,
            height - 0.34,
            (px, front_y + 0.22, (height - 0.34) / 2 + 0.18),
            mats["gutter"],
            root,
            vertices=12,
        )
        for stand_index, pz in enumerate((0.55, 1.42, 2.30), start=1):
            box(
                f"MAIN__downpipe-stand-off-{pipe_index:02d}-{stand_index:02d}",
                (0.16, 0.22, 0.045),
                (px, front_y + 0.125, pz),
                mats["facade_frame"],
                root,
                0.006,
            )

    sign_x = -width * 0.31
    box(
        "MAIN__safety-sign-loading-backplate",
        (1.62, 0.075, 0.58),
        (sign_x, front_y + 0.155, 1.10),
        mats["facade_frame"],
        root,
        0.018,
    )
    box(
        "MAIN__safety-sign-loading",
        (1.42, 0.045, 0.18),
        (sign_x, front_y + 0.205, 1.26),
        mats["safety_orange"],
        root,
        0.008,
    )
    for stripe in range(4):
        box(
            f"MAIN__safety-sign-stripe-{stripe + 1:02d}",
            (0.22, 0.045, 0.12),
            (sign_x - 0.48 + stripe * 0.32, front_y + 0.207, 1.01),
            mats["luminaire"],
            root,
            0.004,
        )

    monitor_width = width * 0.42
    monitor_depth = depth * 0.42
    box(
        "MAIN__roof-monitor",
        (monitor_width, monitor_depth, 0.58),
        (-width * 0.10, 0, height + 0.48),
        mats["wall_secondary"],
        root,
        0.035,
    )
    for side, label in ((-1, "rear"), (1, "front")):
        for index in range(6):
            px = -width * 0.10 - monitor_width * 0.40 + index * monitor_width * 0.80 / 5
            box(
                f"MAIN__roof-monitor-window-{label}-{index + 1:02d}",
                (monitor_width * 0.115, 0.08, 0.26),
                (px, side * (monitor_depth / 2 + 0.045), height + 0.50),
                mats["skylight"],
                root,
                0.008,
            )
    box(
        "MAIN__roof-monitor-cap",
        (monitor_width + 0.18, monitor_depth + 0.18, 0.12),
        (-width * 0.10, 0, height + 0.82),
        mats["roof"],
        root,
        0.018,
    )

    annex_x = -width / 2 - 0.32
    annex = box(
        "MAIN__service-annex",
        (0.90, depth * 0.50, 1.68),
        (annex_x, -depth * 0.08, 0.84),
        mats["wall_secondary"],
        root,
        0.045,
    )
    annex["facadeType"] = "production-service-annex"
    for index, py in enumerate((-depth * 0.22, depth * 0.06), start=1):
        box(
            f"MAIN__service-annex-louver-{index:02d}",
            (0.10, 0.92, 0.58),
            (annex_x - 0.47, py, 1.00),
            mats["interior_equipment"],
            root,
            0.012,
        )
        for slat in range(5):
            box(
                f"MAIN__service-annex-louver-slat-{index:02d}-{slat + 1:02d}",
                (0.055, 0.80, 0.035),
                (annex_x - 0.53, py, 0.78 + slat * 0.11),
                mats["gutter"],
                root,
                0.004,
            )
    box(
        "MAIN__service-annex-canopy",
        (0.98, 0.92, 0.10),
        (annex_x, depth * 0.22, 1.52),
        mats["roof"],
        root,
        0.018,
    )


def create_administration_facade(width, depth, height, mats, root):
    """Create a grand stone-and-glass landmark facade for the campus administration center."""
    front_y = depth / 2
    atrium_width = width * 0.32
    atrium_height = height * 0.78
    atrium_z = height * 0.50
    glass_y = front_y + 0.58

    box(
        "ADMIN__grand-atrium-reveal",
        (atrium_width + 0.34, 0.24, atrium_height + 0.28),
        (0, front_y + 0.14, atrium_z),
        mats["facade_frame"],
        root,
        0.025,
    )
    atrium = box(
        "ADMIN__grand-atrium",
        (atrium_width, 0.11, atrium_height),
        (0, glass_y, atrium_z),
        mats["admin_glass"],
        root,
        0.018,
    )
    atrium["layerRole"] = "landmark-atrium"

    # A compact showcase lobby sits between the original shell and the glazing. It is
    # intentionally shallow so the landmark keeps the approved footprint while gaining
    # parallax, warm depth, and recognizable human-scale furniture from the Web camera.
    lobby_backdrop = box(
        "ADMIN__lobby-backdrop",
        (atrium_width * 0.88, 0.07, atrium_height * 0.66),
        (0, front_y + 0.27, atrium_z * 0.93),
        mats["lobby_glow"],
        root,
        0.018,
    )
    lobby_backdrop["lightRole"] = "lobby-warm"
    lobby_backdrop["layerRole"] = "building-lighting"
    box(
        "ADMIN__lobby-floor",
        (atrium_width * 0.92, 0.66, 0.08),
        (0, front_y + 0.32, 0.20),
        mats["admin_stone_dark"],
        root,
        0.012,
    )
    box(
        "ADMIN__reception-desk",
        (1.18, 0.18, 0.48),
        (0, front_y + 0.40, 0.66),
        mats["architectural_bronze"],
        root,
        0.035,
    )
    box(
        "ADMIN__reception-counter",
        (1.34, 0.24, 0.10),
        (0, front_y + 0.42, 0.93),
        mats["admin_stone_light"],
        root,
        0.022,
    )
    for label, px in (("left", -0.82), ("right", 0.82)):
        box(
            f"ADMIN__lobby-sofa-{label}",
            (0.72, 0.24, 0.34),
            (px, front_y + 0.42, 0.47),
            mats["interior_storage"],
            root,
            0.055,
        )
        cylinder(
            f"ADMIN__lobby-planter-{label}",
            0.15,
            0.28,
            (px * 1.38, front_y + 0.42, 0.33),
            mats["architectural_bronze"],
            root,
            vertices=16,
        )
        cylinder(
            f"ADMIN__lobby-plant-{label}",
            0.12,
            0.42,
            (px * 1.38, front_y + 0.42, 0.68),
            mats["foliage"],
            root,
            vertices=12,
        )

    door_width = atrium_width * 0.28
    for label, px in (("left", -door_width * 0.53), ("right", door_width * 0.53)):
        box(
            f"ADMIN__entry-door-{label}",
            (door_width, 0.075, height * 0.29),
            (px, glass_y + 0.07, height * 0.165),
            mats["admin_glass"],
            root,
            0.010,
        )
        box(
            f"ADMIN__entry-door-handle-{label}",
            (0.035, 0.09, 0.42),
            (px + (-0.12 if label == "left" else 0.12), glass_y + 0.13, height * 0.17),
            mats["architectural_bronze"],
            root,
            0.008,
        )
    for index, px in enumerate((-atrium_width * 0.40, -atrium_width * 0.20, 0, atrium_width * 0.20, atrium_width * 0.40), start=1):
        box(
            f"ADMIN__atrium-mullion-{index:02d}",
            (0.065, 0.17, atrium_height + 0.10),
            (px, glass_y + 0.06, atrium_z),
            mats["architectural_bronze"],
            root,
            0.008,
        )
    for index, pz in enumerate((height * 0.33, height * 0.66), start=1):
        box(
            f"ADMIN__atrium-transom-{index:02d}",
            (atrium_width + 0.08, 0.17, 0.075),
            (0, glass_y + 0.06, pz),
            mats["architectural_bronze"],
            root,
            0.008,
        )

    wing_width = (width - atrium_width) / 2
    for side, label in ((-1, "left"), (1, "right")):
        wing_x = side * (atrium_width / 2 + wing_width / 2)
        box(
            f"ADMIN__stone-wing-{label}",
            (wing_width - 0.12, 0.15, height * 0.84),
            (wing_x, front_y + 0.075, height * 0.46),
            mats["admin_stone_light"],
            root,
            0.025,
        )
        for joint_index, joint_z in enumerate((height * 0.20, height * 0.36, height * 0.52, height * 0.68), start=1):
            box(
                f"ADMIN__stone-joint-{label}-horizontal-{joint_index:02d}",
                (wing_width - 0.24, 0.035, 0.025),
                (wing_x, front_y + 0.165, joint_z),
                mats["admin_stone_dark"],
                root,
                0.004,
            )
        for joint_index, offset in enumerate((-0.28, 0.28), start=1):
            box(
                f"ADMIN__stone-joint-{label}-vertical-{joint_index:02d}",
                (0.025, 0.035, height * 0.74),
                (wing_x + offset * wing_width, front_y + 0.165, height * 0.46),
                mats["admin_stone_dark"],
                root,
                0.004,
            )

    bay_xs = (-width * 0.38, -width * 0.25, width * 0.25, width * 0.38)
    window_height = height * 0.54
    window_z = height * 0.47
    for index, px in enumerate(bay_xs, start=1):
        box(
            f"ADMIN__window-reveal-{index:02d}",
            (1.02, 0.21, window_height + 0.22),
            (px, front_y + 0.18, window_z),
            mats["admin_stone_dark"],
            root,
            0.018,
        )
        box(
            f"ADMIN__wing-glass-{index:02d}",
            (0.84, 0.10, window_height),
            (px, front_y + 0.32, window_z),
            mats["admin_glass"],
            root,
            0.012,
        )
        box(
            f"ADMIN__window-frame-top-{index:02d}",
            (0.90, 0.22, 0.09),
            (px, front_y + 0.34, window_z + window_height / 2),
            mats["architectural_bronze"],
            root,
            0.008,
        )
        box(
            f"ADMIN__window-frame-bottom-{index:02d}",
            (0.90, 0.22, 0.09),
            (px, front_y + 0.34, window_z - window_height / 2),
            mats["architectural_bronze"],
            root,
            0.008,
        )
        for side in (-1, 1):
            box(
                f"ADMIN__window-frame-side-{index:02d}-{side:+d}",
                (0.075, 0.22, window_height),
                (px + side * 0.43, front_y + 0.34, window_z),
                mats["architectural_bronze"],
                root,
                0.008,
            )
        for level in (height * 0.33, height * 0.66):
            box(
                f"ADMIN__window-transom-{index:02d}-{int(level * 100)}",
                (0.84, 0.22, 0.060),
                (px, front_y + 0.34, level),
                mats["architectural_bronze"],
                root,
                0.005,
            )

    for index, (step_width, step_depth, step_height, y_offset) in enumerate([
        (4.80, 0.72, 0.14, 0.42),
        (4.20, 0.64, 0.14, 0.76),
        (3.60, 0.56, 0.14, 1.06),
    ], start=1):
        box(
            f"ADMIN__entrance-step-{index:02d}",
            (step_width, step_depth, step_height),
            (0, front_y + y_offset, step_height / 2),
            mats["concrete"],
            root,
            0.018,
        )

    column_height = height * 0.42
    for index, px in enumerate((-1.65, -0.62, 0.62, 1.65), start=1):
        cylinder(
            f"ADMIN__portico-column-{index:02d}",
            0.15,
            column_height,
            (px, front_y + 0.88, column_height / 2 + 0.18),
            mats["admin_stone_light"],
            root,
            vertices=16,
        )
        box(
            f"ADMIN__portico-column-base-{index:02d}",
            (0.42, 0.42, 0.18),
            (px, front_y + 0.88, 0.18),
            mats["admin_stone_dark"],
            root,
            0.035,
        )

    box(
        "ADMIN__grand-canopy",
        (width * 0.58, 1.48, 0.22),
        (0, front_y + 0.76, column_height + 0.24),
        mats["admin_stone_light"],
        root,
        0.035,
    )
    box(
        "ADMIN__grand-canopy-bronze-edge",
        (width * 0.60, 0.12, 0.16),
        (0, front_y + 1.48, column_height + 0.22),
        mats["architectural_bronze"],
        root,
        0.018,
    )
    box(
        "ADMIN__grand-canopy-soffit",
        (width * 0.54, 1.30, 0.055),
        (0, front_y + 0.76, column_height + 0.105),
        mats["architectural_bronze"],
        root,
        0.012,
    )
    for index, px in enumerate((-width * 0.17, 0, width * 0.17), start=1):
        canopy_light = box(
            f"ADMIN__canopy-linear-light-{index:02d}",
            (0.92, 0.56, 0.028),
            (px, front_y + 0.83, column_height + 0.070),
            mats["lobby_glow"],
            root,
            0.008,
        )
        canopy_light["lightRole"] = "lobby-warm"
        canopy_light["layerRole"] = "building-lighting"
    box(
        "ADMIN__crown-band",
        (width + 0.28, 0.20, 0.46),
        (0, front_y + 0.10, height - 0.22),
        mats["admin_stone_light"],
        root,
        0.028,
    )
    box(
        "ADMIN__crown-bronze-line",
        (width * 0.84, 0.10, 0.075),
        (0, front_y + 0.23, height - 0.18),
        mats["architectural_bronze"],
        root,
        0.010,
    )
    box(
        "ADMIN__roof-lantern",
        (atrium_width * 0.72, depth * 0.38, 0.58),
        (0, 0, height + 0.42),
        mats["admin_glass"],
        root,
        0.045,
    )

    box(
        "ADMIN__dropoff-porte-cochere",
        (width * 0.62, 1.02, 0.20),
        (0, front_y + 1.38, 2.34),
        mats["admin_stone_light"],
        root,
        0.035,
    )
    box(
        "ADMIN__dropoff-bronze-edge",
        (width * 0.65, 0.12, 0.16),
        (0, front_y + 1.91, 2.32),
        mats["architectural_bronze"],
        root,
        0.016,
    )
    for index, px in enumerate((-2.05, -0.72, 0.72, 2.05), start=1):
        cylinder(
            f"ADMIN__dropoff-column-{index:02d}",
            0.12,
            2.18,
            (px, front_y + 1.48, 1.13),
            mats["architectural_bronze"],
            root,
            vertices=16,
        )
        box(
            f"ADMIN__dropoff-column-base-{index:02d}",
            (0.34, 0.34, 0.14),
            (px, front_y + 1.48, 0.07),
            mats["admin_stone_dark"],
            root,
            0.025,
        )

    sign_z = height * 0.86
    box(
        "ADMIN__corporate-sign-backplate",
        (atrium_width * 0.92, 0.16, 0.52),
        (0, front_y + 0.40, sign_z),
        mats["admin_stone_dark"],
        root,
        0.018,
    )
    for index, px in enumerate((-0.72, -0.36, 0, 0.36, 0.72), start=1):
        box(
            f"ADMIN__corporate-sign-bar-{index:02d}",
            (0.20, 0.08, 0.18 + (index % 2) * 0.08),
            (px, front_y + 0.50, sign_z),
            mats["architectural_bronze"],
            root,
            0.012,
        )


def create_gatehouse_facade(width, depth, height, mats, root):
    """Add human-scale service details to the entry checkpoint."""
    front_y = depth / 2
    box("GATEHOUSE__window-reveal-01", (1.02, 0.16, 0.62), (0, front_y + 0.105, 0.83), mats["wall_secondary"], root, 0.015)
    box("GATEHOUSE__service-window-01", (0.88, 0.10, 0.48), (0, front_y + 0.19, 0.83), mats["glass"], root, 0.008)
    box("GATEHOUSE__canopy", (1.72, 0.84, 0.10), (0, front_y + 0.42, 1.34), mats["facade_frame"], root, 0.018)
    for index, px in enumerate((-0.63, 0.63), start=1):
        box(
            f"GATEHOUSE__canopy-bracket-{index:02d}",
            (0.08, 0.58, 0.08),
            (px, front_y + 0.29, 1.12),
            mats["facade_frame"],
            root,
            0.008,
            rotation=(math.radians(-20), 0, 0),
        )
    box("GATEHOUSE__entrance-plinth", (width + 0.30, 0.54, 0.16), (0, front_y + 0.29, 0.08), mats["concrete"], root, 0.022)
    for index, px in enumerate((-0.82, 0, 0.82), start=1):
        cylinder(
            f"GATEHOUSE__bollard-{index:02d}",
            0.055,
            0.66,
            (px, front_y + 0.72, 0.36),
            mats["pipe_band"],
            root,
            vertices=12,
        )


def building_art_palette(building_id, kind, mats):
    """Resolve a restrained material identity from each building's campus function."""
    if building_id == "administration":
        return {
            "direction": "executive-stone",
            "shell": mats["admin_wall"],
            "panel_light": mats["admin_stone_light"],
            "panel_mid": mats["admin_stone_dark"],
        }
    if building_id in {"front-warehouse", "east-warehouse"}:
        return {
            "direction": "warm-logistics",
            "shell": mats["warehouse_wall"],
            "panel_light": mats["warehouse_panel_light"],
            "panel_mid": mats["warehouse_panel_mid"],
        }
    if building_id == "east-process-hall":
        return {
            "direction": "process-blue-gray",
            "shell": mats["process_wall"],
            "panel_light": mats["process_panel_light"],
            "panel_mid": mats["process_panel_mid"],
        }
    if building_id in {"far-east-utility", "front-utility-annex"}:
        return {
            "direction": "dark-utility",
            "shell": mats["utility_wall"],
            "panel_light": mats["utility_panel_light"],
            "panel_mid": mats["utility_panel_mid"],
        }
    if building_id in {"laboratory", "gatehouse"} or kind == "office":
        return {
            "direction": "clean-technical",
            "shell": mats["laboratory_wall"],
            "panel_light": mats["laboratory_panel_light"],
            "panel_mid": mats["laboratory_panel_mid"],
        }
    return {
        "direction": "modern-production",
        "shell": mats["factory_wall"],
        "panel_light": mats["factory_panel_light"],
        "panel_mid": mats["factory_panel_mid"],
    }


def create_wall_cladding(building_id, width, depth, height, mats, root, art_palette):
    """Wrap every elevation in GLB-safe insulated panels and physical trims."""
    half_width = width / 2
    half_depth = depth / 2
    cladding_height = max(0.72, height - 0.46)
    cladding_z = 0.34 + cladding_height / 2

    horizontal_count = max(2, min(9, round(width / 1.55)))
    horizontal_panel_width = width / horizontal_count
    for index in range(horizontal_count):
        px = -half_width + horizontal_panel_width * (index + 0.5)
        front_panel = box(
            f"CLADDING__{building_id}__front-panel-{index + 1:02d}",
            (horizontal_panel_width - 0.032, 0.052, cladding_height),
            (px, half_depth + 0.030, cladding_z),
            art_palette["panel_light"] if index % 3 != 1 else art_palette["panel_mid"],
            root,
            0.004,
        )
        linked_mesh_instance(
            f"CLADDING__{building_id}__rear-panel-{index + 1:02d}",
            front_panel,
            (px, -half_depth - 0.030, cladding_z),
            root,
        )
        if index:
            joint_x = -half_width + horizontal_panel_width * index
            front_joint = box(
                f"CLADDING__{building_id}__front-shadow-joint-{index:02d}",
                (0.030, 0.030, cladding_height - 0.06),
                (joint_x, half_depth + 0.067, cladding_z),
                mats["facade_shadow_joint"],
                root,
                0.003,
            )
            front_joint["layerRole"] = "facade-shadow-joint"
            rear_joint = linked_mesh_instance(
                f"CLADDING__{building_id}__rear-shadow-joint-{index:02d}",
                front_joint,
                (joint_x, -half_depth - 0.067, cladding_z),
                root,
            )
            rear_joint["layerRole"] = "facade-shadow-joint"

    vertical_count = max(2, min(5, round(depth / 1.45)))
    vertical_panel_depth = depth / vertical_count
    for index in range(vertical_count):
        py = -half_depth + vertical_panel_depth * (index + 0.5)
        left_panel = box(
            f"CLADDING__{building_id}__left-panel-{index + 1:02d}",
            (0.052, vertical_panel_depth - 0.032, cladding_height),
            (-half_width - 0.030, py, cladding_z),
            art_palette["panel_light"] if index % 3 != 1 else art_palette["panel_mid"],
            root,
            0.004,
        )
        linked_mesh_instance(
            f"CLADDING__{building_id}__right-panel-{index + 1:02d}",
            left_panel,
            (half_width + 0.030, py, cladding_z),
            root,
        )
        if index:
            joint_y = -half_depth + vertical_panel_depth * index
            left_joint = box(
                f"CLADDING__{building_id}__left-shadow-joint-{index:02d}",
                (0.030, 0.030, cladding_height - 0.06),
                (-half_width - 0.067, joint_y, cladding_z),
                mats["facade_shadow_joint"],
                root,
                0.003,
            )
            left_joint["layerRole"] = "facade-shadow-joint"
            right_joint = linked_mesh_instance(
                f"CLADDING__{building_id}__right-shadow-joint-{index:02d}",
                left_joint,
                (half_width + 0.067, joint_y, cladding_z),
                root,
            )
            right_joint["layerRole"] = "facade-shadow-joint"

    for level, z in (("low", max(0.48, height * 0.28)), ("high", min(height - 0.34, height * 0.76))):
        front_batten = box(
            f"CLADDING__{building_id}__pressed-batten-front-{level}",
            (width - 0.16, 0.045, 0.050),
            (0, half_depth + 0.073, z),
            mats["wall_batten"],
            root,
            0.005,
        )
        linked_mesh_instance(
            f"CLADDING__{building_id}__pressed-batten-rear-{level}",
            front_batten,
            (0, -half_depth - 0.073, z),
            root,
        )
        left_batten = box(
            f"CLADDING__{building_id}__pressed-batten-left-{level}",
            (0.045, depth - 0.16, 0.050),
            (-half_width - 0.073, 0, z),
            mats["wall_batten"],
            root,
            0.005,
        )
        linked_mesh_instance(
            f"CLADDING__{building_id}__pressed-batten-right-{level}",
            left_batten,
            (half_width + 0.073, 0, z),
            root,
        )

    front_skirt = mark_construction(box(
        f"CLADDING__{building_id}__wall-skirt-front",
        (width - 0.10, 0.10, 0.32),
        (0, half_depth + 0.095, 0.16),
        mats["plinth"],
        root,
        0.030,
    ), "wall-plinth", 0.030)
    linked_mesh_instance(
        f"CLADDING__{building_id}__wall-skirt-rear",
        front_skirt,
        (0, -half_depth - 0.095, 0.16),
        root,
    )
    left_skirt = mark_construction(box(
        f"CLADDING__{building_id}__wall-skirt-left",
        (0.10, depth - 0.10, 0.32),
        (-half_width - 0.095, 0, 0.16),
        mats["plinth"],
        root,
        0.030,
    ), "wall-plinth", 0.030)
    linked_mesh_instance(
        f"CLADDING__{building_id}__wall-skirt-right",
        left_skirt,
        (half_width + 0.095, 0, 0.16),
        root,
    )

    front_left_corner = mark_construction(box(
        f"CLADDING__{building_id}__corner-trim-left",
        (0.12, 0.12, height - 0.14),
        (-half_width - 0.055, half_depth + 0.055, height / 2),
        mats["corner_flashing"],
        root,
        0.035,
    ), "corner-flashing", 0.035)
    for name, location in (
        ("corner-trim-right", (half_width + 0.055, half_depth + 0.055, height / 2)),
        ("corner-trim-rear-left", (-half_width - 0.055, -half_depth - 0.055, height / 2)),
        ("corner-trim-rear-right", (half_width + 0.055, -half_depth - 0.055, height / 2)),
    ):
        linked_mesh_instance(f"CLADDING__{building_id}__{name}", front_left_corner, location, root)

    front_datum = box(
        f"CLADDING__{building_id}__front-datum-band",
        (width - 0.18, 0.075, 0.065),
        (0, half_depth + 0.068, min(height - 0.42, max(0.72, height * 0.48))),
        mats["corner_flashing"],
        root,
        0.006,
    )
    linked_mesh_instance(
        f"CLADDING__{building_id}__rear-datum-band",
        front_datum,
        (0, -half_depth - 0.068, min(height - 0.42, max(0.72, height * 0.48))),
        root,
    )
    left_datum = box(
        f"CLADDING__{building_id}__left-datum-band",
        (0.075, depth - 0.18, 0.065),
        (-half_width - 0.068, 0, min(height - 0.42, max(0.72, height * 0.48))),
        mats["corner_flashing"],
        root,
        0.006,
    )
    linked_mesh_instance(
        f"CLADDING__{building_id}__right-datum-band",
        left_datum,
        (half_width + 0.068, 0, min(height - 0.42, max(0.72, height * 0.48))),
        root,
    )


def create_constructed_envelope(building_id, width, depth, height, kind, mats, root):
    """Add reusable architectural depth: openings, frame, roof edge, drainage, and services."""
    front_y = depth / 2
    bay_count = max(2, min(6, round(width / (1.15 if kind in ("office", "administration") else 1.75))))
    bay_width = min(0.74, width * 0.72 / bay_count)
    opening_height = min(0.78, max(0.38, height * 0.22))
    opening_z = min(height - 0.54, max(0.78, height * 0.62))
    span = width * 0.70

    opening_depth = 0.11
    for index in range(bay_count):
        px = -span / 2 + (index + 0.5) * span / bay_count
        reveal = empty(
            f"FACADE__{building_id}__reveal-{index + 1:02d}",
            (px, front_y + 0.13, opening_z),
            root,
        )
        mark_construction(reveal, "opening-reveal", opening_depth=opening_depth)
        reveal["layerRole"] = "facade-reveal"
        reveal_y = front_y + 0.13
        reveal_width = bay_width + 0.17
        reveal_height = opening_height + 0.17
        for part, size, location in (
            ("top", (reveal_width, 0.16, 0.085), (px, reveal_y, opening_z + reveal_height / 2)),
            ("bottom", (reveal_width, 0.16, 0.085), (px, reveal_y, opening_z - reveal_height / 2)),
            ("left", (0.085, 0.16, opening_height), (px - reveal_width / 2, reveal_y, opening_z)),
            ("right", (0.085, 0.16, opening_height), (px + reveal_width / 2, reveal_y, opening_z)),
        ):
            return_piece = box(
                f"FACADE__{building_id}__reveal-return-{index + 1:02d}-{part}",
                size,
                location,
                mats["wall_secondary"],
                root,
                0.026,
            )
            return_piece["layerRole"] = "facade-reveal-return"
        glass = box(
            f"FACADE__{building_id}__glass-{index + 1:02d}",
            (bay_width, 0.04, opening_height),
            (px, front_y + 0.075, opening_z),
            mats["glass"],
            root,
            0.008,
        )
        glass["layerRole"] = "facade-glazing"
        glass["openingDepth"] = opening_depth
        frame = box(
            f"FACADE__{building_id}__frame-{index + 1:02d}",
            (0.055, 0.12, opening_height + 0.12),
            (px - bay_width / 2 - 0.045, front_y + 0.155, opening_z),
            mats["facade_frame"],
            root,
            0.006,
        )
        frame["layerRole"] = "facade-frame"
        sill = box(
            f"FACADE__{building_id}__sill-{index + 1:02d}",
            (bay_width + 0.16, 0.17, 0.065),
            (px, front_y + 0.155, opening_z - opening_height / 2 - 0.055),
            mats["corner_flashing"],
            root,
            0.030,
        )
        mark_construction(sill, "window-sill", 0.030)
        drip_edge = box(
            f"FACADE__{building_id}__drip-edge-{index + 1:02d}",
            (bay_width + 0.20, 0.22, 0.055),
            (px, front_y + 0.17, opening_z + opening_height / 2 + 0.075),
            mats["corner_flashing"],
            root,
            0.030,
        )
        mark_construction(drip_edge, "drip-edge", 0.030)

    parapet_height = height + 0.16
    for edge, size, location in (
        ("front", (width + 0.20, 0.12, 0.24), (0, front_y + 0.02, parapet_height)),
        ("rear", (width + 0.20, 0.12, 0.24), (0, -front_y - 0.02, parapet_height)),
        ("left", (0.12, depth, 0.24), (-width / 2 - 0.02, 0, parapet_height)),
        ("right", (0.12, depth, 0.24), (width / 2 + 0.02, 0, parapet_height)),
    ):
        parapet = box(f"ROOF__{building_id}__parapet-{edge}", size, location, mats["corner_flashing"], root, 0.035)
        mark_construction(parapet, "roof-parapet", 0.035)
    for face, size, location in (
        ("front", (width - 0.18, 0.10, 0.10), (0, front_y + 0.15, height + 0.02)),
        ("rear", (width - 0.18, 0.10, 0.10), (0, -front_y - 0.15, height + 0.02)),
        ("left", (0.10, depth - 0.18, 0.10), (-width / 2 - 0.15, 0, height + 0.02)),
        ("right", (0.10, depth - 0.18, 0.10), (width / 2 + 0.15, 0, height + 0.02)),
    ):
        gutter = box(f"ROOF__{building_id}__gutter-{face}", size, location, mats["gutter"], root, 0.025)
        mark_construction(gutter, "roof-drainage", 0.025)

    for index, px in enumerate((-width * 0.43, width * 0.43), start=1):
        pipe = cylinder(
            f"SERVICE__{building_id}__downpipe-{index:02d}",
            0.045,
            max(0.65, height - 0.20),
            (px, front_y + 0.17, height / 2),
            mats["gutter"],
            root,
            vertices=10,
        )
        pipe["layerRole"] = "facade-service"
        mark_construction(pipe, "roof-drainage")
        rear_pipe = cylinder(
            f"SERVICE__{building_id}__downpipe-rear-{index:02d}",
            0.045,
            max(0.65, height - 0.20),
            (px, -front_y - 0.17, height / 2),
            mats["gutter"],
            root,
            vertices=10,
        )
        rear_pipe["layerRole"] = "facade-service"
        mark_construction(rear_pipe, "roof-drainage")

    rear_door_x = width * 0.40
    rear_door_height = min(1.42, height * 0.58)
    rear_reveal = box(
        f"SERVICE__{building_id}__rear-door-reveal",
        (0.86, 0.20, rear_door_height + 0.18),
        (rear_door_x, -front_y - 0.08, rear_door_height / 2),
        mats["facade_frame"],
        root,
        0.030,
    )
    mark_construction(rear_reveal, "opening-reveal", 0.030, opening_depth)
    rear_door = box(
        f"SERVICE__{building_id}__rear-door",
        (0.68, 0.10, rear_door_height),
        (rear_door_x, -front_y - 0.20, rear_door_height / 2),
        mats["wall_secondary"],
        root,
        0.014,
    )
    rear_door["layerRole"] = "facade-service-access"
    rear_door["openingDepth"] = opening_depth
    rear_drip = box(
        f"SERVICE__{building_id}__rear-door-canopy",
        (1.05, 0.52, 0.10),
        (rear_door_x, -front_y - 0.28, rear_door_height + 0.16),
        mats["roof"],
        root,
        0.030,
    )
    mark_construction(rear_drip, "drip-edge", 0.030)

    service_width = min(1.10, width * 0.32)
    service_z = min(height - 0.48, max(0.72, height * 0.34))
    side_feature_y = -depth * 0.10
    if kind == "factory":
        louver_depth = min(1.30, depth * 0.46)
        box(
            f"SERVICE__{building_id}__right-louver-bank",
            (0.16, louver_depth, 0.72),
            (width / 2 + 0.18, side_feature_y, service_z),
            mats["interior_equipment"],
            root,
            0.014,
        )
        for index in range(5):
            box(
                f"SERVICE__{building_id}__right-louver-slat-{index + 1:02d}",
                (0.055, louver_depth * 0.86, 0.035),
                (width / 2 + 0.28, side_feature_y, service_z - 0.23 + index * 0.115),
                mats["gutter"],
                root,
                0.004,
            )
    else:
        side_window_height = min(0.82, height * 0.28)
        box(
            f"SERVICE__{building_id}__right-window-reveal-01",
            (0.16, 0.96, side_window_height + 0.16),
            (width / 2 + 0.09, side_feature_y, opening_z),
            mats["facade_frame"],
            root,
            0.012,
        )
        side_window = box(
            f"SERVICE__{building_id}__right-window-01",
            (0.08, 0.80, side_window_height),
            (width / 2 + 0.20, side_feature_y, opening_z),
            mats["glass"],
            root,
            0.008,
        )
        side_window["layerRole"] = "facade-glazing"

    box(
        f"SERVICE__{building_id}__panel",
        (service_width, 0.13, 0.54),
        (-width * 0.27, front_y + 0.17, service_z),
        mats["interior_equipment"],
        root,
        0.012,
    )
    for index in range(4):
        px = -width * 0.27 - service_width * 0.30 + index * service_width * 0.20
        box(
            f"SERVICE__{building_id}__louver-{index + 1:02d}",
            (service_width * 0.13, 0.06, 0.34),
            (px, front_y + 0.26, service_z),
            mats["facade_frame"],
            root,
            0.006,
        )


def create_specialized_building_facade(building_id, width, depth, height, mats, root):
    """Give warehouse, laboratory, and utility buildings an unmistakable use identity."""
    front_y = depth / 2
    if building_id == "front-warehouse":
        box("WAREHOUSE__identity-band", (width - 0.35, 0.16, 0.46), (0, front_y + 0.18, height - 0.56), mats["facade_frame"], root, 0.018)
        loading_y = -front_y
        box("WAREHOUSE__protective-plinth", (width - 0.22, 0.18, 0.46), (0, loading_y - 0.10, 0.25), mats["plinth"], root, 0.018)
        box("WAREHOUSE__dock-platform", (width * 0.88, 0.72, 0.32), (0, loading_y - 0.38, 0.16), mats["concrete"], root, 0.028)
        box("WAREHOUSE__dock-canopy", (width * 0.91, 0.82, 0.14), (0, loading_y - 0.43, 2.48), mats["roof"], root, 0.024)
        for index, px in enumerate((-width * 0.38, -width * 0.13, width * 0.13, width * 0.38), start=1):
            box(
                f"WAREHOUSE__dock-canopy-bracket-{index:02d}",
                (0.10, 0.58, 0.10),
                (px, loading_y - 0.26, 2.20),
                mats["facade_frame"],
                root,
                0.008,
                rotation=(math.radians(34), 0, 0),
            )
        for index, px in enumerate((-2.45, 0.0, 2.45), start=1):
            box(f"WAREHOUSE__loading-door-reveal-{index:02d}", (1.88, 0.24, 2.08), (px, loading_y - 0.11, 1.04), mats["facade_frame"], root, 0.028)
            box(f"WAREHOUSE__loading-door-{index:02d}", (1.62, 0.13, 1.82), (px, loading_y - 0.19, 0.94), mats["interior_storage"], root, 0.025)
            box(f"WAREHOUSE__door-header-{index:02d}", (1.96, 0.22, 0.28), (px, loading_y - 0.18, 2.16), mats["safety_yellow"], root, 0.018)
            for slat in range(5):
                box(
                    f"WAREHOUSE__door-slat-{index:02d}-{slat + 1:02d}",
                    (1.46, 0.045, 0.035),
                    (px, loading_y - 0.27, 0.30 + slat * 0.30),
                    mats["gutter"],
                    root,
                    0.004,
                )
            box(f"WAREHOUSE__dock-light-{index:02d}", (0.34, 0.22, 0.10), (px, loading_y - 0.28, 2.28), mats["white"], root, 0.018)
            box(f"WAREHOUSE__high-vent-{index:02d}", (1.30, 0.12, 0.32), (px, loading_y - 0.20, height - 0.44), mats["gutter"], root, 0.012)
            box(f"WAREHOUSE__dock-leveler-{index:02d}", (1.30, 0.58, 0.08), (px, loading_y - 0.58, 0.36), mats["gutter"], root, 0.012)
            for side in (-1, 1):
                cylinder(
                    f"WAREHOUSE__dock-bollard-{index:02d}-{side:+d}",
                    0.065,
                    0.68,
                    (px + side * 0.82, loading_y - 0.72, 0.36),
                    mats["safety_yellow"],
                    root,
                    vertices=12,
                )

    elif building_id == "east-warehouse":
        box("FINISHED__identity-band", (width - 0.28, 0.15, 0.38), (0, front_y + 0.16, height - 0.48), mats["accent"], root, 0.018)
        box("FINISHED__dock-platform", (width * 0.72, 0.70, 0.30), (0, front_y + 0.38, 0.15), mats["concrete"], root, 0.028)
        box("FINISHED__dock-canopy", (width * 0.76, 0.82, 0.13), (0, front_y + 0.42, 2.32), mats["roof"], root, 0.022)
        for index, px in enumerate((-2.05, 2.05), start=1):
            box(f"FINISHED__door-reveal-{index:02d}", (1.92, 0.22, 2.10), (px, front_y + 0.10, 1.05), mats["facade_frame"], root, 0.026)
            box(f"FINISHED__sectional-door-{index:02d}", (1.66, 0.12, 1.84), (px, front_y + 0.20, 0.95), mats["wall_secondary"], root, 0.022)
            for slat in range(6):
                box(
                    f"FINISHED__door-slat-{index:02d}-{slat + 1:02d}",
                    (1.48, 0.045, 0.032),
                    (px, front_y + 0.28, 0.28 + slat * 0.29),
                    mats["gutter"],
                    root,
                    0.004,
                )
            for side in (-1, 1):
                box(
                    f"FINISHED__dock-bumper-{index:02d}-{side:+d}",
                    (0.13, 0.17, 0.38),
                    (px + side * 0.68, front_y + 0.66, 0.42),
                    mats["dock_rubber"],
                    root,
                    0.022,
                )
            box(f"FINISHED__high-vent-{index:02d}", (1.30, 0.13, 0.30), (px, front_y + 0.23, height - 0.44), mats["gutter"], root, 0.012)

    elif building_id == "east-process-hall":
        box("PROCESS_HALL__louver-strip", (width * 0.72, 0.16, 0.76), (0, front_y + 0.18, height * 0.48), mats["interior_equipment"], root, 0.018)
        for slat in range(7):
            box(
                f"PROCESS_HALL__louver-slat-{slat + 1:02d}",
                (width * 0.68, 0.055, 0.040),
                (0, front_y + 0.28, height * 0.25 + slat * 0.105),
                mats["gutter"],
                root,
                0.004,
            )
        frame_x = width * 0.24
        box("PROCESS_HALL__pipe-entry-frame", (2.25, 0.20, 0.18), (frame_x, front_y + 0.30, 2.56), mats["facade_frame"], root, 0.016)
        for side in (-1, 1):
            box(
                f"PROCESS_HALL__pipe-entry-post-{side:+d}",
                (0.14, 0.20, 1.82),
                (frame_x + side * 1.04, front_y + 0.30, 1.62),
                mats["facade_frame"],
                root,
                0.014,
            )
        for index, px in enumerate((frame_x - 0.62, frame_x, frame_x + 0.62), start=1):
            cylinder(
                f"PROCESS_HALL__pipe-penetration-{index:02d}",
                0.085,
                0.62,
                (px, front_y + 0.34, 1.82),
                mats["pipe_band" if index == 2 else "pipe"],
                root,
                rotation=(math.pi / 2, 0, 0),
                vertices=12,
            )
        box("PROCESS_HALL__scrubber-plinth", (1.28, 1.18, 0.18), (width * 0.22, -depth * 0.10, height + 0.28), mats["concrete"], root, 0.022)
        cylinder("PROCESS_HALL__roof-scrubber", 0.40, 1.18, (width * 0.22, -depth * 0.10, height + 0.94), mats["gutter"], root, vertices=20)
        cylinder("PROCESS_HALL__roof-scrubber-cap", 0.47, 0.13, (width * 0.22, -depth * 0.10, height + 1.59), mats["roof"], root, vertices=20)

    elif building_id == "far-east-utility":
        box("POWER__louver-bank", (width * 0.78, 0.16, 1.02), (0, front_y + 0.18, height * 0.45), mats["interior_equipment"], root, 0.020)
        for slat in range(8):
            box(
                f"POWER__louver-slat-{slat + 1:02d}",
                (width * 0.72, 0.055, 0.040),
                (0, front_y + 0.28, height * 0.22 + slat * 0.105),
                mats["gutter"],
                root,
                0.004,
            )
        box("POWER__roof-equipment-skid", (width * 0.80, depth * 0.62, 0.18), (0, 0, height + 0.28), mats["concrete"], root, 0.022)
        for index, px in enumerate((-width * 0.22, width * 0.22), start=1):
            box(
                f"POWER__roof-equipment-{index:02d}",
                (0.92, depth * 0.40, 0.62),
                (px, 0, height + 0.66),
                mats["interior_equipment"],
                root,
                0.035,
            )
            cylinder(
                f"POWER__exhaust-stack-{index:02d}",
                0.10,
                0.92,
                (px, -depth * 0.30, height + 0.86),
                mats["pipe"],
                root,
                vertices=12,
            )
            cylinder(
                f"POWER__exhaust-cap-{index:02d}",
                0.16,
                0.09,
                (px, -depth * 0.30, height + 1.36),
                mats["gutter"],
                root,
                vertices=12,
            )

    elif building_id == "laboratory":
        curtain = box("LAB__curtain-wall", (width * 0.72, 0.18, height * 0.64), (0, front_y + 0.18, height * 0.47), mats["glass"], root, 0.02)
        curtain["facadeType"] = "laboratory-curtain-wall"
        for index in range(7):
            px = -width * 0.34 + index * width * 0.68 / 6
            box(f"LAB__curtain-mullion-{index + 1:02d}", (0.07, 0.12, height * 0.68), (px, front_y + 0.30, height * 0.47), mats["facade_frame"], root, 0.006)
        box("LAB__entrance-canopy", (2.2, 0.78, 0.14), (0, front_y + 0.55, 1.35), mats["roof"], root, 0.02)
        box("LAB__recessed-entry-frame", (1.70, 0.28, 2.10), (0, front_y + 0.11, 1.06), mats["facade_frame"], root, 0.025)
        box("LAB__parapet-band", (width + 0.18, 0.20, 0.36), (0, front_y + 0.10, height - 0.18), mats["wall_secondary"], root, 0.02)
        for index, px in enumerate((-2.6, 0.0, 2.6), start=1):
            cylinder(f"LAB__exhaust-stack-{index:02d}", 0.11, 1.05, (px, 0, height + 0.70), mats["pipe"], root, vertices=12)
            cylinder(f"LAB__exhaust-cap-{index:02d}", 0.18, 0.09, (px, 0, height + 1.24), mats["gutter"], root, vertices=12)

    elif building_id == "front-utility-annex":
        box("UTILITY__equipment-plinth", (width - 0.18, 0.20, 0.54), (0, front_y + 0.10, 0.28), mats["plinth"], root, 0.018)
        box("UTILITY__service-canopy", (width * 0.88, 0.62, 0.13), (0, front_y + 0.40, height * 0.66), mats["roof"], root, 0.02)
        for index, px in enumerate((-2.55, 0.0, 2.55), start=1):
            bank = box(f"UTILITY__louver-bank-{index:02d}", (1.55, 0.16, 0.86), (px, front_y + 0.20, height * 0.43), mats["interior_equipment"], root, 0.02)
            bank["facadeType"] = "utility-louver"
            for slat in range(6):
                box(
                    f"UTILITY__louver-slat-{index:02d}-{slat + 1:02d}",
                    (1.38, 0.055, 0.045),
                    (px, front_y + 0.30, height * 0.16 + slat * 0.12),
                    mats["gutter"],
                    root,
                    0.004,
                )
        box("UTILITY__cable-tray", (width * 0.82, 0.20, 0.16), (0, front_y + 0.30, height - 0.22), mats["pipe"], root, 0.012)
        box("UTILITY__hazard-sign", (0.72, 0.08, 0.58), (width * 0.39, front_y + 0.30, 1.18), mats["safety_yellow"], root, 0.018)


def create_building_lighting_and_wayfinding(building_id, width, depth, height, kind, mats, root, art_palette):
    """Add restrained entry, task, and identity lighting with Web-readable roles."""
    front_y = depth / 2
    entry_z = min(1.58, height * 0.58)
    entry_span = min(width * 0.23, 1.72)

    for index, px in enumerate((-entry_span, entry_span), start=1):
        box(
            f"LIGHT__{building_id}__entry-housing-{index:02d}",
            (0.38, 0.16, 0.25),
            (px, front_y + 0.15, entry_z),
            mats["facade_frame"],
            root,
            0.025,
        )
        fixture = box(
            f"LIGHT__{building_id}__entry-{index:02d}",
            (0.27, 0.07, 0.12),
            (px, front_y + 0.255, entry_z - 0.025),
            mats["entry_light_warm"],
            root,
            0.018,
        )
        fixture["lightRole"] = "entry-warm"
        fixture["layerRole"] = "building-lighting"

    sign_width = min(1.08, max(0.58, width * 0.18))
    sign_x = min(width * 0.34, width / 2 - sign_width / 2 - 0.16)
    sign_z = min(height * 0.74, height - 0.42)
    box(
        f"WAYFINDING__{building_id}__identity-frame",
        (sign_width + 0.16, 0.15, 0.52),
        (sign_x, front_y + 0.16, sign_z),
        mats["facade_frame"],
        root,
        0.025,
    )
    sign = box(
        f"WAYFINDING__{building_id}__identity-panel",
        (sign_width, 0.065, 0.38),
        (sign_x, front_y + 0.275, sign_z),
        mats["wayfinding_amber"],
        root,
        0.018,
    )
    sign["lightRole"] = "wayfinding-amber"
    sign["layerRole"] = "building-wayfinding"
    sign["buildingId"] = building_id
    for index, scale in enumerate((0.62, 0.42, 0.76), start=1):
        box(
            f"WAYFINDING__{building_id}__code-bar-{index:02d}",
            (sign_width * scale * 0.22, 0.035, 0.055),
            (sign_x - sign_width * 0.30 + index * sign_width * 0.15, front_y + 0.325, sign_z),
            art_palette["panel_mid"],
            root,
            0.006,
        )

    task_buildings = {"main-production-hall", "front-warehouse", "east-warehouse", "east-process-hall"}
    if building_id in task_buildings:
        task_z = min(height * 0.72, height - 0.48)
        for index, px in enumerate((-width * 0.28, width * 0.28), start=1):
            box(
                f"LIGHT__{building_id}__task-hood-{index:02d}",
                (0.54, 0.26, 0.14),
                (px, front_y + 0.18, task_z + 0.10),
                mats["facade_frame"],
                root,
                0.025,
            )
            fixture = box(
                f"LIGHT__{building_id}__task-{index:02d}",
                (0.42, 0.09, 0.10),
                (px, front_y + 0.33, task_z),
                mats["task_light_cool"],
                root,
                0.015,
            )
            fixture["lightRole"] = "task-cool"
            fixture["layerRole"] = "building-lighting"


def create_building_surface_age(building_id, width, depth, height, kind, mats, root):
    """Add restrained, GLB-safe facade weathering without changing building massing."""
    detail = empty(f"SURFACE_DETAIL__{building_id}", parent=root)
    detail["layerRole"] = "building-surface-age"
    detail["designIntent"] = "subtle four-sided use marks and roof patina"
    half_width = width / 2
    half_depth = depth / 2
    facade_mat = mats["facade_weathering_light"] if kind == "administration" else mats["facade_weathering"]

    base_specs = (
        ("front", (width - 0.22, 0.018, 0.24), (0, half_depth + 0.061, 0.18)),
        ("rear", (width - 0.22, 0.018, 0.24), (0, -half_depth - 0.061, 0.18)),
        ("left", (0.018, depth - 0.22, 0.24), (-half_width - 0.061, 0, 0.18)),
        ("right", (0.018, depth - 0.22, 0.24), (half_width + 0.061, 0, 0.18)),
    )
    for side_name, size, location in base_specs:
        band = box(
            f"SURFACE_DETAIL__{building_id}__base-{side_name}",
            size,
            location,
            facade_mat,
            detail,
            0.003,
        )
        band["layerRole"] = "facade-base-weathering"
        band["detailTier"] = "micro"

    streak_height = max(0.44, min(0.82, height * 0.16))
    streak_z = min(height - streak_height * 0.45, height * 0.66)
    streak_specs = [
        ("front", (0.10, 0.014, streak_height), (-width * 0.31, half_depth + 0.071, streak_z)),
        ("rear", (0.13, 0.014, streak_height * 0.78), (width * 0.24, -half_depth - 0.071, streak_z * 0.94)),
    ]
    if kind != "administration":
        streak_specs.extend((
            ("left", (0.014, 0.11, streak_height * 0.86), (-half_width - 0.071, -depth * 0.18, streak_z * 0.97)),
            ("right", (0.014, 0.09, streak_height * 0.68), (half_width + 0.071, depth * 0.22, streak_z * 0.91)),
        ))
    for index, (side_name, size, location) in enumerate(streak_specs, start=1):
        streak = box(
            f"SURFACE_DETAIL__{building_id}__streak-{index:02d}-{side_name}",
            size,
            location,
            facade_mat,
            detail,
            0.003,
        )
        streak["layerRole"] = "facade-rain-streak"
        streak["detailTier"] = "micro"

    for index, x_ratio in enumerate((-0.22, 0.23), start=1):
        patina = box(
            f"SURFACE_DETAIL__{building_id}__roof-patina-{index:02d}",
            (max(0.72, width * 0.30), max(0.42, depth * 0.18), 0.012),
            (width * x_ratio, depth * (-0.14 if index == 1 else 0.16), height + 0.227),
            mats["roof_patina"],
            detail,
            0.006,
        )
        patina["layerRole"] = "roof-patina"
        patina["detailTier"] = "micro"


def create_recessed_entry_doors(building_id, width, depth, height, mats, root):
    opening_depth = 0.11
    door_count = 3 if width > 7 else 2
    for index in range(door_count):
        px = (index - (door_count - 1) / 2) * min(1.5, width / 3.4)
        door_height = min(1.15, height * 0.46)
        door_z = min(0.58, height * 0.23)
        door = box(
            f"{building_id}__door-{index + 1:02d}",
            (0.72, 0.04, door_height),
            (px, depth / 2 + 0.075, door_z),
            mats["accent"],
            root,
            0.015,
        )
        door["openingDepth"] = opening_depth
        for side in (-1, 1):
            jamb = box(
                f"FACADE__{building_id}__door-jamb-{index + 1:02d}-{side:+d}",
                (0.085, 0.16, door_height + 0.10),
                (px + side * 0.405, depth / 2 + 0.13, door_z),
                mats["wall_secondary"],
                root,
                0.026,
            )
            jamb["layerRole"] = "facade-door-return"
        door_head = box(
            f"FACADE__{building_id}__door-head-{index + 1:02d}",
            (0.89, 0.18, 0.10),
            (px, depth / 2 + 0.14, door_z + door_height / 2 + 0.05),
            mats["corner_flashing"],
            root,
            0.030,
        )
        mark_construction(door_head, "drip-edge", 0.030)


def create_rear_service_envelope(building_id, width, depth, height, mats, root):
    """Give every building a restrained, functional rear elevation and roof service cue."""
    rear_y = -depth / 2
    service = empty(f"SERVICE_ENVELOPE__{building_id}", parent=root)
    service["buildingId"] = building_id
    service["realismSystem"] = "rear-and-roof-operations"

    def tag(obj, role):
        obj["buildingId"] = building_id
        obj["serviceEnvelopeRole"] = role
        obj["layerRole"] = "building-service-envelope"
        return obj

    pad_width = min(max(2.2, width * 0.52), 5.2)
    pad_depth = min(1.22, max(0.82, depth * 0.30))
    tag(box(
        f"SERVICE_ENVELOPE__{building_id}__pad",
        (pad_width, pad_depth, 0.10),
        (0, rear_y - pad_depth / 2 - 0.10, 0.065),
        mats["loading_concrete"], service, 0.035,
    ), "rear-service-pad")

    door_x = -min(width * 0.22, 1.25)
    door_width = min(0.82, width * 0.30)
    door_height = min(1.36, max(0.92, height * 0.42))
    tag(box(
        f"SERVICE_ENVELOPE__{building_id}__door",
        (door_width, 0.10, door_height),
        (door_x, rear_y - 0.085, door_height / 2 + 0.12),
        mats["gutter"], service, 0.025,
    ), "rear-service-door")
    for side in (-1, 1):
        box(
            f"SERVICE_ENVELOPE__{building_id}__door-jamb-{side:+d}",
            (0.075, 0.15, door_height + 0.14),
            (door_x + side * (door_width / 2 + 0.055), rear_y - 0.12, door_height / 2 + 0.12),
            mats["facade_frame"], service, 0.018,
        )
    box(
        f"SERVICE_ENVELOPE__{building_id}__canopy",
        (door_width + 0.42, 0.62, 0.09),
        (door_x, rear_y - 0.31, door_height + 0.27),
        mats["corner_flashing"], service, 0.025,
    )

    vent_x = min(width * 0.22, 1.25)
    vent_width = min(1.12, width * 0.34)
    vent_height = min(0.62, max(0.40, height * 0.18))
    tag(box(
        f"SERVICE_ENVELOPE__{building_id}__vent-back",
        (vent_width, 0.075, vent_height),
        (vent_x, rear_y - 0.075, min(height - 0.46, 1.22)),
        mats["facade_frame"], service, 0.018,
    ), "rear-ventilation")
    for louver_index in range(4):
        box(
            f"SERVICE_ENVELOPE__{building_id}__vent-louver-{louver_index + 1:02d}",
            (vent_width * 0.86, 0.075, 0.045),
            (vent_x, rear_y - 0.135, min(height - 0.67, 1.01) + louver_index * vent_height * 0.22),
            mats["vent"], service, 0.006,
        )

    for bollard_index, side in enumerate((-1, 1), start=1):
        bollard = cylinder(
            f"SERVICE_ENVELOPE__{building_id}__bollard-{bollard_index:02d}",
            0.055, 0.58,
            (door_x + side * (door_width / 2 + 0.32), rear_y - pad_depth * 0.55, 0.34),
            mats["safety_yellow"], service, vertices=10,
        )
        tag(bollard, "rear-impact-protection")

    marker = box(
        f"SERVICE_ENVELOPE__{building_id}__roof-zone",
        (min(2.6, max(1.2, width * 0.28)), 0.12, 0.035),
        (0, -depth * 0.18, height + 0.27),
        mats["roof_rib"], service, 0.008,
    )
    tag(marker, "roof-maintenance-zone")
    return service


def create_building_identity(building_id, width, depth, height, mats, root):
    """Add a removable, pale-material silhouette system that communicates building function."""
    identity_name = f"IDENTITY__{building_id}"
    existing = bpy.data.objects.get(identity_name)
    if existing:
        remove_object_tree(existing)
    identity_role, functional_zone, identity_tier = BUILDING_IDENTITY_PROFILES[building_id]
    identity = empty(identity_name, parent=root)
    identity["buildingId"] = building_id
    identity["identityRole"] = identity_role
    identity["functionalZone"] = functional_zone
    identity["identityTier"] = identity_tier
    identity["layerRole"] = "building-identity"

    def mark(obj, detail_role, visibility_tier="far"):
        obj["buildingId"] = building_id
        obj["identityRole"] = identity_role
        obj["identityDetailRole"] = detail_role
        obj["visibilityTier"] = visibility_tier
        return obj

    front_y = depth / 2

    if building_id == "administration":
        lobby_height = min(4.55, height * 0.74)
        mark(box(
            f"{identity_name}__two-story-lobby",
            (width * 0.38, 0.34, lobby_height),
            (0, front_y + 0.24, lobby_height / 2 + 0.12),
            mats["admin_glass"], identity, 0.025,
        ), "two-story-lobby")
        mark(box(
            f"{identity_name}__vestibule",
            (width * 0.28, 0.82, 2.18),
            (0, front_y + 0.48, 1.12),
            mats["admin_glass"], identity, 0.03,
        ), "recessed-vestibule")
        mark(box(
            f"{identity_name}__canopy-soffit",
            (width * 0.62, 1.34, 0.16),
            (0, front_y + 0.66, 2.48),
            mats["admin_stone_light"], identity, 0.035,
        ), "arrival-canopy")
        for column_index, px in enumerate((-width * 0.25, width * 0.25), start=1):
            mark(cylinder(
                f"{identity_name}__canopy-column-{column_index:02d}",
                0.13, 2.28, (px, front_y + 1.12, 1.18),
                mats["architectural_bronze"], identity, vertices=16,
            ), "arrival-column", "mid")
        for step_index in range(3):
            step_width = width * (0.70 - step_index * 0.06)
            mark(box(
                f"{identity_name}__forecourt-step-{step_index + 1:02d}",
                (step_width, 0.62 + step_index * 0.22, 0.10 + step_index * 0.035),
                (0, front_y + 1.38 + step_index * 0.16, 0.05 + step_index * 0.055),
                mats["admin_stone_light"], identity, 0.025,
            ), "stepped-forecourt", "mid")
        mark(box(
            f"{identity_name}__side-service-entry",
            (0.22, 1.42, 2.06),
            (width / 2 + 0.13, -depth * 0.12, 1.08),
            mats["facade_frame"], identity, 0.025,
        ), "side-service-entry")
        mark(box(
            f"{identity_name}__corporate-sign",
            (width * 0.32, 0.10, 0.38),
            (width * 0.20, front_y + 1.36, 2.08),
            mats["architectural_bronze"], identity, 0.018,
        ), "corporate-wayfinding", "mid")

    elif building_id == "main-production-hall":
        monitor_y = -depth * 0.08
        monitor_width = width * 0.56
        monitor_depth = depth * 0.34
        mark(box(
            f"{identity_name}__monitor-shell",
            (monitor_width, monitor_depth, 0.72),
            (0, monitor_y, height + 0.52),
            mats["factory_panel_light"], identity, 0.035,
        ), "roof-monitor")
        mark(box(
            f"{identity_name}__monitor-clerestory-front",
            (monitor_width * 0.90, 0.10, 0.30),
            (0, monitor_y + monitor_depth / 2 + 0.04, height + 0.50),
            mats["glass"], identity, 0.012,
        ), "monitor-clerestory")
        mark(box(
            f"{identity_name}__monitor-cap",
            (monitor_width + 0.24, monitor_depth + 0.20, 0.14),
            (0, monitor_y, height + 0.95),
            mats["roof"], identity, 0.025,
        ), "monitor-cap")
        for bay_index, px in enumerate((-width * 0.40, -width * 0.20, 0, width * 0.20, width * 0.40), start=1):
            mark(box(
                f"{identity_name}__crane-bay-pier-{bay_index:02d}",
                (0.13, 0.30, height * 0.82),
                (px, front_y + 0.28, height * 0.43),
                mats["factory_panel_mid"], identity, 0.018,
            ), "crane-bay-rhythm", "mid")
            if bay_index < 5:
                mark(box(
                    f"{identity_name}__crane-bay-head-{bay_index:02d}",
                    (width * 0.19, 0.32, 0.13),
                    (px + width * 0.10, front_y + 0.28, height * 0.84),
                    mats["facade_frame"], identity, 0.014,
                ), "crane-bay-rhythm", "mid")

    elif building_id == "front-warehouse":
        loading_y = -front_y
        mark(box(
            f"{identity_name}__dispatch-pod",
            (width * 0.24, 0.86, 2.42),
            (width * 0.34, front_y + 0.46, 1.24),
            mats["warehouse_panel_light"], identity, 0.035,
        ), "dispatch-office-pod")
        mark(box(
            f"{identity_name}__dispatch-window",
            (width * 0.17, 0.08, 0.78),
            (width * 0.34, front_y + 0.93, 1.48),
            mats["glass"], identity, 0.012,
        ), "dispatch-office-glazing")
        for dock_index, px in enumerate((-width * 0.30, 0, width * 0.30), start=1):
            mark(box(
                f"{identity_name}__dock-seal-{dock_index:02d}",
                (1.94, 0.18, 2.18),
                (px, loading_y - 0.31, 1.10),
                mats["facade_frame"], identity, 0.030,
            ), "dock-seal")
            mark(box(
                f"{identity_name}__dock-canopy-{dock_index:02d}",
                (2.12, 1.02, 0.14),
                (px, loading_y - 0.67, 2.72),
                mats["roof"], identity, 0.025,
            ), "dock-canopy")
            mark(box(
                f"{identity_name}__dock-ramp-{dock_index:02d}",
                (1.64, 1.36, 0.16),
                (px, loading_y - 1.02, 0.14),
                mats["loading_concrete"], identity, 0.025,
            ), "dock-ramp", "mid")

    elif building_id == "far-east-utility":
        tower_height = height * 0.92
        tower_x = -width * 0.28
        mark(box(
            f"{identity_name}__louver-tower",
            (width * 0.34, 0.46, tower_height),
            (tower_x, front_y + 0.29, tower_height / 2 + 0.20),
            mats["factory_panel_mid"], identity, 0.028,
        ), "ventilation-tower")
        for blade_index in range(6):
            mark(box(
                f"{identity_name}__louver-blade-{blade_index + 1:02d}",
                (width * 0.28, 0.08, 0.055),
                (tower_x, front_y + 0.56, 0.48 + blade_index * tower_height * 0.12),
                mats["gutter"], identity, 0.006,
            ), "ventilation-louver", "near")
        mark(box(
            f"{identity_name}__cable-tray",
            (width * 0.88, 0.30, 0.18),
            (0, front_y + 0.34, height + 0.42),
            mats["pipe"], identity, 0.016,
        ), "cable-distribution")
        for stack_index, px in enumerate((width * 0.16, width * 0.36), start=1):
            mark(cylinder(
                f"{identity_name}__exhaust-stack-{stack_index:02d}",
                0.13, 1.28, (px, -depth * 0.18, height + 0.72),
                mats["pipe"], identity, vertices=14,
            ), "safe-exhaust-stack")
            mark(cylinder(
                f"{identity_name}__exhaust-cap-{stack_index:02d}",
                0.20, 0.10, (px, -depth * 0.18, height + 1.39),
                mats["gutter"], identity, vertices=14,
            ), "safe-exhaust-cap", "mid")

    return identity


def rebuild_building_identities(mats, campus):
    created = 0
    for building_id, _, (width, depth, height), _ in BUILDINGS:
        building_root = bpy.data.objects.get(f"BLDG__{building_id}")
        if building_root is None:
            continue
        create_building_identity(building_id, width, depth, height, mats, building_root)
        created += 1
    campus["buildingIdentityPass"] = "functional-silhouette-v1"
    campus["buildingIdentityCount"] = created
    bpy.context.scene["buildingIdentityPass"] = "functional-silhouette-v1"
    return created


def create_building(record, mats, campus):
    building_id, (x, y), (width, depth, height), kind = record
    root = empty(f"BLDG__{building_id}", (x, y, 0), campus)
    root["buildingId"] = building_id
    root["interactive"] = True
    root["source"] = "bgtp-single-view-graybox"
    art_palette = building_art_palette(building_id, kind, mats)
    root["artDirection"] = art_palette["direction"]

    box(f"{building_id}__wall-shell", (width, depth, height), (0, 0, height / 2), art_palette["shell"], root, 0.07)
    box(f"{building_id}__roof", (width + 0.12, depth + 0.12, 0.22), (0, 0, height + 0.11), mats["roof"], root, 0.025)
    box(f"{building_id}__blue-trim", (width + 0.08, 0.10, 0.13), (0, depth / 2 + 0.03, height - 0.18), mats["accent"], root, 0.01)
    create_wall_cladding(building_id, width, depth, height, mats, root, art_palette)
    create_constructed_envelope(building_id, width, depth, height, kind, mats, root)
    create_building_surface_age(building_id, width, depth, height, kind, mats, root)

    bay_count = max(2, min(8, round(width / 1.35)))
    for index in range(bay_count):
        px = -width * 0.42 + index * (width * 0.84 / max(1, bay_count - 1))
        window_height = 1.1 if kind == "administration" else 0.28
        window_z = height * 0.56 if kind == "administration" else height * 0.62
        box(
            f"{building_id}__window-{index + 1:02d}",
            (0.52, 0.07, window_height),
            (px, depth / 2 + 0.055, window_z),
            mats["admin_glass"] if kind == "administration" else mats["glass"],
            root,
            0.01,
        )

    create_recessed_entry_doors(building_id, width, depth, height, mats, root)

    if kind == "administration":
        admin_bay_count = 6
        for index in range(admin_bay_count):
            px = -width * 0.40 + index * width * 0.80 / (admin_bay_count - 1)
            box(
                f"ADMIN__glass-bay-{index + 1:02d}",
                (0.78, 0.10, height * 0.58),
                (px, depth / 2 + 0.075, height * 0.48),
                mats["admin_glass"],
                root,
                0.015,
            )
        for index in range(8):
            px = -width * 0.46 + index * width * 0.92 / 7
            box(f"{building_id}__facade-pier-{index + 1:02d}", (0.19, 0.28, height * 0.88), (px, depth / 2 + 0.15, height * 0.47), mats["admin_wall"], root, 0.018)
    else:
        vent_count = max(2, min(7, round(width / 1.8)))
        for index in range(vent_count):
            px = -width * 0.38 + index * width * 0.76 / max(1, vent_count - 1)
            cylinder(f"{building_id}__roof-vent-{index + 1:02d}", 0.11, 0.25, (px, 0, height + 0.34), mats["vent"], root, vertices=10)

        if width > 6:
            for index in range(4):
                px = -width * 0.3 + index * width * 0.2
                box(f"{building_id}__skylight-{index + 1:02d}", (0.62, 0.38, 0.10), (px, 0.45, height + 0.27), mats["skylight"], root, 0.015)
    if building_id == "main-production-hall":
        create_main_production_facade(width, depth, height, mats, root)
    elif building_id == "administration":
        create_administration_facade(width, depth, height, mats, root)
    elif building_id == "gatehouse":
        create_gatehouse_facade(width, depth, height, mats, root)
    create_specialized_building_facade(building_id, width, depth, height, mats, root)
    create_building_lighting_and_wayfinding(building_id, width, depth, height, kind, mats, root, art_palette)
    create_floor_spaces(building_id, width, depth, height, mats, root)
    create_operational_roof_and_services(building_id, width, depth, height, mats, root)
    create_rear_service_envelope(building_id, width, depth, height, mats, root)
    create_warehouse_loading_activity(building_id, width, depth, mats, root)
    return root


def create_sports_wire_panel(prefix, size, location, mats, parent):
    """Build a sparse but readable wire rhythm over a transparent sports-fence backing."""
    horizontal_run = size[0] >= size[1]
    run_length = size[0] if horizontal_run else size[1]
    wire_count = 6 if run_length >= 5.0 else 4
    for wire_index in range(wire_count):
        along = -run_length * 0.42 + wire_index * run_length * 0.84 / max(1, wire_count - 1)
        if horizontal_run:
            wire_size = (0.026, 0.075, size[2] * 0.92)
            wire_location = (location[0] + along, location[1], location[2])
        else:
            wire_size = (0.075, 0.026, size[2] * 0.92)
            wire_location = (location[0], location[1] + along, location[2])
        wire = box(
            f"{prefix}__vertical-{wire_index + 1:02d}",
            wire_size,
            wire_location,
            mats["court_wire"],
            parent,
            0.004,
        )
        wire["layerRole"] = "sports-wire-mesh"

    for rail_index, z_ratio in enumerate((-0.32, -0.05, 0.22, 0.47), start=1):
        if horizontal_run:
            rail_size = (run_length * 0.96, 0.075, 0.026)
        else:
            rail_size = (0.075, run_length * 0.96, 0.026)
        rail = box(
            f"{prefix}__horizontal-{rail_index:02d}",
            rail_size,
            (location[0], location[1], location[2] + size[2] * z_ratio),
            mats["court_wire"],
            parent,
            0.004,
        )
        rail["layerRole"] = "sports-wire-mesh"


def create_sports_gate(prefix, fence_y, mats, parent):
    """Create a visibly ajar pedestrian swing gate in a split sports fence run."""
    for label, px in (("left", -0.75), ("right", 0.75)):
        cylinder(
            f"{prefix}__gate-post-{label}",
            0.065,
            2.22,
            (px, fence_y, 1.12),
            mats["facade_frame"],
            parent,
            vertices=12,
        )
    gate = empty(f"{prefix}__gate", (-0.68, fence_y, 0), parent)
    gate["interactive"] = True
    gate["motionAxis"] = "z"
    gate["closedAngle"] = 0.0
    gate["openAngle"] = -1.42
    gate.rotation_euler[2] = math.radians(-24)
    leaf = box(
        f"{prefix}__gate-leaf",
        (1.30, 0.07, 1.82),
        (0.65, 0, 1.02),
        mats["court_fence"],
        gate,
        0.008,
    )
    leaf["layerRole"] = "sports-gate"
    for wire_index in range(4):
        wire = box(
            f"{prefix}__gate-wire-vertical-{wire_index + 1:02d}",
            (0.025, 0.078, 1.55),
            (0.22 + wire_index * 0.29, 0, 1.02),
            mats["court_wire"],
            gate,
            0.003,
        )
        wire["layerRole"] = "sports-gate-wire"
    for wire_index, pz in enumerate((0.45, 0.83, 1.21, 1.57), start=1):
        wire = box(
            f"{prefix}__gate-wire-horizontal-{wire_index:02d}",
            (1.18, 0.078, 0.025),
            (0.65, 0, pz),
            mats["court_wire"],
            gate,
            0.003,
        )
        wire["layerRole"] = "sports-gate-wire"
    box(
        f"{prefix}__gate-kickplate",
        (1.26, 0.09, 0.22),
        (0.65, 0, 0.22),
        mats["facade_frame"],
        gate,
        0.008,
    )
    return gate


def create_roads_and_site(mats, campus):
    site = empty("SITE__ground-and-roads", parent=campus)
    road_thickness = 0.08
    horizontal_road_top = 0.09
    vertical_road_top = 0.07

    def road_location(x, y, width, depth):
        top = horizontal_road_top if width >= depth else vertical_road_top
        return (x, y, top - road_thickness / 2)

    def road_marking_z(horizontal):
        top = horizontal_road_top if horizontal else vertical_road_top
        return top + 0.0175

    box("SITE__ground", (58, 42, 0.45), (0, 0, -0.225), mats["lawn"], site, 0.08)
    box("SITE__outer-boulevard", (64, 3.4, 0.10), (0, 23.0, 0.04), mats["asphalt"], site, 0.02)
    box("SITE__front-sidewalk", (58, 0.72, 0.12), (0, 18.15, 0.08), mats["sidewalk"], site, 0.02)
    box("SITE__entry-plaza", (7.0, 3.3, 0.10), (20.5, 17.0, 0.10), mats["paving"], site, 0.025)

    perimeter_roads = [
        ("ROAD__perimeter-front", (56.4, 2.5, road_thickness), (0, 20.0)),
        ("ROAD__perimeter-rear", (56.4, 2.5, road_thickness), (0, -20.0)),
        ("ROAD__perimeter-west", (2.5, 37.5, road_thickness), (-27.0, 0)),
        ("ROAD__perimeter-east", (2.5, 37.5, road_thickness), (27.0, 0)),
    ]
    for name, size, (x, y) in perimeter_roads:
        road = box(name, size, road_location(x, y, size[0], size[1]), mats["asphalt"], site, 0.025)
        road["depthLayer"] = "horizontal-primary" if size[0] >= size[1] else "vertical-secondary"

    for index, (x, y, width, depth) in enumerate([
        (0, 17.1, 53.0, 1.8),
        (20.5, 12.0, 3.0, 17.5),
        (0.0, 6.4, 50.0, 1.8),
        (0.0, -9.4, 50.0, 1.7),
        (-8.5, -1.5, 1.7, 29.8),
        (5.1, -3.0, 1.7, 13.0),
        (-18.8, 2.2, 1.7, 29.0),
    ]):
        road = box(
            f"ROAD__segment-{index + 1:02d}",
            (width, depth, road_thickness),
            road_location(x, y, width, depth),
            mats["asphalt"],
            site,
            0.02,
        )
        road["depthLayer"] = "horizontal-primary" if width >= depth else "vertical-secondary"

    for road_y, prefix in ((20.0, "front"), (-20.0, "rear"), (6.4, "inner")):
        for index, x in enumerate(range(-25, 26, 2)):
            box(f"ROAD__{prefix}-dash-{index + 1:02d}", (0.88, 0.07, 0.025), (x, road_y, road_marking_z(True)), mats["stripe"], site, 0)
    for road_x, prefix in ((-27.0, "west"), (27.0, "east"), (20.5, "entry")):
        for index, y in enumerate(range(-17, 18, 2)):
            box(f"ROAD__{prefix}-dash-{index + 1:02d}", (0.07, 0.88, 0.025), (road_x, y, road_marking_z(False)), mats["stripe"], site, 0)
    for index, x in enumerate(range(-30, 31, 2)):
        box(f"ROAD__boulevard-dash-{index + 1:02d}", (0.92, 0.07, 0.025), (x, 23.0, 0.105), mats["stripe"], site, 0)
    for edge in (21.45, 24.55):
        box(f"ROAD__boulevard-edge-{edge}", (64, 0.055, 0.025), (0, edge, 0.105), mats["stripe"], site, 0)
    for crossing, cx in enumerate((20.5, 0.0, -18.8)):
        for stripe in range(7):
            box(f"ROAD__crossing-{crossing + 1}-{stripe + 1}", (0.14, 0.92, 0.025), (cx - 0.48 + stripe * 0.16, 18.25, road_marking_z(True)), mats["stripe"], site, 0)

    inner_curbs = [
        ((8.0, 0.16, 0.18), (-20.0, 7.38, 0.12)),
        ((7.0, 0.16, 0.18), (-12.0, 7.38, 0.12)),
        ((6.0, 0.16, 0.18), (-3.0, 7.38, 0.12)),
        ((10.0, 0.16, 0.18), (11.5, 7.38, 0.12)),
        ((8.0, 0.16, 0.18), (-20.0, 5.42, 0.12)),
        ((7.0, 0.16, 0.18), (-12.0, 5.42, 0.12)),
        ((6.0, 0.16, 0.18), (-3.0, 5.42, 0.12)),
        ((10.0, 0.16, 0.18), (11.5, 5.42, 0.12)),
        ((16.0, 0.16, 0.18), (-17.0, 16.08, 0.12)),
        ((15.0, 0.16, 0.18), (5.0, 16.08, 0.12)),
        ((0.16, 5.6, 0.18), (18.92, 13.0, 0.12)),
        ((0.16, 5.6, 0.18), (22.08, 13.0, 0.12)),
    ]
    for index, (size, location) in enumerate(inner_curbs, start=1):
        box(f"ROAD_DETAIL__inner-curb-{index:02d}", size, location, mats["curb"], site, 0.025)

    for crossing_index, cx in enumerate((-8.5, 5.1), start=1):
        for stripe in range(8):
            box(
                f"ROAD_DETAIL__crosswalk-{crossing_index:02d}-{stripe + 1:02d}",
                (0.13, 1.42, 0.025),
                (cx - 0.53 + stripe * 0.15, 6.4, 0.115),
                mats["stripe"],
                site,
                0,
            )
        box(
            f"ROAD_DETAIL__stop-line-{crossing_index:02d}",
            (0.09, 1.55, 0.028),
            (cx - 0.82, 6.4, 0.116),
            mats["stripe"],
            site,
            0,
        )

    for arrow_index, (x, y, direction) in enumerate(((-14.0, 6.4, 1), (13.5, 6.4, -1)), start=1):
        box(
            f"ROAD_DETAIL__direction-arrow-{arrow_index:02d}-stem",
            (0.68, 0.10, 0.024),
            (x, y, 0.116),
            mats["safety_yellow"],
            site,
            0,
        )
        for side in (-1, 1):
            box(
                f"ROAD_DETAIL__direction-arrow-{arrow_index:02d}-head-{side:+d}",
                (0.38, 0.10, 0.024),
                (x + direction * 0.35, y + side * 0.13, 0.116),
                mats["safety_yellow"],
                site,
                0,
                rotation=(0, 0, math.radians(side * direction * 38)),
            )

    for index, (length, x, y) in enumerate(((8.0, -20.0, 7.18), (6.5, -3.0, 7.18), (10.0, 11.5, 7.18), (7.0, -12.5, 5.62)), start=1):
        box(
            f"ROAD_DETAIL__drain-channel-{index:02d}",
            (length, 0.16, 0.045),
            (x, y, 0.105),
            mats["drain"],
            site,
            0.012,
        )
        slot_count = max(4, round(length / 1.2))
        for slot in range(slot_count):
            px = x - length * 0.43 + slot * length * 0.86 / max(1, slot_count - 1)
            box(
                f"ROAD_DETAIL__drain-slot-{index:02d}-{slot + 1:02d}",
                (0.36, 0.045, 0.018),
                (px, y, 0.133),
                mats["facade_frame"],
                site,
                0.004,
            )

    walkways = [
        ((7.0, 0.82, 0.08), (8.5, 14.55, 0.08)),
        ((10.0, 0.78, 0.08), (-13.0, 14.55, 0.08)),
        ((0.82, 5.8, 0.08), (1.0, 13.0, 0.08)),
    ]
    for index, (size, location) in enumerate(walkways, start=1):
        box(f"PEDESTRIAN__walkway-{index:02d}", size, location, mats["sidewalk"], site, 0.025)
        tactile_size = (0.55, 0.18, 0.025) if size[0] > size[1] else (0.18, 0.55, 0.025)
        box(
            f"PEDESTRIAN__tactile-{index:02d}",
            tactile_size,
            (location[0], location[1], 0.135),
            mats["tactile"],
            site,
            0.006,
        )

    court = empty("SITE__basketball-court", (17.7, -14.85, 0), site)
    box("COURT__surface", (8.8, 5.2, 0.07), (0, 0, 0.07), mats["court"], court, 0.08)
    basketball_lines = [
        ("center", (0.055, 4.62, 0.025), (0, 0, 0.12)),
        ("sideline-north", (8.10, 0.055, 0.025), (0, 2.30, 0.12)),
        ("sideline-south", (8.10, 0.055, 0.025), (0, -2.30, 0.12)),
        ("baseline-west", (0.055, 4.62, 0.025), (-4.05, 0, 0.12)),
        ("baseline-east", (0.055, 4.62, 0.025), (4.05, 0, 0.12)),
        ("key-west-top", (1.48, 0.055, 0.025), (-3.28, 1.08, 0.12)),
        ("key-west-bottom", (1.48, 0.055, 0.025), (-3.28, -1.08, 0.12)),
        ("key-east-top", (1.48, 0.055, 0.025), (3.28, 1.08, 0.12)),
        ("key-east-bottom", (1.48, 0.055, 0.025), (3.28, -1.08, 0.12)),
    ]
    for name, size, location in basketball_lines:
        box(f"COURT__line-{name}", size, location, mats["stripe"], court, 0)
    for side_index, px in enumerate((-3.58, 3.58)):
        side_name = "left" if side_index == 0 else "right"
        cylinder(f"COURT__hoop-{side_name}", 0.065, 1.82, (px, 0, 0.98), mats["facade_frame"], court, vertices=12)
        box(f"COURT__backboard-{side_name}", (0.10, 1.02, 0.62), (px, 0, 1.75), mats["white"], court, 0.018)
        cylinder(
            f"COURT__rim-{side_name}",
            0.18,
            0.045,
            (px - 0.18 if side_index == 0 else px + 0.18, 0, 1.58),
            mats["safety_orange"],
            court,
            rotation=(0, math.pi / 2, 0),
            vertices=20,
        )

    basketball_fence_runs = [
        ("north", (3.65, 0.06, 2.10), (-2.575, 2.62, 1.08)),
        ("north-right", (3.65, 0.06, 2.10), (2.575, 2.62, 1.08)),
        ("south", (8.80, 0.06, 2.10), (0, -2.62, 1.08)),
        ("west", (0.06, 5.30, 2.10), (-4.38, 0, 1.08)),
        ("east", (0.06, 5.30, 2.10), (4.38, 0, 1.08)),
    ]
    for name, size, location in basketball_fence_runs:
        fence = box(f"BASKET__fence-run-{name}", size, location, mats["court_fence"], court, 0.008)
        fence["layerRole"] = "sports-fence"
        create_sports_wire_panel(f"SPORTS_DETAIL__BASKET__{name}", size, location, mats, court)
    basketball_post_index = 1
    for px in (-4.38, 0, 4.38):
        for py in (-2.62, 2.62):
            cylinder(
                f"BASKET__fence-post-{basketball_post_index:02d}",
                0.045,
                2.18,
                (px, py, 1.10),
                mats["facade_frame"],
                court,
                vertices=10,
            )
            basketball_post_index += 1
    create_sports_gate("BASKET", 2.62, mats, court)

    tennis = empty("SITE__tennis-court", (9.0, -14.85, 0), site)
    box("TENNIS__surface", (8.4, 4.4, 0.07), (0, 0, 0.07), mats["tennis_court"], tennis, 0.08)
    tennis_lines = [
        ("sideline-north", (7.70, 0.050, 0.025), (0, 1.84, 0.12)),
        ("sideline-south", (7.70, 0.050, 0.025), (0, -1.84, 0.12)),
        ("baseline-west", (0.050, 3.72, 0.025), (-3.84, 0, 0.12)),
        ("baseline-east", (0.050, 3.72, 0.025), (3.84, 0, 0.12)),
        ("service-west", (0.050, 3.72, 0.025), (-1.62, 0, 0.12)),
        ("service-east", (0.050, 3.72, 0.025), (1.62, 0, 0.12)),
        ("service-center", (3.24, 0.050, 0.025), (0, 0, 0.12)),
    ]
    for name, size, location in tennis_lines:
        box(f"TENNIS__line-{name}", size, location, mats["stripe"], tennis, 0)

    net = box("TENNIS__net", (0.055, 4.05, 0.72), (0, 0, 0.54), mats["court_fence"], tennis, 0.008)
    net["layerRole"] = "sports-net"
    create_sports_wire_panel("SPORTS_DETAIL__TENNIS__net", (0.055, 4.05, 0.72), (0, 0, 0.54), mats, tennis)
    for label, py in (("left", -2.10), ("right", 2.10)):
        cylinder(f"TENNIS__net-post-{label}", 0.055, 0.94, (0, py, 0.54), mats["facade_frame"], tennis, vertices=12)

    fence_runs = [
        ("north", (3.65, 0.06, 2.10), (-2.575, 2.42, 1.08)),
        ("north-right", (3.65, 0.06, 2.10), (2.575, 2.42, 1.08)),
        ("south", (8.80, 0.06, 2.10), (0, -2.42, 1.08)),
        ("west", (0.06, 4.90, 2.10), (-4.38, 0, 1.08)),
        ("east", (0.06, 4.90, 2.10), (4.38, 0, 1.08)),
    ]
    for name, size, location in fence_runs:
        fence = box(f"TENNIS__fence-run-{name}", size, location, mats["court_fence"], tennis, 0.008)
        fence["layerRole"] = "sports-fence"
        create_sports_wire_panel(f"SPORTS_DETAIL__TENNIS__{name}", size, location, mats, tennis)
    post_index = 1
    for px in (-4.38, 0, 4.38):
        for py in (-2.42, 2.42):
            cylinder(f"TENNIS__fence-post-{post_index:02d}", 0.045, 2.18, (px, py, 1.10), mats["facade_frame"], tennis, vertices=10)
            post_index += 1
    create_sports_gate("TENNIS", 2.42, mats, tennis)

    parking = empty("SITE__parking-canopy", (16.7, 10.5, 0), site)
    box("PARKING__surface", (8.8, 5.4, 0.08), (0, 0, 0.06), mats["asphalt"], parking, 0.02)
    box("PARKING__canopy-roof", (8.4, 4.7, 0.14), (0, 0, 1.60), mats["roof"], parking, 0.025)
    for index in range(20):
        px = -3.0 + (index % 5) * 1.5
        py = -1.68 + (index // 5) * 1.12
        box(
            f"PARKING__solar-panel-{index + 1:02d}",
            (1.30, 0.86, 0.055),
            (px, py, 1.70),
            mats["solar"],
            parking,
            0.012,
            rotation=(math.radians(4), 0, 0),
        )
    post_index = 1
    for py in (-1.85, 1.85):
        for px in (-3.1, -1.55, 0, 1.55, 3.1):
            box(f"PARKING__post-{post_index:02d}", (0.09, 0.09, 1.55), (px, py, 0.78), mats["pipe"], parking, 0.01)
            post_index += 1
    for row, py in enumerate((-1.35, 1.35)):
        for line_index, px in enumerate((-3.75, -2.25, -.75, .75, 2.25, 3.75)):
            box(f"PARKING__bay-line-{row + 1:02d}-{line_index + 1:02d}", (0.045, 2.25, 0.02), (px, py, 0.11), mats["stripe"], parking, 0)
    box("PARKING__center-aisle", (7.8, 0.055, 0.02), (0, 0, 0.11), mats["stripe"], parking, 0)
    wheel_stop_index = 1
    for py in (-2.08, 2.08):
        for px in (-3.0, -1.5, 0, 1.5, 3.0):
            box(
                f"PARKING__wheel-stop-{wheel_stop_index:02d}",
                (0.82, 0.16, 0.12),
                (px, py, 0.16),
                mats["safety_yellow"],
                parking,
                0.035,
            )
            wheel_stop_index += 1

    gate = empty("SITE__vehicle-gate", (20.5, 17.0, 0), site)
    recognition = box(
        "GATE__recognition-zone",
        (1.15, 0.92, 0.028),
        (-0.78, 2.05, 0.14),
        mats["safety_yellow"],
        gate,
        0.015,
    )
    recognition["layerRole"] = "traffic-recognition"
    recognition["vehicleClearance"] = 1.4
    box("GATE__stop-line", (1.35, 0.13, 0.035), (-0.78, 1.24, 0.15), mats["stripe"], gate, 0.008)
    box("GATE__speed-bump-01", (1.30, 0.30, 0.095), (-0.78, 3.10, 0.17), mats["safety_yellow"], gate, 0.035)

    for name, px, py, direction in (
        ("GATE__lane-arrow-inbound", -0.78, 2.62, -1),
        ("GATE__lane-arrow-outbound", 0.78, -2.25, 1),
    ):
        box(name, (0.13, 0.68, 0.028), (px, py, 0.15), mats["stripe"], gate, 0.005)
        for side in (-1, 1):
            box(
                f"{name}__head-{side:+d}",
                (0.11, 0.38, 0.028),
                (px + side * 0.12, py + direction * 0.30, 0.151),
                mats["stripe"],
                gate,
                0.005,
                rotation=(0, 0, math.radians(side * direction * 38)),
            )

    visitor_bay = box(
        "GATE__visitor-bay",
        (1.32, 2.55, 0.055),
        (2.42, 2.15, 0.10),
        mats["asphalt"],
        gate,
        0.018,
    )
    visitor_bay["usage"] = "visitor-pull-off"
    for side in (-1, 1):
        box(
            f"GATE__visitor-bay-line-{side:+d}",
            (0.055, 2.30, 0.024),
            (2.42 + side * 0.58, 2.15, 0.145),
            mats["stripe"],
            gate,
            0,
        )
    for side, px in (("west", -1.65), ("east", 1.65)):
        box(f"GATE__post-{side}", (0.18, 0.18, 2.25), (px, 0, 1.12), mats["pipe"], gate, 0.025)
    box("GATE__canopy", (3.8, 1.15, 0.16), (0, 0, 2.25), mats["roof"], gate, 0.035)
    inbound_barrier = empty("GATE__barrier-inbound", (-1.48, -.55, 1.05), gate)
    inbound_barrier["motionPath"] = "gate-barrier"
    inbound_barrier["motionAxis"] = "z"
    inbound_barrier["motionSpeed"] = 0.09
    inbound_barrier["closedAngle"] = 0.0
    inbound_barrier["openAngle"] = 1.22
    inbound_barrier["linkedVehicle"] = "VEHICLE__gate-shuttle__root"
    box("GATE__barrier-inbound__arm", (1.25, 0.09, 0.09), (.62, 0, 0), mats["stripe"], inbound_barrier, 0.018)
    box("GATE__barrier-inbound__tip", (.12, .12, .12), (1.21, 0, 0), mats["safety_yellow"], inbound_barrier, .018)

    outbound_barrier = empty("GATE__barrier-outbound", (1.48, .55, .92), gate)
    box("GATE__barrier-outbound__arm", (1.25, .09, .09), (-.62, 0, 0), mats["stripe"], outbound_barrier, .018)
    box("GATE__reader-inbound", (.16, .22, .82), (-1.35, -.55, .43), mats["accent"], gate, 0.025)
    box("GATE__reader-outbound", (.16, .22, .82), (1.35, .55, .43), mats["accent"], gate, 0.025)
    return site


def create_pipe_racks(mats, campus):
    group = empty("SYSTEM__pipe-racks", parent=campus)
    routes = [
        (-2.0, 5.1, 27.0, "x"),
        (-8.5, -1.3, 16.0, "y"),
        (-1.0, -9.4, 24.0, "x"),
    ]
    for route_index, (x, y, length, axis) in enumerate(routes):
        support_count = 7
        for index in range(support_count):
            offset = -length / 2 + index * length / (support_count - 1)
            px, py = (x + offset, y) if axis == "x" else (x, y + offset)
            for lateral in (-0.23, 0.23):
                lx, ly = (px, py + lateral) if axis == "x" else (px + lateral, py)
                box(f"PIPE__support-{route_index}-{index}-{lateral}", (0.07, 0.07, 1.25), (lx, ly, 0.64), mats["pipe"], group, 0.01)
            beam_size = (0.08, 0.75, 0.08) if axis == "x" else (0.75, 0.08, 0.08)
            box(f"PIPE__beam-{route_index}-{index}", beam_size, (px, py, 1.22), mats["pipe"], group, 0.01)
        for pipe_index, lateral in enumerate((-0.24, 0.0, 0.24)):
            px, py = (x, y + lateral) if axis == "x" else (x + lateral, y)
            rotation = (0, math.pi / 2, 0) if axis == "x" else (math.pi / 2, 0, 0)
            cylinder(f"PIPE__run-{route_index}-{pipe_index}", 0.055, length, (px, py, 1.31 + pipe_index * 0.07), mats["pipe_accent"], group, rotation=rotation, vertices=10)
    box("PIPE__bridge-gantry-01", (0.12, 2.8, 2.45), (-8.5, 5.0, 1.23), mats["pipe"], group, 0.015)
    box("PIPE__bridge-gantry-02", (0.12, 2.8, 2.45), (-8.5, -9.3, 1.23), mats["pipe"], group, 0.015)
    return group


def create_factory_energy_networks(campus):
    """Add semantically tagged utility routes that stay legible as physical PBR infrastructure."""
    for name in ("ENERGY_NETWORK__water", "ENERGY_NETWORK__power", "ENERGY_NETWORK__steam"):
        existing = bpy.data.objects.get(name)
        if existing:
            remove_object_tree(existing)
    for name in (
        "MAT__energy-water-pipe", "MAT__energy-water-meter", "MAT__energy-power-tray",
        "MAT__energy-power-cabinet", "MAT__energy-steam-pipe", "MAT__energy-steam-valve",
    ):
        existing = bpy.data.materials.get(name)
        if existing and existing.users == 0:
            bpy.data.materials.remove(existing)

    water_pipe = bpy.data.materials["MAT__pipe-structure"]
    water_meter = bpy.data.materials["MAT__street-metal"]
    power_tray = bpy.data.materials["MAT__pipe-structure"]
    power_cabinet = bpy.data.materials["MAT__street-metal"]
    steam_pipe = bpy.data.materials["MAT__concrete"]
    steam_valve = bpy.data.materials["MAT__architectural-bronze"]

    roots = {
        "water": empty("ENERGY_NETWORK__water", parent=campus),
        "power": empty("ENERGY_NETWORK__power", parent=campus),
        "steam": empty("ENERGY_NETWORK__steam", parent=campus),
    }

    def tag(segment, energy_type, segment_id, source, target, flow_direction, role):
        segment["energyType"] = energy_type
        segment["networkSegmentId"] = segment_id
        segment["sourceBuildingId"] = source
        segment["targetBuildingId"] = target
        segment["flowDirection"] = flow_direction
        segment["utilityRole"] = role
        segment["visibilityTier"] = "near"
        return segment

    def tag_route(segment, route_id, route_order):
        segment["networkRouteId"] = route_id
        segment["networkRouteOrder"] = route_order
        return segment

    def between(name, start, end, radius, mat, parent, energy_type, segment_id, source, target, flow_direction, role, square=False):
        start_vector = Vector(start)
        end_vector = Vector(end)
        delta = end_vector - start_vector
        rotation = delta.to_track_quat("Z", "Y").to_euler()
        midpoint = (start_vector + end_vector) / 2
        if square:
            segment = box(name, (radius * 2, radius * 2, delta.length), midpoint, mat, parent, 0.025, rotation)
        else:
            segment = cylinder(name, radius, delta.length, midpoint, mat, parent, rotation=rotation, vertices=12)
        return tag(segment, energy_type, segment_id, source, target, flow_direction, role)

    def marker(name, point, size, mat, parent, energy_type, segment_id, source, target, flow_direction, role):
        segment = box(name, size, point, mat, parent, 0.025)
        return tag(segment, energy_type, segment_id, source, target, flow_direction, role)

    water_routes = (
        ("main", "far-east-utility", "main-production-hall", ((-31.1, 5.0, 2.36), (-12.0, 7.2, 2.36), (3.0, 7.2, 2.36), (17.0, 7.2, 2.36), (17.0, 1.2, 2.36))),
        ("process", "far-east-utility", "east-process-hall", ((-12.0, 7.2, 2.36), (-12.0, -2.0, 2.36), (-20.0, -7.0, 2.36))),
        ("lab", "far-east-utility", "laboratory", ((-12.0, 7.2, 2.36), (-23.0, 12.2, 2.36), (-31.4, 14.4, 2.36))),
    )
    for route_id, source, target, points in water_routes:
        for index, (start, end) in enumerate(zip(points, points[1:]), start=1):
            tag_route(between(f"ENERGY__water__{route_id}__pipe-{index:02d}", start, end, 0.09, water_pipe, roots["water"], "water", f"water-{route_id}-pipe-{index:02d}", source, target, "source-to-target", "blue-gray-pipe"), f"water-{route_id}", index * 2 - 1)
        meter_point = points[min(1, len(points) - 1)]
        tag_route(marker(f"ENERGY__water__{route_id}__meter", (meter_point[0], meter_point[1], meter_point[2] - 0.18), (0.30, 0.24, 0.34), water_meter, roots["water"], "water", f"water-{route_id}-meter", source, target, "source-to-target", "meter-node"), f"water-{route_id}", 2)

    power_routes = (
        ("production", "far-east-utility", "main-production-hall", ((-31.1, 4.2, 2.78), (-12.0, 4.2, 2.78), (3.0, 4.2, 2.78), (17.0, 1.1, 2.78))),
        ("warehouse", "far-east-utility", "front-warehouse", ((-31.1, 4.2, 2.78), (-17.0, 4.2, 2.78), (-10.0, 10.0, 2.78), (-4.3, 14.1, 2.78))),
        ("administration", "far-east-utility", "administration", ((-17.0, 4.2, 2.78), (1.0, 9.6, 2.78), (13.5, 14.6, 2.78))),
    )
    for route_id, source, target, points in power_routes:
        for index, (start, end) in enumerate(zip(points, points[1:]), start=1):
            tag_route(between(f"ENERGY__power__{route_id}__tray-{index:02d}", start, end, 0.11, power_tray, roots["power"], "power", f"power-{route_id}-tray-{index:02d}", source, target, "source-to-target", "cable-tray", square=True), f"power-{route_id}", index)
        cabinet_point = points[-1]
        tag_route(marker(f"ENERGY__power__{route_id}__cabinet", (cabinet_point[0], cabinet_point[1], cabinet_point[2] - 0.52), (0.46, 0.30, 0.74), power_cabinet, roots["power"], "power", f"power-{route_id}-cabinet", source, target, "source-to-target", "distribution-cabinet"), f"power-{route_id}", len(points))

    steam_routes = (
        ("production", "far-east-utility", "main-production-hall", ((-31.1, 2.8, 3.16), (-12.0, 2.8, 3.16), (3.0, 2.8, 3.16), (17.0, .9, 3.16))),
        ("processing", "far-east-utility", "central-processing-hall", ((-12.0, 2.8, 3.16), (-5.0, -4.0, 3.16), (-3.6, -8.2, 3.16))),
        ("laboratory", "far-east-utility", "laboratory", ((-12.0, 2.8, 3.16), (-21.0, 7.0, 3.16), (-31.4, 13.6, 3.16))),
    )
    for route_id, source, target, points in steam_routes:
        for index, (start, end) in enumerate(zip(points, points[1:]), start=1):
            tag_route(between(f"ENERGY__steam__{route_id}__pipe-{index:02d}", start, end, 0.12, steam_pipe, roots["steam"], "steam", f"steam-{route_id}-pipe-{index:02d}", source, target, "source-to-target", "insulated-steam-pipe"), f"steam-{route_id}", index * 2 - 1)
        valve_point = points[min(1, len(points) - 1)]
        tag_route(marker(f"ENERGY__steam__{route_id}__valve", valve_point, (0.38, 0.38, 0.20), steam_valve, roots["steam"], "steam", f"steam-{route_id}-valve", source, target, "source-to-target", "isolation-valve"), f"steam-{route_id}", 2)
        return_point = points[-1]
        tag_route(marker(f"ENERGY__steam__{route_id}__condensate-return", (return_point[0], return_point[1], return_point[2] - 0.42), (0.28, 0.28, 0.40), steam_valve, roots["steam"], "steam", f"steam-{route_id}-condensate-return", target, source, "target-to-source", "condensate-return-marker"), f"steam-{route_id}-return", 1)

    campus["energyNetworkTwin"] = "water-power-steam-physical-routes-v1"
    return roots


def create_industrial_process_core(mats, campus):
    """Build a readable chemical-plant process yard without changing the building plan."""
    group = empty("SITE__process-core", (-22.0, -12.7, 0), campus)
    group["zoneType"] = "industrial-process-core"
    group["interactive"] = True
    group["layerRole"] = "industrial-zone"
    pad = box("PROCESS__equipment-pad", (7.2, 7.4, 0.14), (0, 0, 0.08), mats["concrete"], group, 0.035)
    pad["layerRole"] = "process-foundation"
    for side in (-1, 1):
        box(f"PROCESS__pad-curb-{side:+d}", (0.12, 7.15, 0.24), (side * 3.48, 0, 0.16), mats["curb"], group, 0.015)

    for index, px in enumerate((-2.2, 0.0, 2.2), start=1):
        tank = cylinder(f"PROCESS__tank-{index:02d}", 0.67, 2.45, (px, -2.05, 1.30), mats["gutter"], group, vertices=24)
        tank["equipmentType"] = "vertical-storage-tank"
        tank["layerRole"] = "process-equipment"
        cylinder(f"PROCESS__tank-roof-{index:02d}", 0.70, 0.14, (px, -2.05, 2.59), mats["roof"], group, vertices=24)
        cylinder(f"PROCESS__tank-ring-{index:02d}", 0.73, 0.08, (px, -2.05, 0.30), mats["pipe_band"], group, vertices=24)
        cylinder(f"PROCESS__tank-vent-{index:02d}", 0.055, 0.38, (px, -2.05, 2.84), mats["pipe"], group, vertices=10)
        for rung in range(7):
            box(f"PROCESS__tank-ladder-{index:02d}-{rung + 1:02d}", (0.38, 0.055, 0.035), (px + 0.67, -2.05, 0.48 + rung * 0.28), mats["pipe"], group, 0.004)

    for index, px in enumerate((-1.75, 0.35), start=1):
        cell = box(f"PROCESS__cooling-cell-{index:02d}", (1.72, 1.18, 1.52), (px, 0.28, 0.83), mats["interior_equipment"], group, 0.05)
        cell["equipmentType"] = "cooling-tower-cell"
        cell["layerRole"] = "process-equipment"
        for fin in range(7):
            box(
                f"PROCESS__cooling-fin-{index:02d}-{fin + 1:02d}",
                (1.48, 0.045, 0.065),
                (px, -0.33, 0.36 + fin * 0.16),
                mats["gutter"],
                group,
                0.005,
            )
        cylinder(f"PROCESS__cooling-fan-{index:02d}", 0.43, 0.10, (px, 0.28, 1.64), mats["pipe"], group, vertices=20)

    stack = cylinder("PROCESS__scrubber-stack", 0.38, 4.7, (2.55, 0.30, 2.42), mats["pipe_accent"], group, vertices=24)
    stack["equipmentType"] = "scrubber-stack"
    stack["layerRole"] = "process-equipment"
    for index, z in enumerate((0.65, 2.05, 3.45), start=1):
        cylinder(f"PROCESS__scrubber-band-{index:02d}", 0.42, 0.10, (2.55, 0.30, z), mats["pipe_band"], group, vertices=24)
    cylinder("PROCESS__scrubber-cap", 0.50, 0.14, (2.55, 0.30, 4.82), mats["gutter"], group, vertices=24)

    box("PROCESS__substation-pad", (2.65, 1.45, 0.10), (-1.65, 2.48, 0.12), mats["concrete"], group, 0.02)
    for index, px in enumerate((-2.25, -1.05), start=1):
        transformer = box(f"PROCESS__substation-transformer-{index:02d}", (0.84, 0.92, 0.92), (px, 2.48, 0.62), mats["interior_storage"], group, 0.05)
        transformer["equipmentType"] = "transformer"
        transformer["layerRole"] = "electrical-equipment"
        for fin in range(5):
            box(f"PROCESS__transformer-fin-{index:02d}-{fin + 1:02d}", (0.055, 1.02, 0.58), (px - 0.30 + fin * 0.15, 2.48, 0.62), mats["pipe"], group, 0.004)
        for terminal in (-0.22, 0.22):
            cylinder(f"PROCESS__transformer-terminal-{index:02d}-{terminal:+.2f}", 0.055, 0.30, (px + terminal, 2.48, 1.22), mats["pipe_band"], group, vertices=10)

    basin = box("PROCESS__wastewater-basin", (2.42, 1.52, 0.34), (1.68, 2.50, 0.24), mats["concrete"], group, 0.02)
    basin["equipmentType"] = "wastewater-basin"
    basin["layerRole"] = "environmental-equipment"
    box("PROCESS__wastewater-surface", (2.14, 1.24, 0.035), (1.68, 2.50, 0.40), mats["glass"], group, 0.005)
    for side in (-1, 1):
        box(f"PROCESS__basin-rail-long-{side:+d}", (2.48, 0.035, 0.42), (1.68, 2.50 + side * 0.80, 0.66), mats["safety_yellow"], group, 0.004)

    for index, y in enumerate((-1.0, 0.85), start=1):
        header = cylinder(f"PROCESS__pipe-header-{index:02d}", 0.075, 6.15, (0, y, 1.88 + index * 0.14), mats["pipe_accent"], group, rotation=(0, math.pi / 2, 0), vertices=12)
        header["layerRole"] = "process-pipe"
    for px in (-2.9, 0, 2.9):
        box(f"PROCESS__header-support-{px:+.1f}", (0.10, 0.58, 1.88), (px, -0.08, 0.99), mats["pipe"], group, 0.012)

    fence = box("PROCESS__substation-fence", (2.90, 0.055, 1.30), (-1.65, 1.70, 0.78), mats["fence"], group, 0.008)
    fence["layerRole"] = "electrical-safety"
    box("PROCESS__substation-fence-rear", (2.90, 0.055, 1.30), (-1.65, 3.25, 0.78), mats["fence"], group, 0.008)
    for side in (-1, 1):
        box(f"PROCESS__substation-fence-side-{side:+d}", (0.055, 1.60, 1.30), (-1.65 + side * 1.45, 2.48, 0.78), mats["fence"], group, 0.008)

    pipe_group = bpy.data.objects["SYSTEM__pipe-racks"]
    connector_one = cylinder("PROCESS__network-connector-01", 0.075, 9.15, (-16.23, -12.70, 3.12), mats["pipe_accent"], pipe_group, rotation=(0, math.pi / 2, 0), vertices=12)
    connector_two = cylinder("PROCESS__network-connector-02", 0.075, 4.70, (-13.00, -11.05, 3.12), mats["pipe_accent"], pipe_group, rotation=(math.pi / 2, 0, 0), vertices=12)
    for connector in (connector_one, connector_two):
        connector["layerRole"] = "process-network-connector"
    for index, (x, y) in enumerate(((-18.25, -12.70), (-14.15, -12.70), (-13.00, -12.55)), start=1):
        box(f"PROCESS__network-support-{index:02d}", (0.10, 0.52, 3.00), (x, y, 1.55), mats["pipe"], pipe_group, 0.012)
    return group


def create_warehouse_logistics(mats, campus):
    """Add a compact loading apron, dock equipment, pallets, forklift, and weighbridge."""
    group = empty("SITE__logistics-yard", (-3.0, 7.3, 0), campus)
    group["zoneType"] = "warehouse-logistics"
    group["interactive"] = True
    group["layerRole"] = "logistics-zone"
    box("LOGISTICS__front-warehouse-apron", (8.0, 2.42, 0.10), (0, 0.86, 0.09), mats["asphalt"], group, 0.03)
    for index, px in enumerate((-2.45, 0.0, 2.45), start=1):
        dock = box(f"LOGISTICS__dock-platform-{index:02d}", (1.72, 0.58, 0.38), (px, 1.78, 0.26), mats["concrete"], group, 0.025)
        dock["equipmentType"] = "loading-dock"
        box(f"LOGISTICS__dock-bumper-{index:02d}", (1.45, 0.12, 0.30), (px, 2.04, 0.37), mats["tire"], group, 0.018)
        box(f"LOGISTICS__dock-canopy-{index:02d}", (1.95, 0.78, 0.12), (px, 1.67, 2.28), mats["roof"], group, 0.02)
        for side in (-1, 1):
            box(f"LOGISTICS__dock-post-{index:02d}-{side:+d}", (0.08, 0.08, 2.02), (px + side * 0.82, 1.67, 1.27), mats["pipe"], group, 0.01)

    for index, (px, py) in enumerate(((-3.25, 0.45), (-2.55, 0.45), (2.55, 0.45), (3.25, 0.45)), start=1):
        root = empty(f"PROP__pallet-stack-{index:02d}", (px, py, 0), group)
        for level in range(3):
            box(f"PROP__pallet-stack-{index:02d}-load-{level + 1:02d}", (0.54, 0.42, 0.22), (0, 0, 0.17 + level * 0.23), mats["interior_worktop"], root, 0.015)
            for runner in (-0.16, 0.16):
                box(f"PROP__pallet-stack-{index:02d}-runner-{level + 1:02d}-{runner:+.2f}", (0.48, 0.055, 0.045), (0, runner, 0.055 + level * 0.23), mats["plinth"], root, 0.004)

    weighbridge = box("LOGISTICS__weighbridge", (3.15, 0.94, 0.13), (5.40, 0.92, 0.12), mats["gutter"], group, 0.015)
    weighbridge["equipmentType"] = "truck-scale"
    for side in (-1, 1):
        box(f"LOGISTICS__weighbridge-rail-{side:+d}", (3.24, 0.07, 0.16), (5.40, 0.92 + side * 0.51, 0.24), mats["safety_yellow"], group, 0.008)
    box("LOGISTICS__scale-kiosk", (0.55, 0.72, 1.15), (7.25, 1.54, 0.62), mats["wall_secondary"], group, 0.04)
    box("LOGISTICS__scale-kiosk-window", (0.32, 0.05, 0.38), (7.25, 1.16, 0.78), mats["glass"], group, 0.008)

    for index, px in enumerate((-1.15, 1.15), start=1):
        box(f"LOGISTICS__wheel-guide-{index:02d}", (0.12, 1.34, 0.14), (px, 0.82, 0.19), mats["safety_yellow"], group, 0.025)
    box("LOGISTICS__pedestrian-safety-strip", (7.5, 0.42, 0.025), (0, -0.08, 0.16), mats["safety_yellow"], group, 0.006)
    for index, (px, py) in enumerate(((-3.65, 1.80), (-3.30, 1.80), (3.30, 1.80), (3.65, 1.80)), start=1):
        cylinder(f"LOGISTICS__safety-bollard-{index:02d}", 0.07, 0.78, (px, py, 0.50), mats["safety_yellow"], group, vertices=12)

    forklift = empty("VEHICLE__forklift-01", (3.18, 1.03, 0.11), group)
    forklift["vehicleType"] = "forklift"
    box("VEHICLE__forklift-01__body", (1.05, 0.66, 0.48), (0, 0, 0.32), mats["safety_yellow"], forklift, 0.08)
    box("VEHICLE__forklift-01__counterweight", (0.38, 0.72, 0.62), (-0.42, 0, 0.43), mats["safety_yellow"], forklift, 0.10)
    for side in (-1, 1):
        cylinder(f"VEHICLE__forklift-01__wheel-{side:+d}", 0.18, 0.10, (-0.28, side * 0.38, 0.20), mats["tire"], forklift, rotation=(math.pi / 2, 0, 0), vertices=12)
        box(f"VEHICLE__forklift-01__mast-{side:+d}", (0.08, 0.08, 1.35), (0.50, side * 0.22, 0.78), mats["pipe"], forklift, 0.008)
    for side in (-1, 1):
        box(f"VEHICLE__forklift-01__fork-{side:+d}", (0.95, 0.07, 0.06), (0.88, side * 0.20, 0.10), mats["pipe"], forklift, 0.006)
    box("LOGISTICS__staging-line", (7.2, 0.055, 0.025), (0, -0.31, 0.16), mats["safety_yellow"], group, 0)
    return group


def create_vehicle(name, location, mats, parent, length=1.6, width=0.72, height=0.62, color="vehicle", rotation_z=0):
    root = empty(f"{name}__root", location, parent)
    root.rotation_euler[2] = rotation_z
    box(name, (length, width, height * 0.58), (0, 0, 0.34), mats[color], root, 0.11)
    box(f"{name}__cabin", (length * 0.54, width * 0.88, height * 0.50), (-length * 0.08, 0, 0.69), mats[color], root, 0.09)
    for side in (-1, 1):
        box(f"{name}__window-{side}", (length * 0.42, 0.035, height * 0.29), (-length * 0.08, side * width * 0.455, 0.72), mats["glass"], root, 0.02)
    for axle, px in enumerate((-length * 0.31, length * 0.31)):
        for side, py in enumerate((-width * 0.52, width * 0.52)):
            cylinder(
                f"{name}__wheel-{axle}-{side}",
                0.15,
                0.10,
                (px, py, 0.21),
                mats["tire"],
                root,
                rotation=(math.pi / 2, 0, 0),
                vertices=12,
            )
    return root


def create_site_furnishings(mats, campus):
    group = empty("SITE__furnishings", parent=campus)
    create_vehicle("VEHICLE__bus-01", (-9.0, 23.45, 0.08), mats, group, length=3.0, width=0.72, height=0.82, color="bus")
    create_vehicle("VEHICLE__front-car", (5.0, 22.55, 0.08), mats, group, length=1.35, width=0.62, height=0.54)
    create_vehicle("VEHICLE__rear-truck", (-11.0, -20.35, 0.08), mats, group, length=2.2, width=0.72, height=0.72, color="bus")
    create_vehicle("VEHICLE__west-car", (-27.3, 5.5, 0.08), mats, group, length=1.35, width=0.62, height=0.54, color="vehicle_blue", rotation_z=math.pi / 2)
    create_vehicle("VEHICLE__east-truck", (27.3, -5.0, 0.08), mats, group, length=2.1, width=0.72, height=0.70, color="bus", rotation_z=math.pi / 2)

    parked_positions = [
        (13.8, 9.2, "vehicle_blue"), (15.3, 9.2, "vehicle"), (16.8, 9.2, "vehicle"),
        (13.8, 11.8, "vehicle"), (16.8, 11.8, "vehicle_blue"), (19.8, 11.8, "vehicle"),
    ]
    for index, (x, y, color) in enumerate(parked_positions):
        create_vehicle(f"VEHICLE__parked-{index + 1:02d}", (x, y, 0.08), mats, group, length=1.25, width=0.58, height=0.50, color=color, rotation_z=math.pi / 2)

    shuttle = create_vehicle(
        "VEHICLE__gate-shuttle",
        (19.65, 22.0, 0.08),
        mats,
        group,
        length=1.45,
        width=0.62,
        height=0.56,
        color="vehicle_blue",
        rotation_z=math.pi / 2,
    )
    shuttle["motionPath"] = "gate-lane"
    shuttle["motionDistance"] = 10.0
    shuttle["motionSpeed"] = 0.09

    patrols = empty("SITE__patrol-routes", parent=group)
    create_site_patrol_walker(1, (-18.0, 14.55, .12), "x", 8.0, .055, .05, mats, patrols)
    create_site_patrol_walker(2, (1.0, 8.7, .12), "z", 6.0, .065, .36, mats, patrols)
    create_site_patrol_walker(3, (7.0, 14.55, .12), "x", 6.0, .060, .68, mats, patrols)
    create_site_patrol_walker(4, (-20.0, -15.8, .12), "x", 9.0, .048, .82, mats, patrols)

    for index, x in enumerate((-27, -21, -15, -9, -3, 3, 9, 15, 21, 27)):
        cylinder(f"LIGHT__boulevard-pole-{index + 1:02d}", 0.045, 1.9, (x, 18.1, 1.0), mats["pipe"], group, vertices=10)
        box(f"LIGHT__boulevard-head-{index + 1:02d}", (0.42, 0.11, 0.08), (x + 0.17, 18.1, 1.93), mats["white"], group, 0.02)
    return group


def create_landscape(mats, campus):
    group = empty("SITE__landscape", parent=campus)
    positions = []
    perimeter_offsets = (0.0, 0.24, -0.18, 0.31, -0.27)
    for index, x in enumerate(range(-25, 26, 2)):
        varied_x = x + perimeter_offsets[index % len(perimeter_offsets)]
        positions.append((varied_x, -17.8))
        if not 16.5 <= x <= 24.5:
            positions.append((varied_x, 18.0))
    for index, y in enumerate(range(-16, 18, 2)):
        varied_y = y + perimeter_offsets[(index + 2) % len(perimeter_offsets)]
        positions.extend([(-25.8, varied_y), (25.8, varied_y)])
    perimeter_crown_sources = {}
    for index, (x, y) in enumerate(positions):
        if index == 74:
            x -= 0.24
        variant = index % 3
        species = CANOPY_PROFILE_NAMES[index % len(CANOPY_PROFILE_NAMES)]
        trunk = tapered_trunk(
            f"TREE__trunk-{index:02d}",
            0.082 + variant * 0.006,
            0.050 + variant * 0.004,
            0.62 + variant * 0.04,
            (x, y, 0.35),
            mats["trunk"],
            group,
            vertices=8 + variant,
        )
        if species not in perimeter_crown_sources:
            foliage_layers = (mats["foliage"], mats["foliage_light"], mats["foliage_sunlit"])
            crown = clustered_crown(
                f"TREE__crown-{index:02d}",
                0.58 + variant * 0.035,
                (x, y, 1.02 + variant * 0.04),
                (mats["foliage"], mats["foliage_light"], mats["foliage_warm"])[variant],
                group,
                variant,
                species,
                "near",
                foliage_layers,
            )
            perimeter_crown_sources[species] = crown
        else:
            crown = linked_mesh_instance(
                f"TREE__crown-{index:02d}",
                perimeter_crown_sources[species],
                (x, y, 0),
                group,
            )
        crown["vegetationSpecies"] = species
        crown["vegetationTier"] = "mid"
        crown.location = (x, y, 1.02 + (index % 2) * 0.08)
        scale_variant = 0.90 + (index % 5) * 0.055
        crown.scale = (scale_variant, scale_variant * (0.92 + variant * 0.035), 1.12 + (index % 5) * 0.045)
        crown.rotation_euler[2] = math.radians((index * 43) % 360)
        trunk["instanceFamily"] = "tree"

    rain_gardens = [
        (-13.5, 7.78, 8.2, 0.72),
        (11.5, 7.78, 9.8, 0.72),
        (-3.0, 5.00, 5.8, 0.62),
    ]
    shrub_index = 1
    for garden_index, (x, y, width, depth) in enumerate(rain_gardens, start=1):
        box(
            f"LANDSCAPE__rain-garden-{garden_index:02d}",
            (width, depth, 0.16),
            (x, y, 0.10),
            mats["bioswale_soil"],
            group,
            0.08,
        )
        for plant in range(8):
            px = x - width * 0.40 + plant * width * 0.80 / 7
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.16, location=(0, 0, 0))
            grass = bpy.context.object
            grass.name = f"LANDSCAPE__rain-garden-grass-{garden_index:02d}-{plant + 1:02d}"
            grass.parent = group
            grass.location = (px, y - depth * 0.17, 0.28 + (plant % 2) * 0.03)
            grass.scale = (0.58, 0.72, 1.35)
            grass.data.materials.append(mats["ornamental_grass"])

            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.23, location=(0, 0, 0))
            shrub = bpy.context.object
            shrub.name = f"LANDSCAPE__shrub-mass-{shrub_index:02d}"
            shrub.parent = group
            shrub.location = (px + (0.08 if plant % 2 else -0.08), y + depth * 0.16, 0.29)
            shrub.scale = (1.18, 0.72, 0.76 + (plant % 3) * 0.08)
            shrub.data.materials.append(mats["shrub_deep"])
            shrub_index += 1

    inner_tree_positions = [
        (-22.2, 14.2), (-16.5, 14.2), (-10.5, 14.2), (-11.5, 14.0),
        (8.2, 14.6), (11.5, 14.8), (17.5, 14.8), (23.8, 11.5),
        (-17.0, 7.8), (-11.5, 7.8), (8.0, 7.8), (14.0, 7.8),
    ]
    for index, (x, y) in enumerate(inner_tree_positions, start=1):
        box(
            f"LANDSCAPE__tree-grate-{index:02d}",
            (0.72, 0.72, 0.055),
            (x, y, 0.13),
            mats["tree_grate"],
            group,
            0.025,
        )
        variant = index % 3
        species = CANOPY_PROFILE_NAMES[(index - 1) % len(CANOPY_PROFILE_NAMES)]
        trunk = tapered_trunk(
            f"LANDSCAPE__inner-tree-trunk-{index:02d}",
            0.105 + variant * 0.008,
            0.064 + variant * 0.004,
            0.72 + (index % 2) * 0.10,
            (x, y, 0.50),
            mats["trunk"],
            group,
            vertices=9 + variant,
        )
        crown = linked_mesh_instance(
            f"LANDSCAPE__inner-tree-crown-{index:02d}",
            perimeter_crown_sources[species],
            (x, y, 1.32 + (index % 2) * 0.10),
            group,
        )
        crown.location = (x, y, 1.22 + (index % 2) * 0.10)
        crown.scale = (1.12, 0.98, 1.26 + variant * 0.08)
        crown.rotation_euler[2] = math.radians((index * 61) % 360)
        crown["vegetationSpecies"] = species
        crown["vegetationTier"] = "near"
        create_branch_structure(
            f"VEGETATION__inner-tree-branches-{index:02d}",
            (x, y, 0.86 + (index % 2) * 0.05),
            0.58 + variant * 0.035,
            mats["trunk"],
            group,
            index,
        )
        trunk["instanceFamily"] = "inner-tree"

    front_post_x = [x for x in range(-27, 28) if not 18 <= x <= 23]
    for index, x in enumerate(front_post_x):
        box(f"FENCE__front-{index:02d}", (0.055, 0.055, 0.58), (x, 18.55, 0.3), mats["fence"], group, 0.008)
    perimeter_runs = [
        ("FENCE__perimeter-run-01", (44.0, 0.05, 0.08), (-5.0, 18.55, 0.48)),
        ("FENCE__perimeter-run-01-gate-side", (4.0, 0.05, 0.08), (25.0, 18.55, 0.48)),
        ("FENCE__perimeter-run-02", (54.0, 0.05, 0.08), (0, -18.55, 0.48)),
        ("FENCE__perimeter-run-03", (0.05, 37.1, 0.08), (-26.9, 0, 0.48)),
        ("FENCE__perimeter-run-04", (0.05, 37.1, 0.08), (26.9, 0, 0.48)),
    ]
    for name, size, location in perimeter_runs:
        box(name, size, location, mats["fence"], group, 0.006)

    flower_beds = [(24.0, 16.8, 2.2, 0.55), (12.5, 15.7, 2.4, 0.48), (-8.5, 16.0, 3.2, 0.52), (-19.5, 15.8, 2.4, 0.48)]
    for index, (x, y, width, depth) in enumerate(flower_beds):
        box(f"LANDSCAPE__flower-bed-{index + 1:02d}", (width, depth, 0.18), (x, y, 0.12), mats["flower"], group, 0.08)
        for shrub in range(5):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.20, location=(0, 0, 0))
            crown = bpy.context.object
            crown.name = f"LANDSCAPE__flower-{index + 1:02d}-{shrub + 1:02d}"
            crown.parent = group
            crown.location = (x - width * 0.38 + shrub * width * 0.19, y, 0.31 + (shrub % 2) * 0.06)
            crown.scale = (1.1, 0.8, 0.9)
            crown.data.materials.append(mats["flower_blossom"] if shrub % 2 else mats["flower"])
    return group


def create_environment(mats, campus):
    group = empty("ENV__background", parent=campus)
    ground_pieces = (
        ("ENV__landscape-apron", (76, 62, 0.28), (0, -5.0, -0.30), "campus-buffer"),
        ("ENV__forest-backdrop", (76, 26, 0.18), (0, -33.0, -0.16), "deep-forest"),
        ("ENV__forest-side-west", (12, 42, 0.16), (-34.0, -5.0, -0.17), "side-buffer"),
        ("ENV__forest-side-east", (12, 42, 0.16), (34.0, -5.0, -0.17), "side-buffer"),
    )
    for name, size, location, transition_role in ground_pieces:
        ground = box(name, size, location, mats["forest_ground"], group, 0.08)
        ground["transitionRole"] = transition_role
        ground["layerRole"] = "environment-ground"

    meadow_specs = (
        (-27.0, -20.0, 7.2, 2.6, -7), (-13.5, -20.4, 8.4, 2.8, 5),
        (0.5, -19.9, 9.2, 2.5, -4), (15.0, -20.5, 8.0, 3.0, 8),
        (28.0, -20.0, 6.6, 2.5, -6), (-29.0, -12.0, 3.2, 7.2, 10),
        (-29.5, 1.0, 2.8, 8.4, -8), (-29.0, 13.0, 3.4, 6.8, 6),
        (29.0, -11.0, 3.0, 7.8, -9), (29.5, 2.0, 2.7, 8.2, 7),
        (29.0, 13.0, 3.3, 6.4, -5),
    )
    for index, (x, y, width, depth, angle) in enumerate(meadow_specs, start=1):
        meadow = cylinder(
            f"ENV__transition-meadow-{index:02d}",
            1.0,
            0.055,
            (x, y, -0.055),
            mats["lawn"] if index % 3 else mats["forest_ground"],
            group,
            vertices=24,
        )
        meadow.scale = (width / 2, depth / 2, 1.0)
        meadow.rotation_euler[2] = math.radians(angle)
        meadow["transitionRole"] = "forest-edge-meadow"
        meadow["layerRole"] = "environment-transition"

    shrub_positions = []
    for index in range(16):
        shrub_positions.append((-30.0 + index * 4.0, -20.15 + math.sin(index * 1.7) * 0.42))
    for side in (-1, 1):
        for index in range(7):
            shrub_positions.append((side * (29.2 + math.sin(index * 1.3) * 0.35), -15.0 + index * 4.8))
    for index, (x, y) in enumerate(shrub_positions, start=1):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.30, location=(0, 0, 0))
        shrub = bpy.context.object
        shrub.name = f"ENV__edge-shrub-{index:02d}"
        shrub.parent = group
        shrub.location = (x, y, 0.18 + (index % 3) * 0.025)
        shrub.scale = (1.45 + (index % 4) * 0.12, 0.82 + (index % 3) * 0.10, 0.72 + (index % 5) * 0.055)
        shrub.data.materials.append(mats["understory_deep"] if index % 3 else mats["understory_warm"])
        shrub["transitionRole"] = "low-understory"
        shrub["layerRole"] = "environment-transition"

    prototypes = {}
    tree_index = 0

    def add_forest_tree(x, y, seed, band):
        nonlocal tree_index
        x += math.sin(seed * 12.9898 + 0.37) * 0.58
        y += math.sin(seed * 4.1414 + 1.91) * 0.52
        variant = seed % 3
        species = ("woodland", "conifer", "columnar")[variant]
        tier = "mid" if band == "edge" else "far"
        band_scale = {"edge": 0.78, "mid": 0.93, "deep": 1.08}[band]
        height_scale = band_scale * (0.94 + (seed % 5) * 0.045)
        crown_scale = band_scale * (0.94 + ((seed * 3) % 7) * 0.025)
        rotation = (0, 0, math.radians((seed * 47) % 360))
        trunk_location = (x, y, 0.42)
        crown_location = (x, y, 1.12 + band_scale * 0.14 + (seed % 4) * 0.055)

        if variant not in prototypes:
            trunk = tapered_trunk(
                f"ENV__tree-trunk-{tree_index:03d}",
                0.098 + variant * 0.008,
                0.058 + variant * 0.004,
                0.82 + variant * 0.08,
                trunk_location,
                mats["trunk"],
                group,
                vertices=8 + variant,
            )
            crown = clustered_crown(
                f"ENV__tree-crown-{tree_index:03d}",
                0.76 + variant * 0.055,
                crown_location,
                mats["forest_foliage_light"] if variant == 1 else mats["forest_foliage"],
                group,
                variant + 3,
                species,
                "far",
                (mats["forest_foliage"], mats["forest_foliage_light"]),
            )
            prototypes[variant] = (trunk, crown)
        else:
            trunk_source, crown_source = prototypes[variant]
            trunk = linked_mesh_instance(
                f"ENV__tree-trunk-{tree_index:03d}",
                trunk_source,
                trunk_location,
                group,
            )
            crown = linked_mesh_instance(
                f"ENV__tree-crown-{tree_index:03d}",
                crown_source,
                crown_location,
                group,
            )

        trunk.scale = (1.0, 1.0, height_scale)
        crown.scale = (
            crown_scale,
            crown_scale * (0.94 + variant * 0.035),
            band_scale * (1.24 + variant * 0.10),
        )
        crown.rotation_euler = rotation
        crown["vegetationSpecies"] = species
        crown["vegetationTier"] = tier
        trunk["instanceFamily"] = "background-tree"
        trunk["forestBand"] = band
        crown["forestBand"] = band
        tree_index += 1

    forest_width = 68.0
    rear_bands = (
        (-22.0, 4.20, "edge"),
        (-25.4, 3.55, "mid"),
        (-28.8, 3.25, "mid"),
        (-32.0, 2.95, "deep"),
        (-35.2, 2.75, "deep"),
        (-38.4, 2.65, "deep"),
    )
    for row, (y, spacing, band) in enumerate(rear_bands):
        count = math.floor(forest_width / spacing) + 1
        start_x = -spacing * (count - 1) / 2
        for column in range(count):
            add_forest_tree(start_x + column * spacing, y, row * 41 + column, band)

    side_y_min = -19.0
    side_y_max = 15.0
    side_spacing = 3.2
    side_count = math.floor((side_y_max - side_y_min) / side_spacing) + 1
    for side_index, x in enumerate((-35.2, -32.5, 32.5, 35.2)):
        offset = side_spacing * 0.5 if side_index % 2 else 0.0
        band = "deep" if side_index in {0, 3} else ("mid" if side_index == 1 else "edge")
        for row in range(side_count):
            y = side_y_min + row * side_spacing + offset
            if y <= side_y_max:
                add_forest_tree(x, y, 400 + side_index * 47 + row, band)
    return group


def create_industrial_finish_details(mats, campus):
    """Add restrained GLB-safe construction detail without changing the site layout."""
    group = empty("DETAIL__industrial-finishes", parent=campus)
    major_buildings = [record for record in BUILDINGS if record[2][0] >= 5.0]
    rib_index = 1
    plinth_index = 1
    gutter_index = 1
    downpipe_index = 1

    for building_id, (x, y), (width, depth, height), kind in major_buildings:
        detail_root = empty(f"DETAIL__{building_id}", (x, y, 0), group)

        box(
            f"DETAIL__wall-plinth-{plinth_index:02d}",
            (width + 0.05, 0.13, 0.34),
            (0, depth / 2 + 0.075, 0.17),
            mats["plinth"],
            detail_root,
            0.015,
        )
        plinth_index += 1

        rib_count = max(7, min(15, round(width / 0.9)))
        for rib in range(rib_count):
            px = -width * 0.46 + rib * width * 0.92 / max(1, rib_count - 1)
            box(
                f"DETAIL__roof-rib-{rib_index:02d}",
                (0.035, depth + 0.11, 0.045),
                (px, 0, height + 0.245),
                mats["roof_rib"],
                detail_root,
                0.006,
            )
            rib_index += 1

        box(
            f"DETAIL__gutter-{gutter_index:02d}",
            (width + 0.18, 0.10, 0.11),
            (0, depth / 2 + 0.10, height + 0.14),
            mats["gutter"],
            detail_root,
            0.018,
        )
        gutter_index += 1

        for side in (-1, 1):
            cylinder(
                f"DETAIL__downpipe-{downpipe_index:02d}",
                0.045,
                height - 0.28,
                (side * (width / 2 - 0.10), depth / 2 + 0.10, (height - 0.28) / 2 + 0.18),
                mats["gutter"],
                detail_root,
                vertices=10,
            )
            downpipe_index += 1

    curb_runs = [
        ((39.0, 0.16, 0.18), (0.0, 6.92, 0.12)),
        ((39.0, 0.16, 0.18), (0.0, 5.28, 0.12)),
        ((39.0, 0.16, 0.18), (0.0, -6.38, 0.12)),
        ((39.0, 0.16, 0.18), (0.0, -8.02, 0.12)),
        ((0.16, 25.8, 0.18), (18.92, 0.2, 0.12)),
    ]
    for index, (size, location) in enumerate(curb_runs, start=1):
        box(f"DETAIL__curb-{index:02d}", size, location, mats["curb"], group, 0.025)

    for index, (x, y, rotation) in enumerate([
        (7.0, 5.75, 0),
        (-3.0, 5.75, 0),
        (-12.0, 5.75, 0),
        (17.95, -3.5, math.pi / 2),
    ], start=1):
        box(
            f"DETAIL__storm-drain-{index:02d}",
            (0.46, 0.18, 0.035),
            (x, y, 0.115),
            mats["drain"],
            group,
            0.015,
            rotation=(0, 0, rotation),
        )

    for index, (x, y) in enumerate([(-8.8, 2.2), (-8.8, -3.0), (-2.8, 4.9)], start=1):
        cylinder(
            f"DETAIL__pipe-band-{index:02d}",
            0.064,
            0.16,
            (x, y, 1.38),
            mats["pipe_band"],
            group,
            rotation=(math.pi / 2, 0, 0),
            vertices=12,
        )
    return group


def expand_campus_plan(campus):
    """Double plan area while preserving building, vehicle, tree, and detail scale."""

    def scale_location(obj):
        obj.location.x *= PLAN_SCALE
        obj.location.y *= PLAN_SCALE

    def stretch_dominant_plan_axis(obj):
        dimensions = list(obj.dimensions)
        axis = 0 if dimensions[0] >= dimensions[1] else 1
        dimensions[axis] *= PLAN_SCALE
        obj.dimensions = dimensions

    for building in (child for child in campus.children if child.name.startswith("BLDG__")):
        scale_location(building)

    for zone_name in ("SITE__process-core", "SITE__logistics-yard"):
        scale_location(bpy.data.objects[zone_name])

    site = bpy.data.objects["SITE__ground-and-roads"]
    stretch_names = (
        "SITE__outer-boulevard",
        "SITE__front-sidewalk",
        "ROAD__perimeter-",
        "ROAD__segment-",
        "ROAD__boulevard-edge-",
        "ROAD_DETAIL__inner-curb-",
        "ROAD_DETAIL__drain-channel-",
        "PEDESTRIAN__walkway-",
    )
    for obj in list(site.children):
        scale_location(obj)
        if obj.name == "SITE__ground":
            obj.dimensions = (obj.dimensions.x * PLAN_SCALE, obj.dimensions.y * PLAN_SCALE, obj.dimensions.z)
        elif obj.type == "MESH" and obj.name.startswith(stretch_names):
            stretch_dominant_plan_axis(obj)

    pipes = bpy.data.objects["SYSTEM__pipe-racks"]
    for obj in list(pipes.children):
        scale_location(obj)
        if obj.type == "MESH" and (obj.name.startswith("PIPE__run-") or obj.name.startswith("PIPE__bridge-gantry-")):
            stretch_dominant_plan_axis(obj)

    landscape = bpy.data.objects["SITE__landscape"]
    for obj in list(landscape.children):
        scale_location(obj)
        if obj.type == "MESH" and obj.name.startswith("FENCE__perimeter-run-"):
            stretch_dominant_plan_axis(obj)

    furnishings = bpy.data.objects["SITE__furnishings"]
    parking_anchor = Vector((16.7 * PLAN_SCALE, 10.5 * PLAN_SCALE))
    for obj in list(furnishings.children):
        original = Vector((obj.location.x, obj.location.y))
        if obj.name.startswith("VEHICLE__parked-"):
            obj.location.x = parking_anchor.x + original.x - 16.7
            obj.location.y = parking_anchor.y + original.y - 10.5
        elif obj.name == "VEHICLE__gate-shuttle__root":
            obj.location.x = 20.5 * PLAN_SCALE - 0.85
            obj.location.y = 17.0 * PLAN_SCALE + 5.0
        else:
            scale_location(obj)
        if obj.name == "SITE__patrol-routes":
            for patrol in list(obj.children):
                scale_location(patrol)

    environment = bpy.data.objects["ENV__background"]
    for obj in list(environment.children):
        scale_location(obj)
        if obj.name in {"ENV__landscape-apron", "ENV__forest-backdrop", "ENV__forest-side-west", "ENV__forest-side-east"}:
            obj.dimensions = (obj.dimensions.x * PLAN_SCALE, obj.dimensions.y * PLAN_SCALE, obj.dimensions.z)

    finishes = bpy.data.objects["DETAIL__industrial-finishes"]
    for obj in list(finishes.children):
        scale_location(obj)
        if obj.type == "MESH" and obj.name.startswith("DETAIL__curb-"):
            stretch_dominant_plan_axis(obj)

    campus["planScale"] = PLAN_SCALE
    campus["planAreaMultiplier"] = PLAN_SCALE * PLAN_SCALE


BUILDING_ACCESS_SPECS = [
    ("administration", "ROAD__segment-01", "north", 13.44, "pedestrian"),
    ("central-processing-hall", "ROAD__segment-04", "south", -3.54, "industrial"),
    ("east-process-hall", "ROAD__segment-07", "west", -7.05, "industrial"),
    ("east-warehouse", "ROAD__segment-07", "west", 3.18, "industrial"),
    ("far-east-utility", "ROAD__segment-07", "east", 4.52, "service"),
    ("front-utility-annex", "ROAD__segment-01", "north", -18.75, "service"),
    ("front-warehouse", "ROAD__segment-03", "south", -4.24, "logistics"),
    ("gatehouse", "ROAD__segment-02", "west", 20.78, "pedestrian"),
    ("laboratory", "ROAD__segment-07", "east", 14.86, "pedestrian"),
    ("main-production-hall", "ROAD__segment-03", "north", 19.98, "logistics"),
    ("north-east-workshop", "ROAD__segment-04", "north", -16.20, "industrial"),
    ("rear-high-bay", "ROAD__segment-04", "north", 0.0, "industrial"),
]


def world_bounds_xy(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        min(corner.x for corner in corners),
        max(corner.x for corner in corners),
        min(corner.y for corner in corners),
        max(corner.y for corner in corners),
    )


def create_building_access_network(mats, campus):
    """Add final vehicle connections from the road grid to every building edge."""
    bpy.context.view_layer.update()
    group = empty("SITE__building-access-network", parent=campus)
    group["layerRole"] = "building-access-network"
    group["designIntent"] = "last-mile building access, fire response, and pedestrian safety"
    access_surfaces = []
    crosswalk_ids = {"administration", "front-warehouse", "gatehouse", "laboratory"}
    give_way_index = 0
    curb_index = 0

    for building_id, road_name, side, anchor, access_type in BUILDING_ACCESS_SPECS:
        shell = bpy.data.objects[f"{building_id}__wall-shell"]
        road = bpy.data.objects[road_name]
        shell_bounds = world_bounds_xy(shell)
        road_bounds = world_bounds_xy(road)
        road_width = 2.15 if access_type not in {"logistics", "industrial"} else 2.55

        if side == "north":
            building_edge, road_edge = shell_bounds[3], road_bounds[2]
            gap = max(0.08, road_edge - building_edge)
            location = (anchor, (building_edge + road_edge) / 2, 0.055)
            size = (road_width, gap + 0.18, 0.11)
            apron_depth = min(1.65, max(0.34, gap * 0.42))
            apron_location = (anchor, building_edge + apron_depth / 2, 0.065)
            apron_size = (road_width + 1.25, apron_depth, 0.13)
            long_axis = "y"
        elif side == "south":
            building_edge, road_edge = shell_bounds[2], road_bounds[3]
            gap = max(0.08, building_edge - road_edge)
            location = (anchor, (building_edge + road_edge) / 2, 0.055)
            size = (road_width, gap + 0.18, 0.11)
            apron_depth = min(1.65, max(0.34, gap * 0.42))
            apron_location = (anchor, building_edge - apron_depth / 2, 0.065)
            apron_size = (road_width + 1.25, apron_depth, 0.13)
            long_axis = "y"
        elif side == "west":
            building_edge, road_edge = shell_bounds[0], road_bounds[1]
            gap = max(0.08, building_edge - road_edge)
            location = ((building_edge + road_edge) / 2, anchor, 0.055)
            size = (gap + 0.18, road_width, 0.11)
            apron_depth = min(1.65, max(0.34, gap * 0.42))
            apron_location = (building_edge - apron_depth / 2, anchor, 0.065)
            apron_size = (apron_depth, road_width + 1.25, 0.13)
            long_axis = "x"
        else:
            building_edge, road_edge = shell_bounds[1], road_bounds[0]
            gap = max(0.08, road_edge - building_edge)
            location = ((building_edge + road_edge) / 2, anchor, 0.055)
            size = (gap + 0.18, road_width, 0.11)
            apron_depth = min(1.65, max(0.34, gap * 0.42))
            apron_location = (building_edge + apron_depth / 2, anchor, 0.065)
            apron_size = (apron_depth, road_width + 1.25, 0.13)
            long_axis = "x"

        spur = box(f"ACCESS__{building_id}__spur", size, location, mats["asphalt"], group, 0.025)
        apron = box(f"ACCESS__{building_id}__apron", apron_size, apron_location, mats["concrete"], group, 0.028)
        for obj, role in ((spur, "building-access-road"), (apron, "building-access-apron")):
            obj["buildingId"] = building_id
            obj["targetRoad"] = road_name
            obj["accessType"] = access_type
            obj["layerRole"] = role
        access_surfaces.extend((spur, apron))

        route_length = size[1] if long_axis == "y" else size[0]
        if route_length >= 0.85:
            for edge_label, edge_sign in (("left", -1), ("right", 1)):
                curb_index += 1
                if long_axis == "y":
                    curb_size = (0.10, max(0.30, size[1] - 0.18), 0.16)
                    curb_location = (location[0] + edge_sign * (road_width / 2 + 0.08), location[1], 0.13)
                else:
                    curb_size = (max(0.30, size[0] - 0.18), 0.10, 0.16)
                    curb_location = (location[0], location[1] + edge_sign * (road_width / 2 + 0.08), 0.13)
                box(
                    f"ACCESS_DETAIL__curb-{curb_index:02d}-{edge_label}",
                    curb_size,
                    curb_location,
                    mats["curb"],
                    group,
                    0.018,
                )

        if building_id in crosswalk_ids:
            for stripe_index in range(6):
                offset = (stripe_index - 2.5) * 0.19
                if long_axis == "y":
                    stripe_size = (road_width * 0.82, 0.10, 0.024)
                    stripe_location = (location[0], location[1] + offset, 0.124)
                else:
                    stripe_size = (0.10, road_width * 0.82, 0.024)
                    stripe_location = (location[0] + offset, location[1], 0.124)
                box(
                    f"ACCESS_DETAIL__crosswalk-{building_id}-{stripe_index + 1:02d}",
                    stripe_size,
                    stripe_location,
                    mats["stripe"],
                    group,
                    0,
                )

        if access_type in {"industrial", "logistics"}:
            give_way_index += 1
            if long_axis == "y":
                marking_size = (road_width * 0.76, 0.09, 0.025)
                marking_location = (location[0], location[1], 0.125)
            else:
                marking_size = (0.09, road_width * 0.76, 0.025)
                marking_location = (location[0], location[1], 0.125)
            box(
                f"ACCESS_DETAIL__give-way-{give_way_index:02d}",
                marking_size,
                marking_location,
                mats["safety_yellow"],
                group,
                0,
            )

    hydrant_locations = [
        (-10.55, -11.55),
        (-24.65, -8.35),
        (-24.55, 5.75),
        (5.45, 7.05),
        (23.95, 7.15),
        (2.20, -15.35),
    ]
    for index, (x, y) in enumerate(hydrant_locations, start=1):
        root = empty(f"FIRE__hydrant-{index:02d}", (x, y, 0), group)
        root["layerRole"] = "fire-safety"
        cylinder(f"FIRE__hydrant-{index:02d}__base", 0.16, 0.10, (0, 0, 0.15), mats["facade_frame"], root, vertices=12)
        cylinder(f"FIRE__hydrant-{index:02d}__body", 0.11, 0.58, (0, 0, 0.48), mats["fire_red"], root, vertices=12)
        cylinder(f"FIRE__hydrant-{index:02d}__cap", 0.15, 0.10, (0, 0, 0.82), mats["fire_red"], root, vertices=12)
        for side_sign in (-1, 1):
            cylinder(
                f"FIRE__hydrant-{index:02d}__outlet-{side_sign:+d}",
                0.065,
                0.16,
                (side_sign * 0.14, 0, 0.56),
                mats["facade_frame"],
                root,
                rotation=(0, math.pi / 2, 0),
                vertices=12,
            )

    return group, access_surfaces


def create_vehicle_route(route_id, points, loop_mode, dwell_fraction, parent):
    route = empty(f"ROUTE__{route_id}", parent=parent)
    route["routeId"] = route_id
    route["layerRole"] = "vehicle-route"
    route["loopMode"] = loop_mode
    route["dwellFraction"] = dwell_fraction
    for order, point in enumerate(points, start=1):
        waypoint = empty(f"WAYPOINT__{route_id}__{order:02d}", (*point, 0.0), route)
        waypoint["routeId"] = route_id
        waypoint["waypointOrder"] = order
        waypoint["layerRole"] = "vehicle-waypoint"
    return route


def configure_route_vehicle(vehicle, route_id, speed, phase, vehicle_width):
    vehicle["motionPath"] = "campus-route"
    vehicle["linkedRoute"] = route_id
    vehicle["motionSpeed"] = speed
    vehicle["motionPhase"] = phase
    vehicle["vehicleWidth"] = vehicle_width
    return vehicle


def create_operational_traffic(mats, campus):
    """Create GLB-authored routes for internal logistics and perimeter patrol vehicles."""
    traffic = empty("SITE__operational-traffic", parent=campus)
    traffic["layerRole"] = "operational-traffic"
    routes = {
        "warehouse-delivery": {
            "loopMode": "ping-pong",
            "dwellFraction": 0.14,
            "points": [(28.8, 20.7), (28.8, 9.0), (8.0, 9.0), (-4.2, 9.0), (-4.2, 10.8), (-4.2, 11.4), (-4.2, 11.85)],
        },
        "maintenance-service": {
            "loopMode": "ping-pong",
            "dwellFraction": 0.10,
            "points": [(28.8, 7.1), (20.0, 9.0), (20.0, 7.8), (20.0, 6.4), (20.0, 5.2), (20.0, 4.75)],
        },
        "fire-patrol": {
            "loopMode": "loop",
            "dwellFraction": 0.0,
            "points": [(38.18, 20.0), (38.18, -28.28), (0.0, -28.28), (-38.18, -28.28), (-38.18, 0.0), (-38.18, 28.28), (0.0, 28.28), (38.18, 28.28), (38.18, 20.0)],
        },
    }
    for route_id, spec in routes.items():
        create_vehicle_route(route_id, spec["points"], spec["loopMode"], spec["dwellFraction"], traffic)

    delivery_start = (*routes["warehouse-delivery"]["points"][0], 0.08)
    delivery = create_vehicle(
        "VEHICLE__delivery-truck",
        delivery_start,
        mats,
        traffic,
        length=2.35,
        width=0.78,
        height=0.84,
        color="bus",
        rotation_z=-math.pi / 2,
    )
    configure_route_vehicle(delivery, "warehouse-delivery", 0.022, 0.02, 0.78)

    maintenance_start = (*routes["maintenance-service"]["points"][0], 0.08)
    maintenance = create_vehicle(
        "VEHICLE__maintenance-van",
        maintenance_start,
        mats,
        traffic,
        length=1.55,
        width=0.68,
        height=0.65,
        color="vehicle_blue",
        rotation_z=math.radians(168),
    )
    configure_route_vehicle(maintenance, "maintenance-service", 0.030, 0.31, 0.68)
    box("VEHICLE__maintenance-van__lightbar-base", (0.48, 0.16, 0.05), (0, 0, 0.71), mats["facade_frame"], maintenance, 0.012)
    box("VEHICLE__maintenance-van__lightbar-amber", (0.38, 0.12, 0.07), (0, 0, 0.77), mats["safety_yellow"], maintenance, 0.018)

    fire_start = (*routes["fire-patrol"]["points"][0], 0.08)
    fire_patrol = create_vehicle(
        "VEHICLE__fire-patrol",
        fire_start,
        mats,
        traffic,
        length=1.75,
        width=0.72,
        height=0.68,
        color="fire_red",
        rotation_z=-math.pi / 2,
    )
    configure_route_vehicle(fire_patrol, "fire-patrol", 0.018, 0.58, 0.72)
    box("VEHICLE__fire-patrol__lightbar-base", (0.56, 0.17, 0.05), (0, 0, 0.75), mats["facade_frame"], fire_patrol, 0.012)
    box("VEHICLE__fire-patrol__lightbar-red", (0.23, 0.13, 0.07), (-0.14, 0, 0.81), mats["fire_red"], fire_patrol, 0.014)
    box("VEHICLE__fire-patrol__lightbar-blue", (0.23, 0.13, 0.07), (0.14, 0, 0.81), mats["accent"], fire_patrol, 0.014)
    for side in (-1, 1):
        box(
            f"VEHICLE__fire-patrol__side-stripe-{side:+d}",
            (1.18, 0.025, 0.10),
            (0, side * 0.366, 0.42),
            mats["white"],
            fire_patrol,
            0.004,
        )
    return traffic


def create_ground_road_landscape_art(mats, campus):
    """Layer restrained construction, wear, and planting detail over the approved site plan."""
    group = empty("SITE__surface-art", parent=campus)
    group["layerRole"] = "site-surface-art"
    group["designIntent"] = "semi-realistic industrial hardscape and planted-edge depth"

    def tag(obj, role):
        obj["layerRole"] = role
        return obj

    patch_specs = [
        (-27.0, 28.28, 3.8, 0.58, 0),
        (-13.0, 28.28, 2.9, 0.72, 0),
        (5.5, 28.28, 4.4, 0.54, 0),
        (18.5, 28.28, 3.2, 0.66, 0),
        (-25.0, -28.28, 3.4, 0.62, 0),
        (-7.0, -28.28, 4.8, 0.50, 0),
        (12.0, -28.28, 3.1, 0.70, 0),
        (27.0, -28.28, 4.1, 0.54, 0),
        (-29.0, 9.05, 3.2, 0.45, 0),
        (-14.0, 9.05, 4.0, 0.52, 0),
        (8.0, 9.05, 3.6, 0.44, 0),
        (27.0, 9.05, 4.2, 0.50, 0),
        (-20.0, -13.29, 3.3, 0.48, 0),
        (17.0, -13.29, 4.5, 0.46, 0),
    ]
    for index, (x, y, width, depth, rotation_z) in enumerate(patch_specs, start=1):
        patch = box(
            f"SURFACE_ART__asphalt-patch-{index:02d}",
            (width, depth, 0.018),
            (x, y, 0.122),
            mats["asphalt_repair"],
            group,
            0.012,
            rotation=(0, 0, rotation_z),
        )
        tag(patch, "asphalt-repair")

    wear_specs = [
        (-20.0, 28.28, 5.8, 0),
        (12.0, 28.28, 6.6, 0),
        (-14.0, -28.28, 6.2, 0),
        (23.0, -28.28, 5.4, 0),
    ]
    wear_index = 1
    for x, y, length, rotation_z in wear_specs:
        for lane_offset in (-0.46, 0.46):
            wear = box(
                f"SURFACE_ART__traffic-wear-{wear_index:02d}",
                (length, 0.085, 0.012),
                (x, y + lane_offset, 0.124),
                mats["traffic_wear"],
                group,
                0.006,
                rotation=(0, 0, rotation_z),
            )
            tag(wear, "traffic-wear")
            wear_index += 1

    seam_specs = [
        (-31.0, 28.28, 2.12, 0), (-18.0, 28.28, 2.12, 0), (-2.0, 28.28, 2.12, 0),
        (14.0, 28.28, 2.12, 0), (30.0, 28.28, 2.12, 0),
        (-30.0, -28.28, 2.12, 0), (-12.0, -28.28, 2.12, 0), (6.0, -28.28, 2.12, 0),
        (22.0, -28.28, 2.12, 0), (34.0, -28.28, 2.12, 0),
    ]
    for index, (x, y, length, rotation_z) in enumerate(seam_specs, start=1):
        seam = box(
            f"SURFACE_ART__expansion-seam-{index:02d}",
            (0.035, length, 0.012),
            (x, y, 0.126),
            mats["traffic_wear"],
            group,
            0.003,
            rotation=(0, 0, rotation_z),
        )
        tag(seam, "road-expansion-joint")

    for index, (x, y) in enumerate(((-21.0, 28.28), (10.0, -28.28), (-38.18, -4.0), (38.18, -14.0)), start=1):
        cover = cylinder(
            f"SURFACE_ART__utility-cover-{index:02d}",
            0.31,
            0.035,
            (x, y, 0.132),
            mats["utility_iron"],
            group,
            vertices=16,
        )
        cover["serviceType"] = "stormwater" if index % 2 else "utility"
        tag(cover, "utility-cover")

    for index in range(12):
        x = 26.05 + index * 0.53
        joint = box(
            f"PAVING_DETAIL__joint-{index + 1:02d}",
            (0.026, 2.72, 0.014),
            (x, 24.04, 0.162),
            mats["paving_joint"],
            group,
            0.002,
        )
        tag(joint, "paving-construction-joint")

    parking_center = Vector((16.7 * PLAN_SCALE, 10.5 * PLAN_SCALE))
    bay_number = 1
    for py in (-2.30, 2.30):
        for px in (-3.0, -1.5, 0, 1.5, 3.0):
            plaque = box(
                f"PARKING_DETAIL__bay-id-{bay_number:02d}",
                (0.58, 0.24, 0.018),
                (parking_center.x + px, parking_center.y + py, 0.132),
                mats["safety_yellow"] if bay_number in {1, 6} else mats["paving_joint"],
                group,
                0.012,
            )
            plaque["bayNumber"] = bay_number
            plaque["bayClass"] = "priority" if bay_number in {1, 6} else "standard"
            tag(plaque, "parking-bay-identity")
            bay_number += 1

    rain_gardens = [
        (-13.5 * PLAN_SCALE, 7.78 * PLAN_SCALE, 8.2, 0.72),
        (11.5 * PLAN_SCALE, 7.78 * PLAN_SCALE, 9.8, 0.72),
        (-3.0 * PLAN_SCALE, 5.0 * PLAN_SCALE, 5.8, 0.62),
    ]
    landscape_index = 1
    for x, y, width, depth in rain_gardens:
        for edge_sign in (-1, 1):
            edge = box(
                f"LANDSCAPE_ART__aggregate-edge-{landscape_index:02d}",
                (width + 0.30, 0.12, 0.075),
                (x, y + edge_sign * (depth / 2 + 0.08), 0.108),
                mats["warm_aggregate"],
                group,
                0.035,
            )
            tag(edge, "landscape-aggregate-edge")
            landscape_index += 1

    flower_beds = [
        (12.5 * PLAN_SCALE, 15.7 * PLAN_SCALE, 2.4, 0.48),
        (-8.5 * PLAN_SCALE, 16.0 * PLAN_SCALE, 3.2, 0.52),
        (-19.5 * PLAN_SCALE, 15.8 * PLAN_SCALE, 2.4, 0.48),
    ]
    for x, y, width, depth in flower_beds:
        bed = box(
            f"LANDSCAPE_ART__mulch-bed-{landscape_index:02d}",
            (width + 0.42, depth + 0.30, 0.055),
            (x, y, 0.052),
            mats["planting_mulch"],
            group,
            0.11,
        )
        tag(bed, "landscape-mulch-bed")
        landscape_index += 1

    for index in range(1, 13):
        crown = bpy.data.objects.get(f"LANDSCAPE__inner-tree-crown-{index:02d}")
        if not crown:
            continue
        if index % 4 == 0:
            crown["foliageTone"] = "warm"
        elif index % 3 == 0:
            crown["foliageTone"] = "light"
        else:
            crown["foliageTone"] = "deep"

    return group


def configure_ground_function_zones(mats, campus):
    """Give site surfaces explicit operational PBR identities without changing layout."""
    group = empty("SITE__ground-function-zones", parent=campus)
    group["layerRole"] = "ground-function-zones"

    def assign(name, mat, role):
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "MESH":
            return None
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj["groundRole"] = role
        return obj

    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.name.startswith(("ROAD__", "ACCESS__")) and (
            obj.name.startswith("ROAD__") or obj.name.endswith("__spur")
        ):
            obj.data.materials.clear()
            obj.data.materials.append(mats["asphalt"])
            obj["groundRole"] = "new-asphalt"
    assign("SITE__outer-boulevard", mats["asphalt"], "new-asphalt")
    assign("LOGISTICS__front-warehouse-apron", mats["loading_concrete"], "loading-concrete")
    assign("SITE__entry-plaza", mats["paving"], "entry-paving")
    assign("PARKING__surface", mats["parking_surface"], "parking-surface")
    assign("SITE__ground", mats["lawn"], "lawn")
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.name.startswith("PEDESTRIAN__walkway-"):
            obj.data.materials.clear()
            obj.data.materials.append(mats["walkway"])
            obj["groundRole"] = "walkway"
        elif obj.type == "MESH" and obj.name.startswith("LANDSCAPE_ART__mulch-bed-"):
            obj["groundRole"] = "mulch"
        elif obj.type == "MESH" and obj.name.startswith("LANDSCAPE__rain-garden-") and "-grass-" not in obj.name:
            obj["groundRole"] = "bare-soil"

    aged = box(
        "SURFACE_ZONE__aged-asphalt-01",
        (8.6, 1.38, 0.018),
        (-14.0, 9.05, 0.126),
        mats["aged_asphalt"],
        group,
        0.012,
    )
    aged["groundRole"] = "aged-asphalt"
    aged["anchorName"] = "ROAD__segment-02"
    return group


def create_ground_contact_realism(mats, campus):
    """Add restrained, cause-based wear and contact transitions at named site anchors."""
    group = empty("SITE__ground-contact-realism", parent=campus)
    group["layerRole"] = "ground-contact-realism"
    group["designIntent"] = "localized operational wear without black AO halos"

    def tag(obj, role, anchor_type, anchor_name):
        obj["wearRole"] = role
        obj["layerRole"] = f"ground-{role}"
        obj["detailTier"] = "micro"
        obj["anchorType"] = anchor_type
        obj["anchorName"] = anchor_name
        return obj

    route_marks = [
        ("WAYPOINT__warehouse-delivery__02", 0),
        ("WAYPOINT__warehouse-delivery__03", 0),
        ("WAYPOINT__warehouse-delivery__04", 0),
        ("WAYPOINT__maintenance-service__02", 0),
        ("WAYPOINT__maintenance-service__03", math.pi / 2),
        ("WAYPOINT__fire-patrol__02", math.pi / 2),
        ("WAYPOINT__fire-patrol__03", 0),
        ("WAYPOINT__fire-patrol__04", 0),
    ]
    for index, (anchor_name, rotation_z) in enumerate(route_marks, start=1):
        anchor = bpy.data.objects[anchor_name]
        position = anchor.matrix_world.translation
        mark = box(
            f"GROUND_CONTACT__tire-darkening-{index:02d}",
            (1.65, 0.16, 0.018),
            (position.x, position.y + (0.24 if index % 2 else -0.24), 0.128),
            mats["ground_tire_wear"],
            group,
            0.02,
            rotation=(0, 0, rotation_z),
        )
        tag(mark, "tire-darkening", "vehicle-route", anchor_name)

    apron = bpy.data.objects["LOGISTICS__front-warehouse-apron"]
    apron_position = apron.matrix_world.translation
    for index in range(10):
        offset = -3.4 + index * 0.76
        joint = box(
            f"GROUND_CONTACT__concrete-joint-{index + 1:02d}",
            (0.025, 2.10, 0.016),
            (apron_position.x + offset, apron_position.y, 0.127),
            mats["ground_joint"],
            group,
            0.004,
        )
        tag(joint, "concrete-joint", "loading-apron", apron.name)

    repair_anchors = [name for name, _rotation in route_marks[:6]]
    for index, anchor_name in enumerate(repair_anchors, start=1):
        position = bpy.data.objects[anchor_name].matrix_world.translation
        repair = box(
            f"GROUND_CONTACT__asphalt-repair-{index:02d}",
            (1.45 + (index % 3) * 0.34, 0.48 + (index % 2) * 0.14, 0.018),
            (position.x + 0.72, position.y - 0.52, 0.128),
            mats["ground_repair"],
            group,
            0.05,
        )
        tag(repair, "asphalt-repair", "vehicle-route", anchor_name)

    for index in range(1, 5):
        anchor_name = f"DETAIL__storm-drain-{index:02d}"
        anchor = bpy.data.objects[anchor_name]
        position = anchor.matrix_world.translation
        stain = box(
            f"GROUND_CONTACT__drain-discoloration-{index:02d}",
            (0.76, 0.38, 0.016),
            (position.x, position.y, max(0.127, position.z + 0.022)),
            mats["ground_drain_stain"],
            group,
            0.08,
        )
        tag(stain, "drain-discoloration", "storm-drain", anchor_name)

    dock_names = [
        "LOGISTICS__dock-platform-01",
        "LOGISTICS__dock-platform-02",
        "LOGISTICS__dock-platform-03",
        "WAREHOUSE__dock-platform",
        "FINISHED__dock-platform",
    ]
    for index, anchor_name in enumerate(dock_names, start=1):
        anchor = bpy.data.objects[anchor_name]
        position = anchor.matrix_world.translation
        abrasion = box(
            f"GROUND_CONTACT__dock-abrasion-{index:02d}",
            (max(0.72, anchor.dimensions.x * 0.72), 0.16, 0.016),
            (position.x, position.y, position.z + anchor.dimensions.z / 2 + 0.012),
            mats["ground_dock_abrasion"],
            group,
            0.025,
        )
        tag(abrasion, "dock-abrasion", "loading-dock", anchor_name)

    for building_id, _position, (width, depth, _height), _kind in BUILDINGS:
        anchor_name = f"BLDG__{building_id}"
        anchor = bpy.data.objects[anchor_name]
        position = anchor.matrix_world.translation
        dust = box(
            f"GROUND_CONTACT__wall-base-dust-{building_id}",
            (max(0.72, width * 0.62), 0.22, 0.018),
            (position.x, position.y + depth / 2 + 0.20, 0.128),
            mats["ground_wall_dust"],
            group,
            0.045,
        )
        tag(dust, "wall-base-dust", "building", anchor_name)

    oil_anchors = ["PROCESS__equipment-pad", "LOGISTICS__front-warehouse-apron", "ACCESS__main-production-hall__apron"]
    for index, anchor_name in enumerate(oil_anchors, start=1):
        anchor = bpy.data.objects[anchor_name]
        position = anchor.matrix_world.translation
        oil = cylinder(
            f"GROUND_CONTACT__oil-mark-{index:02d}",
            0.28 + index * 0.035,
            0.018,
            (position.x + index * 0.34, position.y - 0.26, max(0.128, position.z + anchor.dimensions.z / 2 + 0.012)),
            mats["ground_oil_mark"],
            group,
            vertices=18,
        )
        oil.scale.y = 0.58 + index * 0.08
        tag(oil, "oil-mark", "service-zone", anchor_name)

    for index in range(1, 13):
        anchor_name = f"LANDSCAPE__inner-tree-trunk-{index:02d}"
        anchor = bpy.data.objects[anchor_name]
        position = anchor.matrix_world.translation
        mulch = cylinder(
            f"GROUND_CONTACT__tree-mulch-{index:02d}",
            0.38,
            0.020,
            (position.x, position.y, 0.135),
            mats["planting_mulch"],
            group,
            vertices=18,
        )
        mulch["groundRole"] = "mulch"
        tag(mulch, "contact-transition", "tree-base", anchor_name)
    return group


def create_ground_circulation_realism(mats, campus):
    """Clarify service circulation with broad hardstands and low-frequency wear cues."""
    group = empty("SITE__ground-circulation-realism", parent=campus)
    group["realismSystem"] = "functional-circulation"
    group["designIntent"] = "readable service yards, drainage, and vehicle paths"

    for obj in bpy.data.objects:
        if obj.name.startswith(("GROUND_CONTACT__tire-darkening-", "SURFACE_ART__traffic-wear-")):
            obj["groundDetailRole"] = "tire-wear"
        elif obj.name.startswith(("ROAD_DETAIL__drain-channel-", "DETAIL__storm-drain-")):
            obj["groundDetailRole"] = "drainage"

    service_ids = (
        "main-production-hall",
        "central-processing-hall",
        "east-process-hall",
        "east-warehouse",
        "front-warehouse",
    )
    building_dimensions = {building_id: size for building_id, _position, size, _kind in BUILDINGS}
    drain_index = 1
    for yard_index, building_id in enumerate(service_ids, start=1):
        anchor = bpy.data.objects[f"BLDG__{building_id}"]
        width, depth, _height = building_dimensions[building_id]
        world = anchor.matrix_world.translation
        pad_width = min(6.2, max(3.4, width * 0.58))
        pad_depth = 1.42 if building_id != "main-production-hall" else 1.72
        pad_y = world.y - depth / 2 - pad_depth / 2 - 0.18
        pad = box(
            f"GROUND_CIRCULATION__service-yard-{yard_index:02d}",
            (pad_width, pad_depth, 0.055),
            (world.x, pad_y, 0.112),
            mats["loading_concrete"],
            group,
            0.035,
        )
        pad["groundDetailRole"] = "service-yard"
        pad["anchorName"] = anchor.name
        pad["detailScale"] = "macro"

        for joint_index, offset in enumerate((-0.26, 0.26), start=1):
            joint = box(
                f"GROUND_CIRCULATION__yard-joint-{yard_index:02d}-{joint_index:02d}",
                (pad_width * 0.88, 0.026, 0.012),
                (world.x, pad_y + offset * pad_depth, 0.147),
                mats["ground_joint"],
                group,
                0.003,
            )
            joint["groundDetailRole"] = "construction-joint"
            joint["detailTier"] = "micro"

        for side in (-1, 1):
            drain = box(
                f"GROUND_CIRCULATION__yard-drain-{drain_index:02d}",
                (0.12, pad_depth * 0.82, 0.018),
                (world.x + side * pad_width * 0.43, pad_y, 0.151),
                mats["drain"],
                group,
                0.012,
            )
            drain["groundDetailRole"] = "drainage"
            drain["anchorName"] = anchor.name
            drain_index += 1
    return group


def create_street_bench(prefix, location, rotation, mats, parent):
    bench = empty(prefix, location, parent)
    bench.rotation_euler[2] = rotation
    for slat_index, py in enumerate((-0.15, -0.05, 0.05, 0.15), start=1):
        slat = box(
            f"{prefix}__seat-slat-{slat_index:02d}",
            (1.52, 0.075, 0.055),
            (0, py, 0.42),
            mats["street_timber"],
            bench,
            0.018,
        )
        slat["layerRole"] = "street-furniture-bench"
    for slat_index, pz in enumerate((0.58, 0.72, 0.86), start=1):
        slat = box(
            f"{prefix}__back-slat-{slat_index:02d}",
            (1.52, 0.055, 0.07),
            (0, -0.18, pz),
            mats["street_timber"],
            bench,
            0.018,
        )
        slat["layerRole"] = "street-furniture-bench"
    for leg_index, px in enumerate((-0.58, 0.58), start=1):
        leg = box(
            f"{prefix}__leg-{leg_index:02d}",
            (0.10, 0.34, 0.38),
            (px, 0, 0.19),
            mats["street_metal"],
            bench,
            0.018,
        )
        leg["layerRole"] = "street-furniture-bench"
        leg["groundContact"] = True
    return bench


def create_waste_station(prefix, location, mats, parent):
    station = empty(prefix, location, parent)
    for bin_index, (px, mat_key, waste_type) in enumerate(((-0.18, "bin_blue", "recycling"), (0.18, "street_metal", "general")), start=1):
        body = box(
            f"{prefix}__body-{bin_index:02d}",
            (0.30, 0.34, 0.68),
            (px, 0, 0.34),
            mats[mat_key],
            station,
            0.045,
        )
        body["layerRole"] = "street-furniture-bin"
        body["wasteType"] = waste_type
        body["groundContact"] = True
        lid = box(
            f"{prefix}__lid-{bin_index:02d}",
            (0.32, 0.36, 0.065),
            (px, 0, 0.70),
            mats["facade_frame"],
            station,
            0.022,
        )
        lid["layerRole"] = "street-furniture-bin"
    return station


def create_wayfinding_pylon(prefix, location, rotation, mats, parent):
    pylon = empty(prefix, location, parent)
    pylon.rotation_euler[2] = rotation
    base = box(f"{prefix}__base", (0.72, 0.34, 0.14), (0, 0, 0.07), mats["street_metal"], pylon, 0.035)
    base["layerRole"] = "pedestrian-wayfinding"
    base["groundContact"] = True
    post = box(f"{prefix}__post", (0.18, 0.18, 1.48), (0, 0, 0.80), mats["street_metal"], pylon, 0.025)
    post["layerRole"] = "pedestrian-wayfinding"
    panel = box(f"{prefix}__panel", (0.82, 0.16, 0.72), (0, 0, 1.42), mats["facade_frame"], pylon, 0.035)
    panel["layerRole"] = "pedestrian-wayfinding"
    for bar_index, pz in enumerate((1.25, 1.42, 1.59), start=1):
        bar = box(
            f"{prefix}__identity-bar-{bar_index:02d}",
            (0.58 - (bar_index - 1) * 0.08, 0.035, 0.055),
            (-0.04, -0.10, pz),
            mats["wayfinding_amber"],
            pylon,
            0.008,
        )
        bar["layerRole"] = "pedestrian-wayfinding"
    return pylon


def create_safety_cone(prefix, location, mats, parent):
    cone = empty(prefix, location, parent)
    base = cylinder(f"{prefix}__base", 0.15, 0.055, (0, 0, 0.035), mats["tire"], cone, vertices=12)
    base["layerRole"] = "operational-safety-cone"
    base["groundContact"] = True
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.115, radius2=0.025, depth=0.34, location=(0, 0, 0))
    body = bpy.context.object
    body.name = f"{prefix}__body"
    body.parent = cone
    body.location = (0, 0, 0.23)
    body.data.materials.append(mats["safety_orange"])
    body["layerRole"] = "operational-safety-cone"
    band = cylinder(f"{prefix}__reflective-band", 0.075, 0.055, (0, 0, 0.28), mats["white"], cone, vertices=12)
    band["layerRole"] = "operational-safety-cone"
    return cone


def create_loading_cage(prefix, location, mats, parent):
    cage = empty(prefix, location, parent)
    base = box(f"{prefix}__base", (0.78, 0.58, 0.12), (0, 0, 0.07), mats["street_metal"], cage, 0.018)
    base["layerRole"] = "loading-support-prop"
    base["groundContact"] = True
    for post_index, (px, py) in enumerate(((-0.34, -0.24), (-0.34, 0.24), (0.34, -0.24), (0.34, 0.24)), start=1):
        post = box(f"{prefix}__post-{post_index:02d}", (0.045, 0.045, 0.82), (px, py, 0.47), mats["gutter"], cage, 0.006)
        post["layerRole"] = "loading-support-prop"
    for rail_index, pz in enumerate((0.30, 0.58, 0.84), start=1):
        rail = box(f"{prefix}__rail-{rail_index:02d}", (0.74, 0.045, 0.035), (0, -0.25, pz), mats["gutter"], cage, 0.004)
        rail["layerRole"] = "loading-support-prop"
    return cage


def create_campus_operational_story(mats, campus):
    """Add close-range pedestrian, landscape, gate, and loading narratives."""
    group = empty("SITE__operational-story", parent=campus)
    group["layerRole"] = "campus-operational-story"
    group["designIntent"] = "medium and close range campus life without route obstruction"

    furniture_specs = [
        ((8.0, 20.2, 0), 0.0),
        ((18.8, 20.2, 0), math.pi),
        ((18.5, -17.2, 0), 0.0),
        ((-27.0, 20.0, 0), 0.0),
    ]
    for index, (location, rotation) in enumerate(furniture_specs, start=1):
        create_street_bench(f"STREET_FURNITURE__bench-{index:02d}", location, rotation, mats, group)
        bin_location = (location[0] + (1.20 if index % 2 else -1.20), location[1], 0)
        create_waste_station(f"STREET_FURNITURE__bin-{index:02d}", bin_location, mats, group)

    for index, (location, rotation) in enumerate((((6.2, 20.5, 0), 0.0), ((20.5, 20.5, 0), math.pi), ((-24.8, 19.8, 0), 0.0)), start=1):
        create_wayfinding_pylon(f"STREET_FURNITURE__pylon-{index:02d}", location, rotation, mats, group)

    understory_positions = [
        (7.1, 19.35), (19.7, 19.35), (-12.0, 21.7), (-27.7, 21.7),
        (-19.0, 10.2), (-15.2, 10.2), (12.8, 10.2), (17.0, 10.2),
        (18.1, -17.45), (30.0, -17.45), (8.0, -17.45), (6.2, -17.45),
    ]
    for index, (x, y) in enumerate(understory_positions, start=1):
        shrub = empty(f"VEGETATION_DETAIL__understory-{index:02d}", (x, y, 0), group)
        base = cylinder(f"VEGETATION_DETAIL__understory-{index:02d}__mulch", 0.34, 0.06, (0, 0, 0.04), mats["planting_mulch"], shrub, vertices=12)
        base["layerRole"] = "understory-planting"
        base["groundContact"] = True
        for lobe_index, (px, py, scale) in enumerate(((-0.12, 0.02, 1.0), (0.13, -0.04, 0.82)), start=1):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.24, location=(0, 0, 0))
            lobe = bpy.context.object
            lobe.name = f"VEGETATION_DETAIL__understory-{index:02d}__lobe-{lobe_index:02d}"
            lobe.parent = shrub
            lobe.location = (px, py, 0.22 + lobe_index * 0.035)
            lobe.scale = (scale, scale * 0.82, scale * 0.76)
            lobe.data.materials.append(mats["understory_warm"] if (index + lobe_index) % 3 == 0 else mats["understory_deep"])
            lobe["layerRole"] = "understory-planting"

    gate_root = empty("OPERATION_DETAIL__gate-equipment", (31.35, 24.75, 0), group)
    gate_base = box("OPERATION_DETAIL__gate-equipment__base", (0.48, 0.48, 0.14), (0, 0, 0.07), mats["street_metal"], gate_root, 0.035)
    gate_base["layerRole"] = "gate-access-equipment"
    gate_base["groundContact"] = True
    gate_mast = box("OPERATION_DETAIL__gate-equipment__mast", (0.12, 0.12, 1.72), (0, 0, 0.91), mats["street_metal"], gate_root, 0.018)
    gate_mast["layerRole"] = "gate-access-equipment"
    gate_head = box("OPERATION_DETAIL__gate-equipment__camera", (0.38, 0.24, 0.22), (-0.12, 0, 1.74), mats["facade_frame"], gate_root, 0.045)
    gate_head["layerRole"] = "gate-access-equipment"
    lens = cylinder("OPERATION_DETAIL__gate-equipment__lens", 0.065, 0.055, (-0.32, 0, 1.75), mats["glass"], gate_root, rotation=(0, math.pi / 2, 0), vertices=16)
    lens["layerRole"] = "gate-access-equipment"

    cone_positions = [
        (31.25, 22.85), (31.25, 26.45),
        (-7.1, 17.15), (-4.2, 17.15), (-1.4, 17.15),
        (-22.2, 6.75), (-19.8, 6.75), (-17.4, 6.75),
    ]
    for index, (x, y) in enumerate(cone_positions, start=1):
        create_safety_cone(f"OPERATION_DETAIL__safety-cone-{index:02d}", (x, y, 0), mats, group)

    loading_positions = [(-6.1, 16.85), (-2.2, 16.85), (-21.3, 6.65), (-18.2, 6.65)]
    for index, (x, y) in enumerate(loading_positions, start=1):
        create_loading_cage(f"OPERATION_DETAIL__loading-cage-{index:02d}", (x, y, 0), mats, group)

    walker_specs = [
        ((4.8, 20.0, 0.12), "x", 3.0, 0.050, 0.12),
        ((18.5, -17.0, 0.12), "x", 1.8, 0.046, 0.48),
        ((-23.5, 19.7, 0.12), "x", 2.4, 0.052, 0.76),
    ]
    for index, (location, axis, distance, speed, phase) in enumerate(walker_specs, start=1):
        walker = create_site_patrol_walker(
            index,
            location,
            axis,
            distance,
            speed,
            phase,
            mats,
            group,
            name=f"OPERATION_DETAIL__walker-{index:02d}",
        )
        for child in walker.children_recursive:
            if child.type == "MESH":
                child["layerRole"] = "operational-walker"

    return group


def mark_operational_prop(prop, role, zone, anchor_name, ground_names=()):
    """Attach the Web/audit contract to every visible component of one work prop."""
    ground_names = set(ground_names)
    nodes = [prop, *prop.children_recursive]
    for node in nodes:
        if node.type != "MESH":
            continue
        node["operationRole"] = role
        node["operationalZone"] = zone
        node["anchorName"] = anchor_name
        node["layerRole"] = f"operational-{role}"
        if node.name in ground_names or node.name.endswith("__base"):
            node["groundContact"] = True
    return prop


def create_operational_sign(prefix, location, role, zone, anchor_name, mats, parent):
    sign = empty(prefix, location, parent)
    base = box(f"{prefix}__base", (0.42, 0.30, 0.10), (0, 0, 0.06), mats["concrete"], sign, 0.025)
    box(f"{prefix}__post", (0.075, 0.075, 1.05), (0, 0, 0.59), mats["street_metal"], sign, 0.012)
    box(f"{prefix}__panel", (0.62, 0.075, 0.42), (0, 0, 1.02), mats["facade_frame"], sign, 0.025)
    box(f"{prefix}__identity", (0.42, 0.025, 0.06), (0, -0.05, 1.02), mats["wayfinding_amber"], sign, 0.006)
    return mark_operational_prop(sign, role, zone, anchor_name, {base.name})


def create_task_operator(index, name, location, axis, distance, speed, phase, dwell, role, zone, mats, parent):
    start_name = f"TASK_ANCHOR__{name}__start"
    end_name = f"TASK_ANCHOR__{name}__end"
    start = empty(start_name, location, parent)
    end_location = (
        location[0] + (distance if axis == "x" else 0),
        location[1] + (distance if axis == "z" else 0),
        location[2],
    )
    end = empty(end_name, end_location, parent)
    for anchor, purpose in ((start, "reporting"), (end, "inspection")):
        anchor["taskRole"] = role
        anchor["taskAnchorPurpose"] = purpose
        anchor["operationalZone"] = zone
    operator = create_site_patrol_walker(index, location, axis, distance, speed, phase, mats, parent, name=f"TASK_OPERATOR__{name}")
    operator["motionPath"] = "task-route"
    operator["dwellFraction"] = dwell
    operator["taskRole"] = role
    operator["operationalZone"] = zone
    operator["taskStartAnchor"] = start_name
    operator["taskEndAnchor"] = end_name
    for child in operator.children_recursive:
        if child.type == "MESH":
            child["layerRole"] = "purposeful-task-operator"
    return operator


def create_factory_operational_realism(mats, campus):
    """Concentrate authored activity in believable work zones without changing the site plan."""
    existing = bpy.data.objects.get("SITE__operational-realism")
    if existing:
        remove_object_tree(existing)
    root = empty("SITE__operational-realism", parent=campus)
    root["layerRole"] = "industrial-operational-realism"
    root["designIntent"] = "role-based props and purposeful short-shift operator routes"

    zone_specs = {
        "loading-front": ((-4.25, 16.75, 0), "loading"),
        "loading-east": ((-19.80, 6.60, 0), "loading"),
        "process": ((-31.10, -17.95, 0), "process"),
        "administration-entry": ((13.45, 20.25, 0), "administration-entry"),
        "gate": ((33.50, 26.60, 0), "gate"),
    }
    anchors = {}
    for key, (location, zone) in zone_specs.items():
        anchor = empty(f"OPERATION_ANCHOR__{key}", location, root)
        anchor["operationalZone"] = zone
        anchor["layerRole"] = "operational-zone-anchor"
        anchors[key] = anchor

    # Loading fronts: seals and bumpers read at distance; staging props shape the close view.
    dock_sets = (
        ("front", anchors["loading-front"], (-2.70, -0.90, 0.90, 2.70)),
        ("east", anchors["loading-east"], (-2.45, -0.82, 0.82, 2.45)),
    )
    for yard_name, anchor, offsets in dock_sets:
        anchor_name = anchor.name
        apron = box(
            f"OPERATION_REALISM__{yard_name}__loading-apron",
            (7.55, 3.15, .04),
            (anchor.location.x, anchor.location.y + .22, .10),
            mats["loading_concrete"], root, .008,
        )
        mark_operational_prop(apron, "loading-apron", "loading", anchor_name)
        apron["groundContact"] = True
        for index, px in enumerate(offsets, start=1):
            bumper = box(
                f"OPERATION_REALISM__{yard_name}__dock-bumper-{index:02d}",
                (0.52, 0.16, 0.34),
                (anchor.location.x + px, anchor.location.y - 0.82, 0.40),
                mats["dock_rubber"], root, 0.025,
            )
            mark_operational_prop(bumper, "dock-bumper", "loading", anchor_name)
        for index, px in enumerate(offsets[:3], start=1):
            seal = empty(
                f"OPERATION_REALISM__{yard_name}__dock-seal-{index:02d}",
                (anchor.location.x + px, anchor.location.y - 0.74, 0), root,
            )
            box(f"{seal.name}__left", (0.13, 0.16, 1.62), (-0.48, 0, 1.17), mats["dock_rubber"], seal, 0.025)
            box(f"{seal.name}__right", (0.13, 0.16, 1.62), (0.48, 0, 1.17), mats["dock_rubber"], seal, 0.025)
            box(f"{seal.name}__head", (1.08, 0.16, 0.16), (0, 0, 1.94), mats["dock_rubber"], seal, 0.025)
            mark_operational_prop(seal, "dock-seal", "loading", anchor_name)

        for index, px in enumerate((-2.10, 0.0, 2.10), start=1):
            pallet = empty(
                f"OPERATION_REALISM__{yard_name}__pallet-{index:02d}",
                (anchor.location.x + px, anchor.location.y + 0.55, 0), root,
            )
            base = box(f"{pallet.name}__base", (0.66, 0.48, 0.10), (0, 0, 0.06), mats["street_timber"], pallet, 0.012)
            box(f"{pallet.name}__load", (0.58, 0.42, 0.44), (0, 0, 0.33), mats["interior_worktop"], pallet, 0.025)
            mark_operational_prop(pallet, "pallet-staging", "loading", anchor_name, {base.name})

        for index, px in enumerate((-1.20, 1.20), start=1):
            cage = create_loading_cage(
                f"OPERATION_REALISM__{yard_name}__loading-cage-{index:02d}",
                (anchor.location.x + px, anchor.location.y + 1.12, 0), mats, root,
            )
            mark_operational_prop(cage, "loading-cage", "loading", anchor_name)
        for index, px in enumerate((-3.25, -2.55, 2.55, 3.25), start=1):
            cone = create_safety_cone(
                f"OPERATION_REALISM__{yard_name}__safety-cone-{index:02d}",
                (anchor.location.x + px, anchor.location.y + 1.22, 0), mats, root,
            )
            mark_operational_prop(cone, "safety-cone", "loading", anchor_name)
        for index, px in enumerate((-3.25, 3.25), start=1):
            create_operational_sign(
                f"OPERATION_REALISM__{yard_name}__service-sign-{index:02d}",
                (anchor.location.x + px, anchor.location.y + 0.34, 0),
                "service-signage", "loading", anchor_name, mats, root,
            )

    # Process-yard instruments reinforce function at human eye level.
    process_anchor = anchors["process"]
    process_name = process_anchor.name
    for index, (px, py) in enumerate(((-3.0, -2.6), (-1.8, -2.6), (-.6, -2.6), (.6, -2.6), (1.8, -2.6), (3.0, -2.6)), start=1):
        station = empty(f"OPERATION_REALISM__process__valve-station-{index:02d}", (process_anchor.location.x + px, process_anchor.location.y + py, 0), root)
        cylinder(f"{station.name}__stem", .055, .82, (0, 0, .48), mats["pipe_accent"], station, vertices=12)
        wheel = cylinder(f"{station.name}__wheel", .18, .055, (0, 0, .80), mats["safety_yellow"], station, rotation=(math.pi / 2, 0, 0), vertices=16)
        mark_operational_prop(station, "process-valve", "process", process_name)
        wheel["equipmentState"] = "field-operable"
    for index, (px, py) in enumerate(((-2.8, 2.85), (-1.7, 2.85), (-.6, 2.85), (.6, 2.85), (1.7, 2.85), (2.8, 2.85)), start=1):
        instrument = empty(f"OPERATION_REALISM__process__instrument-{index:02d}", (process_anchor.location.x + px, process_anchor.location.y + py, 0), root)
        base = box(f"{instrument.name}__base", (.18, .18, .10), (0, 0, .06), mats["concrete"], instrument, .018)
        box(f"{instrument.name}__post", (.055, .055, 1.05), (0, 0, .58), mats["street_metal"], instrument, .008)
        box(f"{instrument.name}__display", (.32, .12, .24), (0, 0, 1.08), mats["task_light_cool"], instrument, .025)
        mark_operational_prop(instrument, "process-instrument", "process", process_name, {base.name})
    for index, (py, pz) in enumerate(((-3.05, 1.76), (-3.05, 2.15), (3.05, 1.76), (3.05, 2.15)), start=1):
        tray = box(
            f"OPERATION_REALISM__process__cable-tray-{index:02d}",
            (5.8, .18, .12),
            (process_anchor.location.x, process_anchor.location.y + py, pz),
            mats["gutter"], root, .015,
        )
        mark_operational_prop(tray, "cable-tray", "process", process_name)
    label_specs = (
        (-2.8, -1.0, 2.02), (-1.9, -1.0, 2.02), (-1.0, -1.0, 2.02), (-.1, -1.0, 2.02),
        (.8, .85, 2.16), (1.7, .85, 2.16), (2.6, .85, 2.16), (2.8, .85, 2.16),
    )
    for index, (px, py, pz) in enumerate(label_specs, start=1):
        label = box(
            f"OPERATION_REALISM__process__pipe-label-{index:02d}",
            (.34, .08, .14),
            (process_anchor.location.x + px, process_anchor.location.y + py, pz),
            mats["wayfinding_amber"], root, .01,
        )
        mark_operational_prop(label, "pipe-label", "process", process_name)

    # Administration arrival: restrained premium furniture, planters and identity signs.
    admin_anchor = anchors["administration-entry"]
    admin_name = admin_anchor.name
    for index, px in enumerate((-2.45, 2.45), start=1):
        bench = create_street_bench(
            f"OPERATION_REALISM__admin__arrival-bench-{index:02d}",
            (admin_anchor.location.x + px, admin_anchor.location.y, 0),
            0 if index == 1 else math.pi, mats, root,
        )
        mark_operational_prop(bench, "arrival-furniture", "administration-entry", admin_name)
    for index, (px, py) in enumerate(((-3.35, -.35), (-1.15, .48), (1.15, .48), (3.35, -.35)), start=1):
        planter = empty(f"OPERATION_REALISM__admin__planter-{index:02d}", (admin_anchor.location.x + px, admin_anchor.location.y + py, 0), root)
        base = cylinder(f"{planter.name}__base", .34, .42, (0, 0, .22), mats["architectural_bronze"], planter, vertices=16)
        crown = cylinder(f"{planter.name}__plant", .26, .38, (0, 0, .54), mats["understory_deep"], planter, vertices=12)
        crown.scale = (1.0, .86, 1.0)
        mark_operational_prop(planter, "arrival-planter", "administration-entry", admin_name, {base.name})
    for index, px in enumerate((-3.75, 3.75), start=1):
        create_operational_sign(
            f"OPERATION_REALISM__admin__arrival-sign-{index:02d}",
            (admin_anchor.location.x + px, admin_anchor.location.y - 1.05, 0),
            "arrival-signage", "administration-entry", admin_name, mats, root,
        )

    task_specs = (
        ("front-loading-check", (-7.90, 18.30, .12), "x", 1.45, .046, .08, .16, "loading-inspection", "loading"),
        ("east-loading-check", (-22.80, 8.05, .12), "x", 1.55, .048, .30, .15, "dispatch-check", "loading"),
        ("process-valve-check", (-34.25, -14.65, .12), "x", 1.55, .040, .52, .19, "process-inspection", "process"),
        ("process-meter-round", (-29.70, -15.00, .12), "z", 1.35, .042, .72, .18, "instrument-round", "process"),
        ("gate-access-check", (34.10, 27.65, .12), "x", 1.20, .045, .18, .14, "access-verification", "gate"),
        ("admin-arrival-host", (10.50, 21.45, .12), "x", 1.70, .043, .62, .20, "visitor-host", "administration-entry"),
    )
    for index, spec in enumerate(task_specs, start=1):
        create_task_operator(index, *spec, mats, root)
    return root


def create_editor_camera_and_lights():
    camera_data = bpy.data.cameras.new("ReferenceObliqueCamera")
    camera = bpy.data.objects.new("ReferenceObliqueCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = (-52 * PLAN_SCALE, 54 * PLAN_SCALE, 52)
    direction = Vector((0, 0.5, 1.4)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera_data.lens = 58
    bpy.context.scene.camera = camera

    sun_data = bpy.data.lights.new("GrayboxSun", "SUN")
    sun_data.energy = 2.1
    sun_data.angle = math.radians(7.5)
    sun = bpy.data.objects.new("GrayboxSun", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(28), math.radians(-18), math.radians(-138))

    area_data = bpy.data.lights.new("GrayboxFill", "AREA")
    area_data.energy = 900
    area_data.shape = "DISK"
    area_data.size = 24
    area = bpy.data.objects.new("GrayboxFill", area_data)
    bpy.context.scene.collection.objects.link(area)
    area.location = (-14, 12, 28)
    area.rotation_euler = (0, 0, 0)


def main() -> None:
    args = parse_args()
    reset_scene()
    mats = {
        "wall": material("MAT__wall", (0.42, 0.46, 0.47, 1), 0.72, coat_weight=0.035),
        "admin_wall": material("MAT__admin-stone", (0.90, 0.87, 0.80, 1), 0.78),
        "admin_stone_light": material("MAT__limestone-light", (0.94, 0.91, 0.85, 1), 0.78, coat_weight=0.035),
        "admin_stone_dark": material("MAT__limestone-shadow", (0.86, 0.83, 0.78, 1), 0.80),
        "factory_wall": material("MAT__factory-wall", (0.87, 0.89, 0.90, 1), 0.65, 0.05, coat_weight=0.035),
        "factory_panel_light": material("MAT__factory-panel-light", (0.92, 0.93, 0.93, 1), 0.65, 0.05, coat_weight=0.045),
        "factory_panel_mid": material("MAT__factory-panel-mid", (0.82, 0.85, 0.86, 1), 0.68, 0.05, coat_weight=0.025),
        "warehouse_wall": material("MAT__warehouse-wall", (0.89, 0.87, 0.82, 1), 0.72, 0.03, coat_weight=0.025),
        "warehouse_panel_light": material("MAT__warehouse-panel-light", (0.93, 0.91, 0.86, 1), 0.72, 0.03, coat_weight=0.025),
        "warehouse_panel_mid": material("MAT__warehouse-panel-mid", (0.85, 0.84, 0.80, 1), 0.74, 0.03),
        "process_wall": material("MAT__process-wall", (0.85, 0.88, 0.90, 1), 0.66, 0.05, coat_weight=0.04),
        "process_panel_light": material("MAT__process-panel-light", (0.90, 0.92, 0.93, 1), 0.65, 0.05, coat_weight=0.05),
        "process_panel_mid": material("MAT__process-panel-mid", (0.81, 0.85, 0.87, 1), 0.68, 0.05, coat_weight=0.03),
        "utility_wall": material("MAT__utility-wall", (0.82, 0.85, 0.87, 1), 0.68, 0.06, coat_weight=0.03),
        "utility_panel_light": material("MAT__utility-panel-light", (0.88, 0.91, 0.93, 1), 0.66, 0.06, coat_weight=0.045),
        "utility_panel_mid": material("MAT__utility-panel-mid", (0.80, 0.83, 0.85, 1), 0.70, 0.06),
        "laboratory_wall": material("MAT__laboratory-wall", (0.89, 0.91, 0.88, 1), 0.68, 0.03, coat_weight=0.05),
        "laboratory_panel_light": material("MAT__laboratory-panel-light", (0.93, 0.94, 0.90, 1), 0.66, 0.03, coat_weight=0.06),
        "laboratory_panel_mid": material("MAT__laboratory-panel-mid", (0.84, 0.87, 0.84, 1), 0.70, 0.03, coat_weight=0.035),
        "architectural_bronze": material("MAT__architectural-bronze", (0.30, 0.20, 0.105, 1), 0.34, 0.72, coat_weight=0.16),
        "admin_glass": material("MAT__admin-glass", (0.022, 0.085, 0.11, 0.46), 0.12, 0.06, transmission=0.52, ior=1.48, coat_weight=0.44),
        "lobby_glow": material(
            "MAT__lobby-glow",
            (0.66, 0.39, 0.16, 1),
            0.32,
            0.05,
            coat_weight=0.12,
            emission_color=(1.0, 0.48, 0.16, 1),
            emission_strength=0.72,
        ),
        "entry_light_warm": material(
            "MAT__entry-light-warm",
            (0.86, 0.57, 0.25, 1),
            0.24,
            0.06,
            coat_weight=0.22,
            emission_color=(1.0, 0.54, 0.22, 1),
            emission_strength=0.38,
        ),
        "task_light_cool": material(
            "MAT__task-light-cool",
            (0.48, 0.74, 0.84, 1),
            0.20,
            0.08,
            coat_weight=0.26,
            emission_color=(0.46, 0.82, 1.0, 1),
            emission_strength=0.32,
        ),
        "wayfinding_amber": material(
            "MAT__wayfinding-amber",
            (0.82, 0.38, 0.055, 1),
            0.30,
            0.12,
            coat_weight=0.18,
            emission_color=(1.0, 0.34, 0.055, 1),
            emission_strength=0.26,
        ),
        "wall_secondary": material("MAT__wall-secondary", (0.72, 0.75, 0.76, 1), 0.76, coat_weight=0.03),
        "wall_panel_light": material("MAT__wall-panel-light", (0.50, 0.54, 0.55, 1), 0.76, 0.10, coat_weight=0.04),
        "wall_panel_mid": material("MAT__wall-panel-mid", (0.34, 0.39, 0.41, 1), 0.79, 0.12, coat_weight=0.025),
        "facade_shadow_joint": material("MAT__facade-shadow-joint", (0.09, 0.115, 0.125, 1), 0.76, 0.24),
        "wall_batten": material("MAT__wall-pressed-batten", (0.24, 0.29, 0.30, 1), 0.58, 0.46, coat_weight=0.07),
        "corner_flashing": material("MAT__corner-flashing", (0.88, 0.89, 0.90, 1), 0.62, 0.10, coat_weight=0.10),
        "wall_rib": material("MAT__wall-rib", (0.15, 0.19, 0.21, 1), 0.46, 0.52, coat_weight=0.10),
        "facade_weathering": material("MAT__facade-weathering", (0.085, 0.10, 0.10, 0.38), 0.94),
        "facade_weathering_light": material("MAT__facade-weathering-light", (0.20, 0.20, 0.18, 0.20), 0.91),
        "roof_patina": material("MAT__roof-patina", (0.22, 0.255, 0.25, 0.48), 0.87, 0.10),
        "safety_orange": material("MAT__safety-orange", (0.92, 0.28, 0.035, 1), 0.46, 0.18, coat_weight=0.18),
        "luminaire": material("MAT__luminaire", (0.78, 0.88, 0.86, 1), 0.22, 0.08, coat_weight=0.34),
        "facade_frame": material("MAT__facade-frame", (0.12, 0.16, 0.18, 1), 0.38, 0.68, coat_weight=0.14),
        "dock_rubber": material("MAT__dock-rubber", (0.022, 0.026, 0.028, 1), 0.92),
        "roof": material("MAT__roof", (0.90, 0.91, 0.92, 1), 0.62, 0.10, coat_weight=0.12),
        "roof_rib": material("MAT__roof-rib", (0.86, 0.88, 0.89, 1), 0.62, 0.10),
        "accent": material("MAT__blue-accent", (0.035, 0.22, 0.38, 1), 0.38, 0.24, coat_weight=0.22),
        "glass": material("MAT__glass", (0.018, 0.075, 0.12, 1), 0.18, 0.08, transmission=0.30, ior=1.46, coat_weight=0.34),
        "vent": material("MAT__vent", (0.21, 0.25, 0.28, 1), 0.40, 0.72),
        "skylight": material("MAT__skylight", (0.12, 0.25, 0.34, 1), 0.22, 0.12, transmission=0.16, coat_weight=0.25),
        "asphalt": material("MAT__asphalt", (0.075, 0.085, 0.092, 1), 0.93),
        "aged_asphalt": material("MAT__aged-asphalt", (0.105, 0.105, 0.098, 1), 0.95),
        "asphalt_repair": material("MAT__asphalt-repair-warm", (0.096, 0.088, 0.078, 1), 0.90),
        "traffic_wear": material("MAT__traffic-wear-cool", (0.047, 0.053, 0.057, 1), 0.88),
        "utility_iron": material("MAT__utility-iron", (0.075, 0.082, 0.082, 1), 0.64, 0.58),
        "paving_joint": material("MAT__paving-joint", (0.22, 0.23, 0.22, 1), 0.86),
        "warm_aggregate": material("MAT__warm-aggregate", (0.39, 0.34, 0.27, 1), 0.94),
        "planting_mulch": material("MAT__planting-mulch", (0.115, 0.068, 0.038, 1), 0.97),
        "street_timber": material("MAT__street-timber", (0.30, 0.18, 0.085, 1), 0.82, 0.02),
        "street_metal": material("MAT__street-metal", (0.075, 0.105, 0.11, 1), 0.52, 0.70),
        "bin_blue": material("MAT__recycling-blue", (0.035, 0.27, 0.40, 1), 0.62, 0.20),
        "stripe": material("MAT__road-marking", (0.78, 0.80, 0.76, 1), 0.78),
        "safety_yellow": material("MAT__safety-yellow", (0.86, 0.60, 0.035, 1), 0.68, 0.04, coat_weight=0.05),
        "fire_red": material("MAT__fire-service-red", (0.66, 0.035, 0.025, 1), 0.52, 0.08, coat_weight=0.12),
        "tactile": material("MAT__tactile-paving", (0.72, 0.53, 0.08, 1), 0.84),
        "lawn": material("MAT__lawn", (0.08, 0.20, 0.10, 1), 0.95),
        "court": material("MAT__court", (0.48, 0.16, 0.12, 1), 0.84),
        "tennis_court": material("MAT__tennis-court", (0.055, 0.30, 0.24, 1), 0.86),
        "court_fence": material("MAT__sports-fence", (0.055, 0.13, 0.105, 0.14), 0.70, 0.42),
        "court_wire": material("MAT__sports-wire", (0.035, 0.095, 0.075, 1), 0.54, 0.72),
        "concrete": material("MAT__concrete", (0.54, 0.56, 0.55, 1), 0.86),
        "loading_concrete": material("MAT__loading-concrete", (0.46, 0.47, 0.45, 1), 0.90),
        "parking_surface": material("MAT__parking-surface", (0.105, 0.115, 0.118, 1), 0.92),
        "walkway": material("MAT__walkway", (0.60, 0.61, 0.58, 1), 0.88),
        "plinth": material("MAT__wall-plinth", (0.70, 0.72, 0.72, 1), 0.84),
        "panel_joint": material("MAT__panel-joint", (0.24, 0.27, 0.28, 1), 0.62, 0.18),
        "gutter": material("MAT__galvanized-gutter", (0.82, 0.84, 0.86, 1), 0.62, 0.10),
        "curb": material("MAT__curb", (0.78, 0.79, 0.76, 1), 0.88),
        "drain": material("MAT__storm-drain", (0.12, 0.14, 0.15, 1), 0.56, 0.72),
        "pipe": material("MAT__pipe-structure", (0.25, 0.33, 0.35, 1), 0.40, 0.62),
        "pipe_accent": material("MAT__pipe-runs", (0.08, 0.38, 0.45, 1), 0.32, 0.68, coat_weight=0.10),
        "pipe_band": material("MAT__pipe-identification", (0.86, 0.62, 0.06, 1), 0.40, 0.35),
        "floor_slab": material("MAT__floor-slab", (0.28, 0.34, 0.36, 1), 0.66, 0.22),
        "floor_space_cyan": material("MAT__floor-space-cyan", (0.035, 0.32, 0.42, 0.38), 0.30, 0.12, transmission=0.18, coat_weight=0.12),
        "floor_space_orange": material("MAT__floor-space-orange", (0.62, 0.20, 0.06, 0.38), 0.34, 0.10, transmission=0.12, coat_weight=0.10),
        "floor_core": material("MAT__floor-service-core", (0.72, 0.76, 0.73, 1), 0.72),
        "interior_equipment": material("MAT__interior-equipment", (0.19, 0.27, 0.29, 1), 0.48, 0.54, coat_weight=0.08),
        "interior_worktop": material("MAT__interior-worktop", (0.42, 0.49, 0.50, 1), 0.58, 0.28),
        "interior_storage": material("MAT__interior-storage", (0.18, 0.34, 0.38, 1), 0.52, 0.38),
        "workwear": material("MAT__workwear", (0.025, 0.12, 0.21, 1), 0.66),
        "safety_vest": material("MAT__safety-vest", (0.94, 0.34, 0.035, 1), 0.50, coat_weight=0.08),
        "hardhat": material("MAT__hardhat", (0.92, 0.70, 0.08, 1), 0.42, coat_weight=0.12),
        "skin": material("MAT__skin", (0.58, 0.36, 0.25, 1), 0.72),
        "trunk": material("MAT__trunk", (0.16, 0.10, 0.055, 1), 0.95),
        "foliage": material("MAT__foliage", (0.055, 0.23, 0.10, 1), 0.90),
        "foliage_light": material("MAT__foliage-light", (0.095, 0.30, 0.12, 1), 0.91),
        "foliage_sunlit": material("MAT__foliage-sunlit", (0.155, 0.335, 0.105, 1), 0.90),
        "foliage_warm": material("MAT__foliage-warm", (0.16, 0.245, 0.075, 1), 0.92),
        "understory_deep": material("MAT__understory-deep", (0.025, 0.135, 0.055, 1), 0.94),
        "understory_warm": material("MAT__understory-warm", (0.20, 0.29, 0.07, 1), 0.93),
        "fence": material("MAT__fence", (0.66, 0.69, 0.68, 1), 0.60, 0.4),
        "sidewalk": material("MAT__sidewalk", (0.74, 0.76, 0.75, 1), 0.88),
        "paving": material("MAT__entry-paving", (0.58, 0.55, 0.49, 1), 0.82),
        "white": material("MAT__paint-white", (0.90, 0.92, 0.91, 1), 0.62),
        "solar": material("MAT__solar-panel", (0.025, 0.11, 0.19, 1), 0.28, 0.48),
        "tire": material("MAT__tire", (0.018, 0.020, 0.022, 1), 0.88),
        "vehicle": material("MAT__vehicle-silver", (0.38, 0.43, 0.45, 1), 0.35, 0.52),
        "vehicle_blue": material("MAT__vehicle-blue", (0.025, 0.20, 0.35, 1), 0.32, 0.42),
        "bus": material("MAT__bus", (0.78, 0.82, 0.80, 1), 0.46, 0.18),
        "flower": material("MAT__flower-bed", (0.26, 0.06, 0.10, 1), 0.92),
        "flower_blossom": material("MAT__flower-blossom", (0.74, 0.10, 0.27, 1), 0.82),
        "bioswale_soil": material("MAT__bioswale-soil", (0.105, 0.075, 0.045, 1), 0.96),
        "ornamental_grass": material("MAT__ornamental-grass", (0.18, 0.34, 0.12, 1), 0.94),
        "shrub_deep": material("MAT__shrub-deep", (0.035, 0.16, 0.075, 1), 0.92),
        "tree_grate": material("MAT__tree-grate", (0.15, 0.18, 0.17, 1), 0.58, 0.52),
        "forest_ground": material("MAT__forest-ground", (0.10, 0.25, 0.11, 1), 0.96),
        "forest_foliage": material("MAT__forest-foliage", (0.075, 0.30, 0.12, 1), 0.92),
        "forest_foliage_light": material("MAT__forest-foliage-light", (0.11, 0.36, 0.15, 1), 0.91),
        "ground_tire_wear": material("MAT__ground-tire-wear", (0.14, 0.15, 0.15, 0.24), 0.90),
        "ground_joint": material("MAT__ground-concrete-joint", (0.18, 0.19, 0.19, 0.30), 0.91),
        "ground_repair": material("MAT__ground-asphalt-repair", (0.16, 0.15, 0.14, 0.28), 0.92),
        "ground_drain_stain": material("MAT__ground-drain-discoloration", (0.12, 0.15, 0.13, 0.22), 0.94),
        "ground_dock_abrasion": material("MAT__ground-dock-abrasion", (0.20, 0.17, 0.14, 0.24), 0.90),
        "ground_wall_dust": material("MAT__ground-wall-dust", (0.32, 0.30, 0.26, 0.20), 0.93),
        "ground_oil_mark": material("MAT__ground-oil-mark", (0.11, 0.12, 0.11, 0.26), 0.88),
        "ground_contact_transition": material("MAT__ground-contact-transition", (0.22, 0.24, 0.20, 0.18), 0.94),
    }
    configure_ground_pbr_materials(mats)
    configure_vegetation_pbr_materials(mats)
    configure_architectural_pbr_materials(mats)

    campus = empty("FactoryCampusGraybox")
    campus["assetSource"] = "Blender 5.2 procedural graybox"
    campus["reference"] = "bgtp.jpg"
    campus["accuracy"] = "single-view visual approximation; not CAD/BIM"
    create_roads_and_site(mats, campus)
    for record in BUILDINGS:
        create_building(record, mats, campus)
    rebuild_building_identities(mats, campus)
    create_pipe_racks(mats, campus)
    create_industrial_process_core(mats, campus)
    create_warehouse_logistics(mats, campus)
    create_landscape(mats, campus)
    create_site_furnishings(mats, campus)
    create_environment(mats, campus)
    create_industrial_finish_details(mats, campus)
    expand_campus_plan(campus)
    create_building_access_network(mats, campus)
    create_operational_traffic(mats, campus)
    create_ground_road_landscape_art(mats, campus)
    configure_ground_function_zones(mats, campus)
    create_ground_contact_realism(mats, campus)
    create_ground_circulation_realism(mats, campus)
    create_vegetation_ecology(mats, campus)
    create_vegetation_transition_realism(mats, campus)
    create_site_composition(mats, campus)
    create_campus_operational_story(mats, campus)
    create_factory_operational_realism(mats, campus)
    create_factory_energy_networks(campus)
    configure_ground_uv_tiling()
    configure_architectural_uv_tiling()
    asset_summary = optimize_asset_reuse_and_visibility(campus)
    create_editor_camera_and_lights()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.world.color = (0.62, 0.70, 0.74)
    scene.world.use_nodes = True
    background = next(node for node in scene.world.node_tree.nodes if node.type == "BACKGROUND")
    background.inputs["Color"].default_value = (0.72, 0.80, 0.84, 1)
    background.inputs["Strength"].default_value = 0.66
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene["grayboxBuildingCount"] = len(BUILDINGS)

    blend_output = os.path.abspath(args.blend_output)
    glb_output = os.path.abspath(args.glb_output)
    os.makedirs(os.path.dirname(blend_output), exist_ok=True)
    os.makedirs(os.path.dirname(glb_output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_output)
    bpy.ops.export_scene.gltf(
        filepath=glb_output,
        export_format="GLB",
        export_yup=True,
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
    print(
        f"GRAYBOX_EXPORT blend={blend_output} glb={glb_output} buildings={len(BUILDINGS)} "
        f"reuse={asset_summary['instances']} groups={asset_summary['groups']} "
        f"visibility={asset_summary['near']}/{asset_summary['mid']}"
    )


if __name__ == "__main__":
    main()

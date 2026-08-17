"""Generate the editable factory-campus graybox and its web GLB export."""

from __future__ import annotations

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


BUILDINGS = [
    ("main-production-hall", (10.0, 0.5), (15.0, 6.2, 3.4), "factory"),
    ("central-processing-hall", (-2.5, -5.9), (11.5, 4.5, 3.1), "factory"),
    ("rear-high-bay", (0.0, -13.0), (9.5, 4.0, 4.3), "factory"),
    ("north-east-workshop", (-11.5, -12.5), (5.2, 3.0, 2.8), "factory"),
    ("east-process-hall", (-14.0, -5.0), (6.0, 3.6, 3.0), "factory"),
    ("far-east-utility", (-22.0, 3.2), (3.2, 2.4, 2.1), "factory"),
    ("east-warehouse", (-14.0, 2.2), (7.0, 4.0, 2.7), "factory"),
    ("front-warehouse", (-3.0, 10.0), (7.2, 3.0, 2.9), "factory"),
    ("front-utility-annex", (-12.0, 10.5), (3.0, 2.0, 1.8), "factory"),
    ("laboratory", (-19.0, 10.5), (3.2, 1.8, 1.9), "office"),
    ("administration", (9.5, 11.3), (5.0, 3.5, 3.8), "administration"),
    ("gatehouse", (23.2, 14.7), (2.0, 1.5, 1.4), "office"),
]

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


def material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    transmission: float = 0.0,
    ior: float = 1.45,
    coat_weight: float = 0.0,
):
    value = bpy.data.materials.new(name)
    value.diffuse_color = color
    value.use_nodes = True
    shader = next(node for node in value.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = color
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
    return value


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
        modifier.segments = 2
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
        box(
            f"FLOOR_MESH__{building_id}__{floor_id}__slab",
            (width * 0.90, depth * 0.84, 0.10),
            (0, 0, floor_base + 0.10),
            mats["floor_slab"],
            floor_root,
            0.018,
        )
        box(
            f"FLOOR_MESH__{building_id}__{floor_id}__space",
            (width * 0.82, depth * 0.72, max(0.28, floor_height * 0.62)),
            (0, 0, floor_base + floor_height * 0.46),
            mats["floor_space_orange"] if tone == "orange" else mats["floor_space_cyan"],
            floor_root,
            0.035,
        )
        box(
            f"FLOOR_MESH__{building_id}__{floor_id}__core",
            (max(0.22, width * 0.10), max(0.22, depth * 0.16), max(0.30, floor_height * 0.66)),
            (-width * 0.31, -depth * 0.22, floor_base + floor_height * 0.48),
            mats["floor_core"],
            floor_root,
            0.025,
        )
    return floors


def create_building(record, mats, campus):
    building_id, (x, y), (width, depth, height), kind = record
    root = empty(f"BLDG__{building_id}", (x, y, 0), campus)
    root["buildingId"] = building_id
    root["interactive"] = True
    root["source"] = "bgtp-single-view-graybox"

    wall = mats["admin_wall"] if kind == "administration" else mats["wall"]
    box(f"{building_id}__wall-shell", (width, depth, height), (0, 0, height / 2), wall, root, 0.07)
    box(f"{building_id}__roof", (width + 0.12, depth + 0.12, 0.22), (0, 0, height + 0.11), mats["roof"], root, 0.025)
    box(f"{building_id}__blue-trim", (width + 0.08, 0.10, 0.13), (0, depth / 2 + 0.03, height - 0.18), mats["accent"], root, 0.01)

    bay_count = max(2, min(8, round(width / 1.35)))
    for index in range(bay_count):
        px = -width * 0.42 + index * (width * 0.84 / max(1, bay_count - 1))
        window_height = 1.1 if kind == "administration" else 0.28
        window_z = height * 0.56 if kind == "administration" else height * 0.62
        box(
            f"{building_id}__window-{index + 1:02d}",
            (0.52, 0.07, window_height),
            (px, depth / 2 + 0.055, window_z),
            mats["glass"],
            root,
            0.01,
        )

    door_count = 3 if width > 7 else 2
    for index in range(door_count):
        px = (index - (door_count - 1) / 2) * min(1.5, width / 3.4)
        box(
            f"{building_id}__door-{index + 1:02d}",
            (0.72, 0.08, min(1.15, height * 0.46)),
            (px, depth / 2 + 0.06, min(0.58, height * 0.23)),
            mats["accent"],
            root,
            0.015,
        )

    if kind == "administration":
        for index in range(4):
            px = -1.35 + index * 0.9
            box(
                f"ADMIN__glass-bay-{index + 1:02d}",
                (0.68, 0.10, 2.35),
                (px, depth / 2 + 0.075, 1.68),
                mats["glass"],
                root,
                0.015,
            )
        for index in range(6):
            px = -width * 0.45 + index * width * 0.18
            box(f"{building_id}__facade-pier-{index + 1:02d}", (0.17, 0.24, height * 0.9), (px, depth / 2 + 0.15, height * 0.48), mats["admin_wall"], root, 0.018)
        box(f"{building_id}__entrance-canopy", (1.25, 0.62, 0.12), (0, depth / 2 + 0.34, 0.92), mats["concrete"], root, 0.025)
    else:
        vent_count = max(2, min(7, round(width / 1.8)))
        for index in range(vent_count):
            px = -width * 0.38 + index * width * 0.76 / max(1, vent_count - 1)
            cylinder(f"{building_id}__roof-vent-{index + 1:02d}", 0.11, 0.25, (px, 0, height + 0.34), mats["vent"], root, vertices=10)

        if width > 6:
            for index in range(4):
                px = -width * 0.3 + index * width * 0.2
                box(f"{building_id}__skylight-{index + 1:02d}", (0.62, 0.38, 0.10), (px, 0.45, height + 0.27), mats["skylight"], root, 0.015)
    create_floor_spaces(building_id, width, depth, height, mats, root)
    return root


def create_roads_and_site(mats, campus):
    site = empty("SITE__ground-and-roads", parent=campus)
    box("SITE__ground", (58, 42, 0.45), (0, 0, -0.225), mats["lawn"], site, 0.08)
    box("SITE__outer-boulevard", (64, 3.4, 0.10), (0, 23.0, 0.04), mats["asphalt"], site, 0.02)
    box("SITE__front-sidewalk", (58, 0.72, 0.12), (0, 18.15, 0.08), mats["sidewalk"], site, 0.02)
    box("SITE__entry-plaza", (7.0, 3.3, 0.10), (20.5, 17.0, 0.10), mats["paving"], site, 0.025)

    perimeter_roads = [
        ("ROAD__perimeter-front", (56.4, 2.5, 0.08), (0, 20.0, 0.04)),
        ("ROAD__perimeter-rear", (56.4, 2.5, 0.08), (0, -20.0, 0.04)),
        ("ROAD__perimeter-west", (2.5, 37.5, 0.08), (-27.0, 0, 0.04)),
        ("ROAD__perimeter-east", (2.5, 37.5, 0.08), (27.0, 0, 0.04)),
    ]
    for name, size, location in perimeter_roads:
        box(name, size, location, mats["asphalt"], site, 0.025)

    for index, (x, y, width, depth) in enumerate([
        (0, 17.1, 53.0, 1.8),
        (20.5, 12.0, 3.0, 17.5),
        (0.0, 6.4, 50.0, 1.8),
        (0.0, -9.4, 50.0, 1.7),
        (-8.5, -1.5, 1.7, 29.8),
        (5.1, -3.0, 1.7, 13.0),
        (-18.8, 2.2, 1.7, 29.0),
    ]):
        box(f"ROAD__segment-{index + 1:02d}", (width, depth, 0.08), (x, y, 0.04), mats["asphalt"], site, 0.02)

    for road_y, prefix in ((20.0, "front"), (-20.0, "rear"), (6.4, "inner")):
        for index, x in enumerate(range(-25, 26, 2)):
            box(f"ROAD__{prefix}-dash-{index + 1:02d}", (0.88, 0.07, 0.025), (x, road_y, 0.105), mats["stripe"], site, 0)
    for road_x, prefix in ((-27.0, "west"), (27.0, "east"), (20.5, "entry")):
        for index, y in enumerate(range(-17, 18, 2)):
            box(f"ROAD__{prefix}-dash-{index + 1:02d}", (0.07, 0.88, 0.025), (road_x, y, 0.105), mats["stripe"], site, 0)
    for index, x in enumerate(range(-30, 31, 2)):
        box(f"ROAD__boulevard-dash-{index + 1:02d}", (0.92, 0.07, 0.025), (x, 23.0, 0.105), mats["stripe"], site, 0)
    for edge in (21.45, 24.55):
        box(f"ROAD__boulevard-edge-{edge}", (64, 0.055, 0.025), (0, edge, 0.105), mats["stripe"], site, 0)
    for crossing, cx in enumerate((20.5, 0.0, -18.8)):
        for stripe in range(7):
            box(f"ROAD__crossing-{crossing + 1}-{stripe + 1}", (0.14, 0.92, 0.025), (cx - 0.48 + stripe * 0.16, 18.25, 0.10), mats["stripe"], site, 0)

    court = empty("SITE__basketball-court", (2.5, 15.1, 0), site)
    box("COURT__surface", (4.8, 2.7, 0.07), (0, 0, 0.07), mats["court"], court, 0.05)
    for idx, (sx, sy, px, py) in enumerate([
        (4.0, 0.045, 0, 0), (0.045, 2.25, 0, 0), (0.045, 2.25, 0, 0),
        (0.045, 2.25, -2.0, 0), (0.045, 2.25, 2.0, 0),
    ]):
        box(f"COURT__line-{idx + 1}", (sx, sy, 0.025), (px, py, 0.12), mats["stripe"], court, 0)
    for side_index, px in enumerate((-1.62, 1.62)):
        side_name = "left" if side_index == 0 else "right"
        cylinder(f"COURT__hoop-{side_name}", 0.055, 1.45, (px, 0, 0.82), mats["white"], court, vertices=10)
        box(f"COURT__backboard-{side_name}", (0.08, 0.82, 0.52), (px, 0, 1.47), mats["white"], court, 0.015)
        cylinder(
            f"COURT__rim-{side_name}",
            0.14,
            0.035,
            (px - 0.12 if side_index == 0 else px + 0.12, 0, 1.34),
            mats["court"],
            court,
            rotation=(0, math.pi / 2, 0),
            vertices=16,
        )

    parking = empty("SITE__parking-canopy", (16.7, 10.5, 0), site)
    box("PARKING__surface", (8.8, 5.4, 0.08), (0, 0, 0.06), mats["asphalt"], parking, 0.02)
    box("PARKING__canopy-roof", (7.8, 2.15, 0.12), (0, -1.35, 1.50), mats["roof"], parking, 0.025)
    for index in range(10):
        px = -3.0 + (index % 5) * 1.5
        py = -1.70 + (index // 5) * 0.82
        box(
            f"PARKING__solar-panel-{index + 1:02d}",
            (1.30, 0.72, 0.055),
            (px, py, 1.44),
            mats["solar"],
            parking,
            0.012,
            rotation=(math.radians(4), 0, 0),
        )
    for index, px in enumerate((-3.1, -1.55, 0, 1.55, 3.1)):
        box(f"PARKING__post-{index}", (0.09, 0.09, 1.45), (px, -1.35, 0.73), mats["pipe"], parking, 0.01)
    for row, py in enumerate((-1.35, 1.35)):
        for line_index, px in enumerate((-3.75, -2.25, -.75, .75, 2.25, 3.75)):
            box(f"PARKING__bay-line-{row + 1:02d}-{line_index + 1:02d}", (0.045, 2.25, 0.02), (px, py, 0.11), mats["stripe"], parking, 0)
    box("PARKING__center-aisle", (7.8, 0.055, 0.02), (0, 0, 0.11), mats["stripe"], parking, 0)

    gate = empty("SITE__vehicle-gate", (20.5, 17.0, 0), site)
    for side, px in (("west", -1.65), ("east", 1.65)):
        box(f"GATE__post-{side}", (0.18, 0.18, 2.25), (px, 0, 1.12), mats["pipe"], gate, 0.025)
    box("GATE__canopy", (3.8, 1.15, 0.16), (0, 0, 2.25), mats["roof"], gate, 0.035)
    box("GATE__barrier-inbound", (1.25, 0.09, 0.09), (-.88, -.55, 1.05), mats["stripe"], gate, 0.018, rotation=(0, math.radians(-62), 0))
    box("GATE__barrier-outbound", (1.25, 0.09, 0.09), (.88, .55, .92), mats["stripe"], gate, 0.018)
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

    for index, x in enumerate((-27, -21, -15, -9, -3, 3, 9, 15, 21, 27)):
        cylinder(f"LIGHT__boulevard-pole-{index + 1:02d}", 0.045, 1.9, (x, 18.1, 1.0), mats["pipe"], group, vertices=10)
        box(f"LIGHT__boulevard-head-{index + 1:02d}", (0.42, 0.11, 0.08), (x + 0.17, 18.1, 1.93), mats["white"], group, 0.02)
    return group


def create_landscape(mats, campus):
    group = empty("SITE__landscape", parent=campus)
    positions = []
    for x in range(-25, 26, 2):
        positions.extend([(x, -17.8), (x, 18.0)])
    for y in range(-16, 18, 2):
        positions.extend([(-25.8, y), (25.8, y)])
    for index, (x, y) in enumerate(positions):
        trunk = cylinder(f"TREE__trunk-{index:02d}", 0.07, 0.55, (x, y, 0.32), mats["trunk"], group, vertices=7)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.48 + (index % 3) * 0.05, location=(0, 0, 0))
        crown = bpy.context.object
        crown.name = f"TREE__crown-{index:02d}"
        crown.parent = group
        crown.location = (x, y, 0.9 + (index % 2) * 0.08)
        crown.scale.z = 1.25
        crown.data.materials.append(mats["foliage"])
        trunk["instanceFamily"] = "tree"

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
    box("ENV__forest-backdrop", (70, 26, 0.28), (0, -32.0, -0.20), mats["forest_ground"], group, 0.10)
    tree_index = 0
    for row, y in enumerate((-22.0, -25.5, -29.0, -32.8, -36.5, -40.0)):
        spacing = 2.6 + row * 0.18
        start_x = -32.0 - (row % 2) * 1.2
        count = 25
        for column in range(count):
            x = start_x + column * spacing
            trunk = cylinder(
                f"ENV__tree-trunk-{tree_index:03d}",
                0.09,
                0.75 + (column % 3) * 0.12,
                (x, y, 0.40),
                mats["trunk"],
                group,
                vertices=7,
            )
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.72 + ((column + row) % 4) * 0.08, location=(0, 0, 0))
            crown = bpy.context.object
            crown.name = f"ENV__tree-crown-{tree_index:03d}"
            crown.parent = group
            crown.location = (x, y, 1.25 + (column % 3) * 0.10)
            crown.scale = (1.0, 1.0, 1.35)
            crown.data.materials.append(mats["forest_foliage"])
            trunk["instanceFamily"] = "background-tree"
            tree_index += 1
    return group


def create_industrial_finish_details(mats, campus):
    """Add restrained GLB-safe construction detail without changing the site layout."""
    group = empty("DETAIL__industrial-finishes", parent=campus)
    major_buildings = [record for record in BUILDINGS if record[2][0] >= 5.0]
    rib_index = 1
    plinth_index = 1
    gutter_index = 1
    downpipe_index = 1
    joint_index = 1

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

        if kind != "administration":
            joint_count = max(3, min(8, round(width / 1.6)))
            for joint in range(1, joint_count):
                px = -width / 2 + joint * width / joint_count
                box(
                    f"DETAIL__facade-joint-{joint_index:02d}",
                    (0.018, 0.018, height - 0.48),
                    (px, depth / 2 + 0.075, height / 2 + 0.12),
                    mats["panel_joint"],
                    detail_root,
                    0,
                )
                joint_index += 1

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


def create_editor_camera_and_lights():
    camera_data = bpy.data.cameras.new("ReferenceObliqueCamera")
    camera = bpy.data.objects.new("ReferenceObliqueCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = (-52, 54, 44)
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
        "wall": material("MAT__wall", (0.72, 0.75, 0.76, 1), 0.64, coat_weight=0.08),
        "admin_wall": material("MAT__admin-stone", (0.64, 0.61, 0.54, 1), 0.70),
        "roof": material("MAT__roof", (0.42, 0.47, 0.51, 1), 0.42, 0.62, coat_weight=0.12),
        "roof_rib": material("MAT__roof-rib", (0.32, 0.37, 0.40, 1), 0.38, 0.70),
        "accent": material("MAT__blue-accent", (0.035, 0.22, 0.38, 1), 0.38, 0.24, coat_weight=0.22),
        "glass": material("MAT__glass", (0.018, 0.075, 0.12, 1), 0.18, 0.08, transmission=0.30, ior=1.46, coat_weight=0.34),
        "vent": material("MAT__vent", (0.21, 0.25, 0.28, 1), 0.40, 0.72),
        "skylight": material("MAT__skylight", (0.12, 0.25, 0.34, 1), 0.22, 0.12, transmission=0.16, coat_weight=0.25),
        "asphalt": material("MAT__asphalt", (0.075, 0.085, 0.092, 1), 0.93),
        "stripe": material("MAT__road-marking", (0.78, 0.80, 0.76, 1), 0.78),
        "lawn": material("MAT__lawn", (0.08, 0.20, 0.10, 1), 0.95),
        "court": material("MAT__court", (0.48, 0.16, 0.12, 1), 0.84),
        "concrete": material("MAT__concrete", (0.54, 0.56, 0.55, 1), 0.86),
        "plinth": material("MAT__wall-plinth", (0.36, 0.38, 0.38, 1), 0.84),
        "panel_joint": material("MAT__panel-joint", (0.24, 0.27, 0.28, 1), 0.62, 0.18),
        "gutter": material("MAT__galvanized-gutter", (0.43, 0.47, 0.48, 1), 0.40, 0.72),
        "curb": material("MAT__curb", (0.62, 0.63, 0.60, 1), 0.88),
        "drain": material("MAT__storm-drain", (0.12, 0.14, 0.15, 1), 0.56, 0.72),
        "pipe": material("MAT__pipe-structure", (0.25, 0.33, 0.35, 1), 0.40, 0.62),
        "pipe_accent": material("MAT__pipe-runs", (0.08, 0.38, 0.45, 1), 0.32, 0.68, coat_weight=0.10),
        "pipe_band": material("MAT__pipe-identification", (0.86, 0.62, 0.06, 1), 0.40, 0.35),
        "floor_slab": material("MAT__floor-slab", (0.28, 0.34, 0.36, 1), 0.66, 0.22),
        "floor_space_cyan": material("MAT__floor-space-cyan", (0.035, 0.32, 0.42, 0.38), 0.30, 0.12, transmission=0.18, coat_weight=0.12),
        "floor_space_orange": material("MAT__floor-space-orange", (0.62, 0.20, 0.06, 0.38), 0.34, 0.10, transmission=0.12, coat_weight=0.10),
        "floor_core": material("MAT__floor-service-core", (0.72, 0.76, 0.73, 1), 0.72),
        "trunk": material("MAT__trunk", (0.16, 0.10, 0.055, 1), 0.95),
        "foliage": material("MAT__foliage", (0.055, 0.23, 0.10, 1), 0.90),
        "fence": material("MAT__fence", (0.66, 0.69, 0.68, 1), 0.60, 0.4),
        "sidewalk": material("MAT__sidewalk", (0.47, 0.49, 0.48, 1), 0.88),
        "paving": material("MAT__entry-paving", (0.58, 0.55, 0.49, 1), 0.82),
        "white": material("MAT__paint-white", (0.90, 0.92, 0.91, 1), 0.62),
        "solar": material("MAT__solar-panel", (0.025, 0.11, 0.19, 1), 0.28, 0.48),
        "tire": material("MAT__tire", (0.018, 0.020, 0.022, 1), 0.88),
        "vehicle": material("MAT__vehicle-silver", (0.38, 0.43, 0.45, 1), 0.35, 0.52),
        "vehicle_blue": material("MAT__vehicle-blue", (0.025, 0.20, 0.35, 1), 0.32, 0.42),
        "bus": material("MAT__bus", (0.78, 0.82, 0.80, 1), 0.46, 0.18),
        "flower": material("MAT__flower-bed", (0.26, 0.06, 0.10, 1), 0.92),
        "flower_blossom": material("MAT__flower-blossom", (0.74, 0.10, 0.27, 1), 0.82),
        "forest_ground": material("MAT__forest-ground", (0.10, 0.25, 0.11, 1), 0.96),
        "forest_foliage": material("MAT__forest-foliage", (0.08, 0.29, 0.12, 1), 0.92),
    }

    campus = empty("FactoryCampusGraybox")
    campus["assetSource"] = "Blender 5.2 procedural graybox"
    campus["reference"] = "bgtp.jpg"
    campus["accuracy"] = "single-view visual approximation; not CAD/BIM"
    create_roads_and_site(mats, campus)
    for record in BUILDINGS:
        create_building(record, mats, campus)
    create_pipe_racks(mats, campus)
    create_landscape(mats, campus)
    create_site_furnishings(mats, campus)
    create_environment(mats, campus)
    create_industrial_finish_details(mats, campus)
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
    print(f"GRAYBOX_EXPORT blend={blend_output} glb={glb_output} buildings={len(BUILDINGS)}")


if __name__ == "__main__":
    main()

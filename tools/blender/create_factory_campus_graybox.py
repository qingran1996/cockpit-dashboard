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


def mark_interior(obj, role="interior-prop"):
    obj["layerRole"] = role
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


def create_site_patrol_walker(index, location, axis, distance, speed, phase, mats, parent):
    walker_name = f"PATROL__campus-{index:02d}"
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
            mark_interior(box(f"{prefix}__meeting-table-01", (width * 0.42, depth * 0.18, 0.16), (0, 0, prop_z + 0.09), mats["interior_worktop"], interior, 0.035))
            mark_interior(box(f"{prefix}__display-wall-01", (width * 0.30, 0.08, 0.30), (0, -depth * 0.28, prop_z + 0.24), mats["interior_equipment"], interior, 0.018))
            for index, (px, py, rot) in enumerate(((-width*.22, 0, -math.pi/2), (width*.22, 0, math.pi/2), (0, depth*.18, math.pi)), start=1):
                create_chair(f"{prefix}__meeting-chair-{index:02d}", (px, py, prop_z), mats, interior, rot)
        else:
            for index, px in enumerate((-width * 0.20, width * 0.10), start=1):
                mark_interior(box(f"{prefix}__desk-{index:02d}", (width * 0.24, depth * 0.16, 0.15), (px, -depth * 0.12, prop_z + 0.09), mats["interior_worktop"], interior, 0.025))
                create_chair(f"{prefix}__desk-chair-{index:02d}", (px, depth * .04, prop_z), mats, interior, math.pi)
            mark_interior(box(f"{prefix}__partition-01", (0.06, depth * 0.42, 0.28), (width * 0.30, 0, prop_z + 0.18), mats["interior_equipment"], interior, 0.015))
            create_sofa(f"{prefix}__sofa-01", (width * .08, depth * .25, prop_z), width * .30, mats, interior)
            mark_interior(box(f"{prefix}__coffee-table-01", (width * .22, depth * .14, .10), (-width * .18, depth * .25, prop_z + .06), mats["interior_worktop"], interior, .025))
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
        mark_interior(box(f"{prefix}__packing-table-01", (width * .28, depth * .16, .18), (width * .16, 0, prop_z + .10), mats["interior_worktop"], interior, .025))
        mark_interior(box(f"{prefix}__packing-bin-01", (width * .10, depth * .14, .14), (width * .34, depth * .20, prop_z + .08), mats["interior_storage"], interior, .018))
    else:
        for index, px in enumerate((-width * 0.20, width * 0.12), start=1):
            mark_interior(box(f"{prefix}__process-skid-{index:02d}", (width * 0.22, depth * 0.24, max_height), (px, -depth * 0.10, prop_z + max_height / 2), mats["interior_equipment"], interior, 0.035))
        mark_interior(box(f"{prefix}__control-cabinet-01", (width * 0.18, 0.14, max_height * 0.90), (width * 0.28, depth * 0.20, prop_z + max_height * 0.45), mats["interior_worktop"], interior, 0.018))
        mark_interior(box(f"{prefix}__worktable-01", (width * .30, depth * .14, .18), (0, depth * .22, prop_z + .10), mats["interior_worktop"], interior, .025))
        mark_interior(box(f"{prefix}__tool-cart-01", (width * .12, depth * .13, .20), (-width * .32, depth * .18, prop_z + .11), mats["interior_storage"], interior, .018))

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


def create_administration_facade(width, depth, height, mats, root):
    """Layer stone reveals and metal mullions over the approved administration massing."""
    front_y = depth / 2
    bay_xs = (-1.35, -0.45, 0.45, 1.35)
    for index, px in enumerate(bay_xs, start=1):
        box(
            f"ADMIN__window-reveal-{index:02d}",
            (0.86, 0.16, 2.53),
            (px, front_y + 0.105, 1.68),
            mats["wall_secondary"],
            root,
            0.018,
        )
        box(
            f"ADMIN__window-frame-top-{index:02d}",
            (0.78, 0.21, 0.09),
            (px, front_y + 0.19, 2.90),
            mats["facade_frame"],
            root,
            0.008,
        )
        box(
            f"ADMIN__window-frame-bottom-{index:02d}",
            (0.78, 0.21, 0.09),
            (px, front_y + 0.19, 0.46),
            mats["facade_frame"],
            root,
            0.008,
        )
        for side in (-1, 1):
            box(
                f"ADMIN__window-frame-side-{index:02d}-{side:+d}",
                (0.08, 0.21, 2.50),
                (px + side * 0.39, front_y + 0.19, 1.68),
                mats["facade_frame"],
                root,
                0.008,
            )
        for level in (1.25, 2.05):
            box(
                f"ADMIN__window-transom-{index:02d}-{int(level * 100)}",
                (0.72, 0.20, 0.055),
                (px, front_y + 0.19, level),
                mats["facade_frame"],
                root,
                0.005,
            )

    for index, (step_width, step_depth, step_height, y_offset) in enumerate([
        (1.70, 0.66, 0.12, 0.38),
        (1.38, 0.44, 0.12, 0.72),
    ], start=1):
        box(
            f"ADMIN__entrance-step-{index:02d}",
            (step_width, step_depth, step_height),
            (0, front_y + y_offset, step_height / 2),
            mats["concrete"],
            root,
            0.018,
        )
    for side in (-1, 1):
        box(
            f"ADMIN__canopy-support-{side:+d}",
            (0.09, 0.09, 0.78),
            (side * 0.52, front_y + 0.61, 0.47),
            mats["facade_frame"],
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


def create_wall_cladding(building_id, width, depth, height, mats, root):
    """Break the white mass into GLB-safe insulated-panel bays on the visible faces."""
    front_y = depth / 2
    front_count = max(2, min(9, round(width / 1.55)))
    front_panel_width = width / front_count
    cladding_height = max(0.72, height - 0.46)
    cladding_z = 0.34 + cladding_height / 2
    for index in range(front_count):
        px = -width / 2 + front_panel_width * (index + 0.5)
        box(
            f"CLADDING__{building_id}__front-panel-{index + 1:02d}",
            (front_panel_width - 0.032, 0.052, cladding_height),
            (px, front_y + 0.030, cladding_z),
            mats["wall_panel_light"] if index % 3 != 1 else mats["wall_panel_mid"],
            root,
            0.004,
        )

    visible_side_x = -width / 2
    side_count = max(2, min(5, round(depth / 1.45)))
    side_panel_depth = depth / side_count
    for index in range(side_count):
        py = -depth / 2 + side_panel_depth * (index + 0.5)
        box(
            f"CLADDING__{building_id}__side-panel-{index + 1:02d}",
            (0.052, side_panel_depth - 0.032, cladding_height),
            (visible_side_x - 0.030, py, cladding_z),
            mats["wall_panel_light"] if index % 3 != 1 else mats["wall_panel_mid"],
            root,
            0.004,
        )

    box(
        f"CLADDING__{building_id}__wall-skirt-front",
        (width - 0.10, 0.10, 0.32),
        (0, front_y + 0.095, 0.16),
        mats["plinth"],
        root,
        0.012,
    )
    box(
        f"CLADDING__{building_id}__wall-skirt-side",
        (0.10, depth - 0.10, 0.32),
        (visible_side_x - 0.095, 0, 0.16),
        mats["plinth"],
        root,
        0.012,
    )
    box(
        f"CLADDING__{building_id}__corner-trim-left",
        (0.12, 0.12, height - 0.14),
        (visible_side_x - 0.055, front_y + 0.055, height / 2),
        mats["corner_flashing"],
        root,
        0.012,
    )
    box(
        f"CLADDING__{building_id}__front-datum-band",
        (width - 0.18, 0.075, 0.065),
        (0, front_y + 0.068, min(height - 0.42, max(0.72, height * 0.48))),
        mats["corner_flashing"],
        root,
        0.006,
    )
    box(
        f"CLADDING__{building_id}__side-datum-band",
        (0.075, depth - 0.18, 0.065),
        (visible_side_x - 0.068, 0, min(height - 0.42, max(0.72, height * 0.48))),
        mats["corner_flashing"],
        root,
        0.006,
    )


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
    create_wall_cladding(building_id, width, depth, height, mats, root)

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
    if building_id == "main-production-hall":
        create_main_production_facade(width, depth, height, mats, root)
    elif building_id == "administration":
        create_administration_facade(width, depth, height, mats, root)
    elif building_id == "gatehouse":
        create_gatehouse_facade(width, depth, height, mats, root)
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
    for side, px in (("west", -1.65), ("east", 1.65)):
        box(f"GATE__post-{side}", (0.18, 0.18, 2.25), (px, 0, 1.12), mats["pipe"], gate, 0.025)
    box("GATE__canopy", (3.8, 1.15, 0.16), (0, 0, 2.25), mats["roof"], gate, 0.035)
    inbound_barrier = empty("GATE__barrier-inbound", (-1.48, -.55, 1.05), gate)
    inbound_barrier["motionPath"] = "gate-barrier"
    inbound_barrier["motionAxis"] = "z"
    inbound_barrier["motionSpeed"] = 0.09
    inbound_barrier["closedAngle"] = 0.0
    inbound_barrier["openAngle"] = -1.22
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
    for x in range(-25, 26, 2):
        positions.append((x, -17.8))
        if not 16.5 <= x <= 24.5:
            positions.append((x, 18.0))
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
        (-22.2, 14.2), (-16.5, 14.2), (-10.5, 14.2), (-4.0, 14.0),
        (5.0, 14.6), (11.5, 14.8), (17.5, 14.8), (23.8, 14.0),
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
        trunk = cylinder(
            f"LANDSCAPE__inner-tree-trunk-{index:02d}",
            0.085 + (index % 3) * 0.008,
            0.72 + (index % 2) * 0.10,
            (x, y, 0.50),
            mats["trunk"],
            group,
            vertices=8,
        )
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.54 + (index % 3) * 0.04, location=(0, 0, 0))
        crown = bpy.context.object
        crown.name = f"LANDSCAPE__inner-tree-crown-{index:02d}"
        crown.parent = group
        crown.location = (x, y, 1.22 + (index % 2) * 0.10)
        crown.scale = (1.0, 0.88, 1.30 + (index % 3) * 0.08)
        crown.data.materials.append(mats["foliage"] if index % 3 else mats["shrub_deep"])
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
    box("ENV__landscape-apron", (76, 62, 0.28), (0, -5.0, -0.30), mats["forest_ground"], group, 0.10)
    box("ENV__forest-backdrop", (76, 26, 0.18), (0, -33.0, -0.16), mats["forest_ground"], group, 0.08)
    box("ENV__forest-side-west", (12, 42, 0.16), (-34.0, -5.0, -0.17), mats["forest_ground"], group, 0.08)
    box("ENV__forest-side-east", (12, 42, 0.16), (34.0, -5.0, -0.17), mats["forest_ground"], group, 0.08)

    prototypes = {}
    tree_index = 0

    def add_forest_tree(x, y, seed):
        nonlocal tree_index
        variant = seed % 3
        height_scale = 0.92 + (seed % 5) * 0.045
        crown_scale = 0.92 + ((seed * 3) % 7) * 0.025
        rotation = (0, 0, math.radians((seed * 47) % 360))
        trunk_location = (x, y, 0.42)
        crown_location = (x, y, 1.24 + (seed % 4) * 0.055)

        if variant not in prototypes:
            trunk = cylinder(
                f"ENV__tree-trunk-{tree_index:03d}",
                0.085 + variant * 0.008,
                0.82 + variant * 0.08,
                trunk_location,
                mats["trunk"],
                group,
                vertices=7 + variant,
            )
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.76 + variant * 0.055, location=(0, 0, 0))
            crown = bpy.context.object
            crown.name = f"ENV__tree-crown-{tree_index:03d}"
            crown.parent = group
            crown.location = crown_location
            crown.data.materials.append(mats["forest_foliage_light"] if variant == 1 else mats["forest_foliage"])
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
        crown.scale = (crown_scale, crown_scale * (0.94 + variant * 0.035), 1.24 + variant * 0.10)
        crown.rotation_euler = rotation
        trunk["instanceFamily"] = "background-tree"
        tree_index += 1

    forest_width = 68.0
    for row, y in enumerate((-22.0, -25.5, -29.0, -32.5, -36.0, -39.5)):
        spacing = 2.75 + row * 0.14
        count = math.floor(forest_width / spacing) + 1
        start_x = -spacing * (count - 1) / 2
        for column in range(count):
            add_forest_tree(start_x + column * spacing, y, row * 31 + column)

    side_y_min = -19.0
    side_y_max = 15.0
    side_spacing = 3.2
    side_count = math.floor((side_y_max - side_y_min) / side_spacing) + 1
    for side_index, x in enumerate((-35.2, -32.5, 32.5, 35.2)):
        offset = side_spacing * 0.5 if side_index % 2 else 0.0
        for row in range(side_count):
            y = side_y_min + row * side_spacing + offset
            if y <= side_y_max:
                add_forest_tree(x, y, 300 + side_index * 37 + row)
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
        "wall": material("MAT__wall", (0.57, 0.61, 0.62, 1), 0.68, coat_weight=0.05),
        "admin_wall": material("MAT__admin-stone", (0.64, 0.61, 0.54, 1), 0.70),
        "wall_secondary": material("MAT__wall-secondary", (0.56, 0.60, 0.61, 1), 0.72, coat_weight=0.04),
        "wall_panel_light": material("MAT__wall-panel-light", (0.64, 0.68, 0.68, 1), 0.70, 0.08, coat_weight=0.06),
        "wall_panel_mid": material("MAT__wall-panel-mid", (0.48, 0.54, 0.55, 1), 0.73, 0.10, coat_weight=0.04),
        "corner_flashing": material("MAT__corner-flashing", (0.20, 0.25, 0.27, 1), 0.44, 0.64, coat_weight=0.10),
        "wall_rib": material("MAT__wall-rib", (0.15, 0.19, 0.21, 1), 0.46, 0.52, coat_weight=0.10),
        "safety_orange": material("MAT__safety-orange", (0.92, 0.28, 0.035, 1), 0.46, 0.18, coat_weight=0.18),
        "luminaire": material("MAT__luminaire", (0.78, 0.88, 0.86, 1), 0.22, 0.08, coat_weight=0.34),
        "facade_frame": material("MAT__facade-frame", (0.12, 0.16, 0.18, 1), 0.38, 0.68, coat_weight=0.14),
        "dock_rubber": material("MAT__dock-rubber", (0.022, 0.026, 0.028, 1), 0.92),
        "roof": material("MAT__roof", (0.42, 0.47, 0.51, 1), 0.42, 0.62, coat_weight=0.12),
        "roof_rib": material("MAT__roof-rib", (0.32, 0.37, 0.40, 1), 0.38, 0.70),
        "accent": material("MAT__blue-accent", (0.035, 0.22, 0.38, 1), 0.38, 0.24, coat_weight=0.22),
        "glass": material("MAT__glass", (0.018, 0.075, 0.12, 1), 0.18, 0.08, transmission=0.30, ior=1.46, coat_weight=0.34),
        "vent": material("MAT__vent", (0.21, 0.25, 0.28, 1), 0.40, 0.72),
        "skylight": material("MAT__skylight", (0.12, 0.25, 0.34, 1), 0.22, 0.12, transmission=0.16, coat_weight=0.25),
        "asphalt": material("MAT__asphalt", (0.075, 0.085, 0.092, 1), 0.93),
        "stripe": material("MAT__road-marking", (0.78, 0.80, 0.76, 1), 0.78),
        "safety_yellow": material("MAT__safety-yellow", (0.86, 0.60, 0.035, 1), 0.68, 0.04, coat_weight=0.05),
        "tactile": material("MAT__tactile-paving", (0.72, 0.53, 0.08, 1), 0.84),
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
        "interior_equipment": material("MAT__interior-equipment", (0.19, 0.27, 0.29, 1), 0.48, 0.54, coat_weight=0.08),
        "interior_worktop": material("MAT__interior-worktop", (0.42, 0.49, 0.50, 1), 0.58, 0.28),
        "interior_storage": material("MAT__interior-storage", (0.18, 0.34, 0.38, 1), 0.52, 0.38),
        "workwear": material("MAT__workwear", (0.025, 0.12, 0.21, 1), 0.66),
        "safety_vest": material("MAT__safety-vest", (0.94, 0.34, 0.035, 1), 0.50, coat_weight=0.08),
        "hardhat": material("MAT__hardhat", (0.92, 0.70, 0.08, 1), 0.42, coat_weight=0.12),
        "skin": material("MAT__skin", (0.58, 0.36, 0.25, 1), 0.72),
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
        "bioswale_soil": material("MAT__bioswale-soil", (0.105, 0.075, 0.045, 1), 0.96),
        "ornamental_grass": material("MAT__ornamental-grass", (0.18, 0.34, 0.12, 1), 0.94),
        "shrub_deep": material("MAT__shrub-deep", (0.035, 0.16, 0.075, 1), 0.92),
        "tree_grate": material("MAT__tree-grate", (0.15, 0.18, 0.17, 1), 0.58, 0.52),
        "forest_ground": material("MAT__forest-ground", (0.10, 0.25, 0.11, 1), 0.96),
        "forest_foliage": material("MAT__forest-foliage", (0.075, 0.30, 0.12, 1), 0.92),
        "forest_foliage_light": material("MAT__forest-foliage-light", (0.11, 0.36, 0.15, 1), 0.91),
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

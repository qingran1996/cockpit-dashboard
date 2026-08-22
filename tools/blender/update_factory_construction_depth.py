"""Incrementally rebuild architectural construction on the approved campus asset."""

import argparse
import importlib.util
import math
import os
import sys

import bpy


def parse_args():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--generator", required=True)
    parser.add_argument("--blend-output", required=True)
    parser.add_argument("--glb-output", required=True)
    return parser.parse_args(values)


def load_generator(path):
    spec = importlib.util.spec_from_file_location("factory_campus_generator", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def remove_direct_children(root, prefixes):
    for obj in list(bpy.data.objects):
        if obj.parent == root and any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def set_bevel_width(obj, width):
    bevel = next((modifier for modifier in obj.modifiers if modifier.type == "BEVEL"), None)
    if bevel is None:
        bevel = obj.modifiers.new(name="EdgeSoftening", type="BEVEL")
        bevel.segments = 1
    bevel.width = width


def fast_box(name, size, location, mat, parent=None, bevel=0.04, rotation=(0, 0, 0)):
    sx, sy, sz = (value / 2 for value in size)
    vertices = [
        (-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
        (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz),
    ]
    faces = [
        (0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1),
        (1, 5, 6, 2), (2, 6, 7, 3), (4, 0, 3, 7),
    ]
    mesh = bpy.data.meshes.new(f"{name}__mesh")
    mesh.from_pydata(vertices, [], faces)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    quad_uvs = ((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0))
    for polygon in mesh.polygons:
        for offset, loop_index in enumerate(polygon.loop_indices):
            uv_layer.data[loop_index].uv = quad_uvs[offset % 4]
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    if bevel:
        modifier = obj.modifiers.new(name="EdgeSoftening", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 1
    return obj


def fast_cylinder(name, radius, depth, location, mat, parent=None, rotation=(0, 0, 0), vertices=12):
    half = depth / 2
    points = []
    for z in (-half, half):
        points.extend(
            (math.cos(index * math.tau / vertices) * radius, math.sin(index * math.tau / vertices) * radius, z)
            for index in range(vertices)
        )
    faces = [tuple(range(vertices - 1, -1, -1)), tuple(range(vertices, vertices * 2))]
    for index in range(vertices):
        next_index = (index + 1) % vertices
        faces.append((index, next_index, vertices + next_index, vertices + index))
    mesh = bpy.data.meshes.new(f"{name}__mesh")
    mesh.from_pydata(points, [], faces)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        loop_count = max(1, len(polygon.loop_indices) - 1)
        for offset, loop_index in enumerate(polygon.loop_indices):
            vertex = mesh.vertices[mesh.loops[loop_index].vertex_index]
            uv_layer.data[loop_index].uv = (offset / loop_count, 1.0 if vertex.co.z > 0 else 0.0)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def main():
    args = parse_args()
    generator = load_generator(os.path.abspath(args.generator))
    material_names = {
        "wall_secondary": "MAT__wall-secondary",
        "glass": "MAT__glass",
        "facade_frame": "MAT__facade-frame",
        "corner_flashing": "MAT__corner-flashing",
        "gutter": "MAT__galvanized-gutter",
        "roof": "MAT__roof",
        "accent": "MAT__blue-accent",
        "interior_equipment": "MAT__interior-equipment",
    }
    mats = {key: bpy.data.materials[name] for key, name in material_names.items()}
    generator.box = fast_box
    generator.cylinder = fast_cylinder

    for building_id, _position, (width, depth, height), kind in generator.BUILDINGS:
        root = bpy.data.objects[f"BLDG__{building_id}"]
        remove_direct_children(
            root,
            (
                f"FACADE__{building_id}__",
                f"ROOF__{building_id}__",
                f"SERVICE__{building_id}__",
                f"{building_id}__door-",
            ),
        )
        for obj in list(root.children):
            if obj.name.startswith(f"CLADDING__{building_id}__wall-skirt-"):
                generator.mark_construction(obj, "wall-plinth", 0.030)
                set_bevel_width(obj, 0.030)
            elif obj.name.startswith(f"CLADDING__{building_id}__corner-trim-"):
                generator.mark_construction(obj, "corner-flashing", 0.035)
                set_bevel_width(obj, 0.035)
        generator.create_constructed_envelope(building_id, width, depth, height, kind, mats, root)
        generator.create_recessed_entry_doors(building_id, width, depth, height, mats, root)

    blend_output = os.path.abspath(args.blend_output)
    glb_output = os.path.abspath(args.glb_output)
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
    print(f"CONSTRUCTION_DEPTH_UPDATE blend={blend_output} glb={glb_output}")


if __name__ == "__main__":
    main()

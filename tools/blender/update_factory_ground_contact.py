"""Incrementally add functional ground PBR zones and localized operational wear."""

import argparse
import importlib.util
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


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def remove_object_tree(obj):
    for child in list(obj.children):
        remove_object_tree(child)
    bpy.data.objects.remove(obj, do_unlink=True)


def reset_ground_uvs():
    seen = set()
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.data in seen or not obj.data.uv_layers:
            continue
        repeat = obj.data.get("pbrUvRepeat")
        if not repeat or repeat[0] == 0 or repeat[1] == 0:
            continue
        for loop_uv in obj.data.uv_layers.active.data:
            loop_uv.uv.x /= repeat[0]
            loop_uv.uv.y /= repeat[1]
        del obj.data["pbrUvRepeat"]
        seen.add(obj.data)


def material_or_create(generator, name, color, roughness):
    return bpy.data.materials.get(name) or generator.material(name, color, roughness)


def main():
    args = parse_args()
    generator_path = os.path.abspath(args.generator)
    generator = load_module("factory_campus_generator", generator_path)
    construction_utils = load_module(
        "factory_construction_utils",
        os.path.join(os.path.dirname(__file__), "update_factory_construction_depth.py"),
    )
    generator.box = construction_utils.fast_box
    generator.cylinder = construction_utils.fast_cylinder

    for root_name in ("SITE__ground-function-zones", "SITE__ground-contact-realism", "SITE__ground-circulation-realism"):
        root = bpy.data.objects.get(root_name)
        if root:
            remove_object_tree(root)

    mats = {
        "asphalt": bpy.data.materials["MAT__asphalt"],
        "paving": bpy.data.materials["MAT__entry-paving"],
        "lawn": bpy.data.materials["MAT__lawn"],
        "bioswale_soil": bpy.data.materials["MAT__bioswale-soil"],
        "planting_mulch": bpy.data.materials["MAT__planting-mulch"],
        "aged_asphalt": material_or_create(generator, "MAT__aged-asphalt", (0.105, 0.105, 0.098, 1), 0.95),
        "loading_concrete": material_or_create(generator, "MAT__loading-concrete", (0.46, 0.47, 0.45, 1), 0.90),
        "parking_surface": material_or_create(generator, "MAT__parking-surface", (0.105, 0.115, 0.118, 1), 0.92),
        "walkway": material_or_create(generator, "MAT__walkway", (0.60, 0.61, 0.58, 1), 0.88),
        "drain": bpy.data.materials["MAT__storm-drain"],
        "ground_joint": material_or_create(generator, "MAT__ground-concrete-joint", (0.18, 0.19, 0.19, 0.30), 0.91),
    }
    generator.configure_ground_pbr_materials({
        key: mats[key]
        for key in ("aged_asphalt", "loading_concrete", "parking_surface", "walkway")
    })
    for key, role, tile_size in (
        ("asphalt", "new-asphalt", 2.0),
        ("paving", "entry-paving", 1.6),
        ("lawn", "lawn", 2.2),
        ("bioswale_soil", "bare-soil", 1.7),
        ("planting_mulch", "mulch", 1.3),
    ):
        mats[key]["groundMaterialRole"] = role
        mats[key]["groundTileSize"] = tile_size

    contact_specs = {
        "ground_tire_wear": ("MAT__ground-tire-wear", (0.14, 0.15, 0.15, 0.24), 0.90),
        "ground_joint": ("MAT__ground-concrete-joint", (0.18, 0.19, 0.19, 0.30), 0.91),
        "ground_repair": ("MAT__ground-asphalt-repair", (0.16, 0.15, 0.14, 0.28), 0.92),
        "ground_drain_stain": ("MAT__ground-drain-discoloration", (0.12, 0.15, 0.13, 0.22), 0.94),
        "ground_dock_abrasion": ("MAT__ground-dock-abrasion", (0.20, 0.17, 0.14, 0.24), 0.90),
        "ground_wall_dust": ("MAT__ground-wall-dust", (0.32, 0.30, 0.26, 0.20), 0.93),
        "ground_oil_mark": ("MAT__ground-oil-mark", (0.11, 0.12, 0.11, 0.26), 0.88),
        "ground_contact_transition": ("MAT__ground-contact-transition", (0.22, 0.24, 0.20, 0.18), 0.94),
    }
    for key, (name, color, roughness) in contact_specs.items():
        mats[key] = material_or_create(generator, name, color, roughness)

    reset_ground_uvs()
    campus = bpy.data.objects["FactoryCampusGraybox"]
    generator.configure_ground_function_zones(mats, campus)
    generator.create_ground_contact_realism(mats, campus)
    generator.create_ground_circulation_realism(mats, campus)
    generator.configure_ground_uv_tiling()

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
    print(f"GROUND_CONTACT_UPDATE blend={blend_output} glb={glb_output}")


if __name__ == "__main__":
    main()

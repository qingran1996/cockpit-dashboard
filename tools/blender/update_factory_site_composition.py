"""Incrementally reshape the campus ground, vegetation hierarchy, and horizon transition."""

import argparse
import importlib.util
import os
import sys

import bpy


GROUND_FAMILIES = {
    "asphalt",
    "aged-asphalt",
    "concrete",
    "loading-concrete",
    "entry-paving",
    "parking-surface",
    "walkway",
    "lawn",
    "bioswale-soil",
    "planting-mulch",
    "forest-ground",
}


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


def clear_ground_pbr(materials):
    for mat in materials.values():
        if not mat or not mat.use_nodes:
            continue
        for node in list(mat.node_tree.nodes):
            image = getattr(node, "image", None)
            if node.name.startswith("PBR__") and image and image.get("pbrFamily") in GROUND_FAMILIES:
                mat.node_tree.nodes.remove(node)
    for image in list(bpy.data.images):
        if image.get("pbrFamily") in GROUND_FAMILIES and image.users == 0:
            bpy.data.images.remove(image)


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


def material(name):
    return bpy.data.materials.get(name)


def main():
    args = parse_args()
    generator_path = os.path.abspath(args.generator)
    generator = load_module("factory_campus_generator", generator_path)
    construction_utils = load_module(
        "factory_construction_utils",
        os.path.join(os.path.dirname(generator_path), "update_factory_construction_depth.py"),
    )
    generator.box = construction_utils.fast_box
    generator.cylinder = construction_utils.fast_cylinder

    mats = {
        "asphalt": material("MAT__asphalt"),
        "aged_asphalt": material("MAT__aged-asphalt"),
        "concrete": material("MAT__concrete"),
        "loading_concrete": material("MAT__loading-concrete"),
        "paving": material("MAT__entry-paving"),
        "parking_surface": material("MAT__parking-surface"),
        "walkway": material("MAT__walkway"),
        "lawn": material("MAT__lawn"),
        "bioswale_soil": material("MAT__bioswale-soil"),
        "planting_mulch": material("MAT__planting-mulch"),
        "forest_ground": material("MAT__forest-ground"),
    }
    active_mats = {key: value for key, value in mats.items() if value is not None}
    required = ("asphalt", "loading_concrete", "walkway", "lawn", "bioswale_soil", "planting_mulch", "forest_ground")
    missing = [key for key in required if key not in active_mats]
    if missing:
        raise RuntimeError(f"site composition is missing ground materials: {missing}")

    clear_ground_pbr(active_mats)
    reset_ground_uvs()
    generator.configure_ground_pbr_materials(active_mats)

    campus = bpy.data.objects["FactoryCampusGraybox"]
    summary = generator.create_site_composition(active_mats, campus)
    generator.configure_ground_uv_tiling()
    reuse = generator.optimize_asset_reuse_and_visibility(campus)

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
    print(
        "SITE_COMPOSITION_EXPORT "
        f"blend={blend_output} glb={glb_output} "
        f"horizon={summary['horizon']} heroes={summary['heroes']} "
        f"reuse={reuse['instances']} visibility={reuse['near']}/{reuse['mid']}"
    )


if __name__ == "__main__":
    main()

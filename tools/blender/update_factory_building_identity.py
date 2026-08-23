"""Rebuild functional building silhouettes in the formal campus blend and GLB."""

import argparse
import importlib.util
import os
import sys

import bpy


MATERIALS = {
    "admin_glass": "MAT__admin-glass",
    "admin_stone_light": "MAT__limestone-light",
    "architectural_bronze": "MAT__architectural-bronze",
    "facade_frame": "MAT__facade-frame",
    "factory_panel_light": "MAT__factory-panel-light",
    "factory_panel_mid": "MAT__factory-panel-mid",
    "glass": "MAT__glass",
    "gutter": "MAT__galvanized-gutter",
    "loading_concrete": "MAT__loading-concrete",
    "pipe": "MAT__pipe-structure",
    "roof": "MAT__roof",
    "warehouse_panel_light": "MAT__warehouse-panel-light",
}


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


def main():
    args = parse_args()
    generator = load_generator(args.generator)
    campus = bpy.data.objects.get("FactoryCampusGraybox")
    if campus is None:
        raise RuntimeError("FactoryCampusGraybox root is missing")
    mats = {key: bpy.data.materials[name] for key, name in MATERIALS.items()}
    identity_count = generator.rebuild_building_identities(mats, campus)
    asset_summary = generator.optimize_asset_reuse_and_visibility(campus)

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
        f"BUILDING_IDENTITY_EXPORT blend={blend_output} glb={glb_output} "
        f"identities={identity_count} reuse={asset_summary['instances']} "
        f"visibility={asset_summary['near']}/{asset_summary['mid']}"
    )


if __name__ == "__main__":
    main()

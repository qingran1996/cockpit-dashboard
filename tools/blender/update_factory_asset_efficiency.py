"""Apply reusable-mesh and distance-visibility optimization to the formal campus blend."""

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

    summary = generator.optimize_asset_reuse_and_visibility(campus)
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
        f"ASSET_EFFICIENCY_EXPORT blend={blend_output} glb={glb_output} "
        f"reuse={summary['instances']} groups={summary['groups']} "
        f"visibility={summary['near']}/{summary['mid']} materials={summary['material_slots']}"
    )


if __name__ == "__main__":
    main()

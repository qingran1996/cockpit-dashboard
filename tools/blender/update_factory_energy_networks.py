"""Add the water, power, and steam network twin to an existing campus Blender asset."""

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
    campus = bpy.data.objects["FactoryCampusGraybox"]
    roots = generator.create_factory_energy_networks(campus)
    bpy.context.scene["energyNetworkTwinPass"] = "2026-08-23"

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
    print(f"ENERGY_NETWORK_EXPORT blend={blend_output} glb={glb_output} roots={len(roots)}")


if __name__ == "__main__":
    main()

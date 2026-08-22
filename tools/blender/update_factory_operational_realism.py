"""Incrementally add the role-based operational-realism pass to an existing campus blend."""

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
    names = {
        "concrete": "MAT__concrete",
        "loading_concrete": "MAT__loading-concrete",
        "street_metal": "MAT__street-metal",
        "facade_frame": "MAT__facade-frame",
        "wayfinding_amber": "MAT__wayfinding-amber",
        "dock_rubber": "MAT__dock-rubber",
        "street_timber": "MAT__street-timber",
        "interior_worktop": "MAT__interior-worktop",
        "gutter": "MAT__galvanized-gutter",
        "tire": "MAT__tire",
        "safety_orange": "MAT__safety-orange",
        "white": "MAT__paint-white",
        "pipe_accent": "MAT__pipe-runs",
        "safety_yellow": "MAT__safety-yellow",
        "task_light_cool": "MAT__task-light-cool",
        "architectural_bronze": "MAT__architectural-bronze",
        "understory_deep": "MAT__understory-deep",
        "workwear": "MAT__workwear",
        "safety_vest": "MAT__safety-vest",
        "skin": "MAT__skin",
        "hardhat": "MAT__hardhat",
    }
    mats = {key: bpy.data.materials[value] for key, value in names.items()}
    campus = bpy.data.objects["FactoryCampusGraybox"]
    operational = generator.create_factory_operational_realism(mats, campus)
    campus["operationalRealism"] = "role-based-work-zones-and-purposeful-task-routes"
    bpy.context.scene["operationalRealismPass"] = "2026-08-21"

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
        f"OPERATIONAL_REALISM_EXPORT blend={blend_output} glb={glb_output} "
        f"objects={len(operational.children_recursive)}"
    )


if __name__ == "__main__":
    main()

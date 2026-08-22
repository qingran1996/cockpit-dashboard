"""Incrementally rebuild rear service envelopes and roof operation cues."""

import argparse
import importlib.util
import os
import sys

import bpy


def parse_args():
    values = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
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


def main():
    args = parse_args()
    generator = load_module("factory_campus_generator", os.path.abspath(args.generator))
    construction = load_module(
        "factory_construction_utils",
        os.path.join(os.path.dirname(__file__), "update_factory_construction_depth.py"),
    )
    generator.box = construction.fast_box
    generator.cylinder = construction.fast_cylinder

    mats = {
        "loading_concrete": bpy.data.materials["MAT__loading-concrete"],
        "gutter": bpy.data.materials["MAT__galvanized-gutter"],
        "facade_frame": bpy.data.materials["MAT__facade-frame"],
        "corner_flashing": bpy.data.materials["MAT__corner-flashing"],
        "vent": bpy.data.materials["MAT__vent"],
        "safety_yellow": bpy.data.materials["MAT__safety-yellow"],
        "roof_rib": bpy.data.materials["MAT__roof-rib"],
    }

    for building_id, _position, (width, depth, height), _kind in generator.BUILDINGS:
        old_root = bpy.data.objects.get(f"SERVICE_ENVELOPE__{building_id}")
        if old_root:
            remove_object_tree(old_root)
        building_root = bpy.data.objects[f"BLDG__{building_id}"]
        generator.create_rear_service_envelope(building_id, width, depth, height, mats, building_root)

    bpy.context.scene["serviceEnvelopePass"] = "2026-08-22"
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
    print(f"SERVICE_ENVELOPE_UPDATE blend={blend_output} glb={glb_output} buildings={len(generator.BUILDINGS)}")


if __name__ == "__main__":
    main()

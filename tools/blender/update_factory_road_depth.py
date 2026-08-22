"""Stabilize overlapping road surfaces without rebuilding the full PBR campus."""

import argparse
import os
import sys

import bpy


HORIZONTAL_ROAD_TOP = 0.09
VERTICAL_ROAD_TOP = 0.07
MARKING_CLEARANCE = 0.005


def parse_args():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend-output", required=True)
    parser.add_argument("--glb-output", required=True)
    return parser.parse_args(values)


def is_structural_road(obj):
    return obj.type == "MESH" and obj.name.startswith(("ROAD__segment-", "ROAD__perimeter-"))


def set_surface_top(obj, top):
    obj.location.z = top - obj.dimensions.z / 2


def set_marking_top(obj, supporting_top):
    obj.location.z = supporting_top + obj.dimensions.z / 2 + MARKING_CLEARANCE


def stabilize_road_depths():
    roads = [obj for obj in bpy.context.scene.objects if is_structural_road(obj)]
    for road in roads:
        horizontal = road.dimensions.x >= road.dimensions.y
        top = HORIZONTAL_ROAD_TOP if horizontal else VERTICAL_ROAD_TOP
        set_surface_top(road, top)
        road["depthLayer"] = "horizontal-primary" if horizontal else "vertical-secondary"

    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        if obj.name.startswith(("ROAD__front-dash-", "ROAD__rear-dash-", "ROAD__inner-dash-", "ROAD__crossing-")):
            set_marking_top(obj, HORIZONTAL_ROAD_TOP)
        elif obj.name.startswith(("ROAD__west-dash-", "ROAD__east-dash-", "ROAD__entry-dash-")):
            set_marking_top(obj, VERTICAL_ROAD_TOP)
        elif obj.name.startswith(("ROAD__boulevard-dash-", "ROAD__boulevard-edge-")):
            set_marking_top(obj, HORIZONTAL_ROAD_TOP)
    return len(roads)


def main():
    args = parse_args()
    road_count = stabilize_road_depths()
    bpy.context.view_layer.update()

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
    print(f"ROAD_DEPTH_UPDATE roads={road_count} blend={blend_output} glb={glb_output}")


if __name__ == "__main__":
    main()

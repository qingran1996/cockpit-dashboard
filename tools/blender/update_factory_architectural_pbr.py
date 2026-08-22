import argparse
import importlib.util
import os
import sys

import bpy


def parse_args():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument('--generator', required=True)
    parser.add_argument('--blend-output', required=True)
    parser.add_argument('--glb-output', required=True)
    return parser.parse_args(args)


def load_generator(path):
    spec = importlib.util.spec_from_file_location('factory_campus_generator', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def reset_architectural_uvs():
    seen = set()
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH' or obj.data in seen or not obj.data.uv_layers:
            continue
        repeat = obj.data.get('architecturalPbrUvRepeat')
        if not repeat or repeat[0] == 0 or repeat[1] == 0:
            continue
        for loop_uv in obj.data.uv_layers.active.data:
            loop_uv.uv.x /= repeat[0]
            loop_uv.uv.y /= repeat[1]
        del obj.data['architecturalPbrUvRepeat']
        seen.add(obj.data)


def clear_architectural_nodes(materials):
    for mat in materials.values():
        if not mat or not mat.use_nodes:
            continue
        for node in list(mat.node_tree.nodes):
            if node.name.startswith('PBR__'):
                mat.node_tree.nodes.remove(node)
    for image in list(bpy.data.images):
        if image.name.startswith('PBR__architectural__') and image.users == 0:
            bpy.data.images.remove(image)


def remove_legacy_facade_joints():
    for obj in list(bpy.data.objects):
        if obj.name.startswith('DETAIL__facade-joint-'):
            bpy.data.objects.remove(obj, do_unlink=True)


def set_material(mat, color, roughness, metallic):
    mat.diffuse_color = (*color, 1.0)
    shader = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*color, 1.0)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic


def main():
    args = parse_args()
    generator = load_generator(args.generator)
    names = {
        'admin_wall': 'MAT__admin-stone',
        'admin_stone_light': 'MAT__limestone-light',
        'admin_stone_dark': 'MAT__limestone-shadow',
        'factory_wall': 'MAT__factory-wall',
        'factory_panel_light': 'MAT__factory-panel-light',
        'factory_panel_mid': 'MAT__factory-panel-mid',
        'warehouse_wall': 'MAT__warehouse-wall',
        'warehouse_panel_light': 'MAT__warehouse-panel-light',
        'warehouse_panel_mid': 'MAT__warehouse-panel-mid',
        'process_wall': 'MAT__process-wall',
        'process_panel_light': 'MAT__process-panel-light',
        'process_panel_mid': 'MAT__process-panel-mid',
        'utility_wall': 'MAT__utility-wall',
        'utility_panel_light': 'MAT__utility-panel-light',
        'utility_panel_mid': 'MAT__utility-panel-mid',
        'laboratory_wall': 'MAT__laboratory-wall',
        'laboratory_panel_light': 'MAT__laboratory-panel-light',
        'laboratory_panel_mid': 'MAT__laboratory-panel-mid',
        'plinth': 'MAT__wall-plinth',
        'curb': 'MAT__curb',
        'sidewalk': 'MAT__sidewalk',
        'roof': 'MAT__roof',
        'roof_rib': 'MAT__roof-rib',
        'gutter': 'MAT__galvanized-gutter',
        'corner_flashing': 'MAT__corner-flashing',
    }
    mats = {key: bpy.data.materials[name] for key, name in names.items()}
    palette = {
        'admin_wall': ((.90, .87, .80), .78, 0),
        'admin_stone_light': ((.94, .91, .85), .78, 0),
        'admin_stone_dark': ((.86, .83, .78), .80, 0),
        'factory_wall': ((.87, .89, .90), .65, .05),
        'factory_panel_light': ((.92, .93, .93), .65, .05),
        'factory_panel_mid': ((.82, .85, .86), .68, .05),
        'warehouse_wall': ((.89, .87, .82), .72, .03),
        'warehouse_panel_light': ((.93, .91, .86), .72, .03),
        'warehouse_panel_mid': ((.85, .84, .80), .74, .03),
        'process_wall': ((.85, .88, .90), .66, .05),
        'process_panel_light': ((.90, .92, .93), .65, .05),
        'process_panel_mid': ((.81, .85, .87), .68, .05),
        'utility_wall': ((.82, .85, .87), .68, .06),
        'utility_panel_light': ((.88, .91, .93), .66, .06),
        'utility_panel_mid': ((.80, .83, .85), .70, .06),
        'laboratory_wall': ((.89, .91, .88), .68, .03),
        'laboratory_panel_light': ((.93, .94, .90), .66, .03),
        'laboratory_panel_mid': ((.84, .87, .84), .70, .03),
        'plinth': ((.72, .73, .71), .82, 0),
        'curb': ((.78, .79, .76), .82, 0),
        'sidewalk': ((.78, .80, .79), .82, 0),
        'roof': ((.90, .91, .92), .62, .10),
        'roof_rib': ((.86, .88, .89), .62, .10),
        'gutter': ((.82, .84, .86), .62, .10),
        'corner_flashing': ((.88, .89, .90), .62, .10),
    }

    reset_architectural_uvs()
    clear_architectural_nodes(mats)
    remove_legacy_facade_joints()
    for key, (color, roughness, metallic) in palette.items():
        set_material(mats[key], color, roughness, metallic)
    generator.configure_architectural_pbr_materials(mats)
    generator.configure_architectural_uv_tiling()

    blend_output = os.path.abspath(args.blend_output)
    glb_output = os.path.abspath(args.glb_output)
    bpy.ops.wm.save_as_mainfile(filepath=blend_output)
    bpy.ops.export_scene.gltf(
        filepath=glb_output,
        export_format='GLB',
        export_yup=True,
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
    print(f'ARCHITECTURAL_PBR_UPDATE blend={blend_output} glb={glb_output}')


if __name__ == '__main__':
    main()

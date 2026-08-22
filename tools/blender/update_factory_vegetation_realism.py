import argparse
import importlib.util
import os
import sys

import bpy


VEGETATION_FAMILIES = {
    "tree-bark",
    "foliage-deep",
    "foliage-light",
    "foliage-mid",
    "foliage-sunlit",
    "foliage-warm",
    "forest-foliage",
    "forest-foliage-light",
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


def remove_object_tree(obj):
    for child in list(obj.children):
        remove_object_tree(child)
    bpy.data.objects.remove(obj, do_unlink=True)


def clear_vegetation_pbr(materials):
    for mat in materials.values():
        if not mat or not mat.use_nodes:
            continue
        for node in list(mat.node_tree.nodes):
            image = getattr(node, "image", None)
            if node.name.startswith("PBR__") and image and image.get("pbrFamily") in VEGETATION_FAMILIES:
                mat.node_tree.nodes.remove(node)
    for image in list(bpy.data.images):
        if image.get("pbrFamily") in VEGETATION_FAMILIES and image.users == 0:
            bpy.data.images.remove(image)


def set_material(mat, color, roughness):
    mat.diffuse_color = (*color, 1.0)
    mat.use_backface_culling = False
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness


def object_index(obj):
    return int(obj.name.rsplit("-", 1)[-1].split(".", 1)[0])


def main():
    args = parse_args()
    generator = load_generator(args.generator)
    transition_root = bpy.data.objects.get("VEGETATION__transition-realism")
    if transition_root:
        remove_object_tree(transition_root)
    mats = {
        "trunk": bpy.data.materials["MAT__trunk"],
        "foliage": bpy.data.materials["MAT__foliage"],
        "foliage_light": bpy.data.materials["MAT__foliage-light"],
        "foliage_warm": bpy.data.materials["MAT__foliage-warm"],
        "forest_foliage": bpy.data.materials["MAT__forest-foliage"],
        "forest_foliage_light": bpy.data.materials["MAT__forest-foliage-light"],
        "planting_mulch": bpy.data.materials["MAT__planting-mulch"],
        "bioswale_soil": bpy.data.materials["MAT__bioswale-soil"],
        "ornamental_grass": bpy.data.materials["MAT__ornamental-grass"],
        "understory_deep": bpy.data.materials["MAT__understory-deep"],
        "understory_warm": bpy.data.materials["MAT__understory-warm"],
    }
    mats["foliage_sunlit"] = bpy.data.materials.get("MAT__foliage-sunlit") or generator.material(
        "MAT__foliage-sunlit", (0.155, 0.335, 0.105, 1.0), 0.90
    )
    palette = {
        "trunk": ((0.145, 0.082, 0.040), 0.96),
        "foliage": ((0.040, 0.175, 0.065), 0.94),
        "foliage_light": ((0.075, 0.255, 0.095), 0.92),
        "foliage_sunlit": ((0.155, 0.335, 0.105), 0.90),
        "foliage_warm": ((0.185, 0.265, 0.065), 0.93),
        "forest_foliage": ((0.052, 0.215, 0.075), 0.95),
        "forest_foliage_light": ((0.105, 0.305, 0.105), 0.93),
    }

    clear_vegetation_pbr(mats)
    for key, (color, roughness) in palette.items():
        set_material(mats[key], color, roughness)
        if key != "trunk":
            mats[key]["foliageRenderMode"] = "opaque-cluster"
    generator.configure_vegetation_pbr_materials(mats)

    branch_roots = [
        obj
        for obj in bpy.data.objects
        if obj.type == "EMPTY" and obj.name.startswith("VEGETATION__inner-tree-branches-")
    ]
    for branch_root in branch_roots:
        remove_object_tree(branch_root)

    temp_root = generator.empty("__VEGETATION_UPDATE_PROTOTYPES")
    campus_layers = (mats["foliage"], mats["foliage_light"], mats["foliage_sunlit"])
    campus_prototypes = {}
    for profile_index, species in enumerate(generator.CANOPY_PROFILE_NAMES):
        primary = (mats["foliage"], mats["foliage_light"], mats["foliage_warm"])[profile_index % 3]
        campus_prototypes[species] = generator.clustered_crown(
            f"__VEGETATION_UPDATE__campus-{species}",
            0.60 + (profile_index % 3) * 0.035,
            (0, 0, 0),
            primary,
            temp_root,
            profile_index,
            species,
            "near",
            campus_layers,
        )

    forest_species = ("woodland", "conifer", "columnar")
    forest_prototypes = {}
    for profile_index, species in enumerate(forest_species):
        forest_prototypes[species] = generator.clustered_crown(
            f"__VEGETATION_UPDATE__forest-{species}",
            0.76 + profile_index * 0.055,
            (0, 0, 0),
            mats["forest_foliage_light"] if profile_index == 1 else mats["forest_foliage"],
            temp_root,
            profile_index + 3,
            species,
            "far",
            (mats["forest_foliage"], mats["forest_foliage_light"]),
        )

    crowns = [
        obj
        for obj in bpy.context.scene.objects
        if obj.type == "MESH"
        and obj.name.startswith(("TREE__crown-", "LANDSCAPE__inner-tree-crown-", "ENV__tree-crown-"))
    ]
    old_meshes = {obj.data for obj in crowns}
    landscape = bpy.data.objects["SITE__landscape"]
    near_count = 0
    for crown in crowns:
        index = object_index(crown)
        if crown.name.startswith("ENV__"):
            species = forest_species[index % len(forest_species)]
            tier = "mid" if crown.get("forestBand") == "edge" else "far"
            crown.data = forest_prototypes[species].data
        else:
            species = generator.CANOPY_PROFILE_NAMES[index % len(generator.CANOPY_PROFILE_NAMES)]
            tier = "near" if crown.name.startswith("LANDSCAPE__inner-tree-crown-") else "mid"
            crown.data = campus_prototypes[species].data
        crown["vegetationSpecies"] = species
        crown["vegetationTier"] = tier
        if tier == "near":
            near_count += 1
            generator.create_branch_structure(
                f"VEGETATION__inner-tree-branches-{index:02d}",
                (crown.location.x, crown.location.y, max(0.68, crown.location.z - 0.46)),
                0.60 + (index % 3) * 0.035,
                mats["trunk"],
                landscape,
                index,
            )

    for prototype in list(campus_prototypes.values()) + list(forest_prototypes.values()):
        bpy.data.objects.remove(prototype, do_unlink=True)
    bpy.data.objects.remove(temp_root, do_unlink=True)
    for mesh in old_meshes:
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)

    campus = bpy.data.objects["FactoryCampusGraybox"]
    generator.create_vegetation_ecology(mats, campus)
    generator.create_vegetation_transition_realism(mats, campus)

    root = bpy.data.objects.get("FactoryCampusGraybox")
    if root:
        root["vegetationSystem"] = "porous-six-profile-near-mid-far-pbr"
        root["vegetationSpeciesCount"] = len(generator.CANOPY_PROFILE_NAMES)
    bpy.context.scene["vegetationRealismPass"] = "2026-08-21"

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
        f"VEGETATION_REALISM_EXPORT blend={blend_output} glb={glb_output} "
        f"crowns={len(crowns)} near={near_count} profiles={len(campus_prototypes) + len(forest_prototypes)}"
    )


if __name__ == "__main__":
    main()

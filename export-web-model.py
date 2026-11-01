import bpy
bpy.ops.wm.open_mainfile(filepath=r'D:\konten\guild-rantau\lowpoly-3d\v2\guild-rantau-v2.blend')
bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
root=bpy.data.objects.get('Rumu_ROOT')
for obj in [root,*root.children_recursive]:
 if not obj.hide_render: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=r'D:\konten\guild-rantau\website\public\assets\rumu.glb',export_format='GLB',use_selection=True,export_animations=False,export_apply=True)

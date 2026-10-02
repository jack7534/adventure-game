"""Reproducible pixel edits of CC0 Tiny Dungeon / Tiny Creatures, not new third-party art."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
SHEETS={name:Image.open(ROOT/'assets'/f'{name}.png').convert('RGBA') for name in ['dungeon','creatures']}
OUTLINE=(63,38,49,255)
def tile(atlas,index):
    cols=12 if atlas=='dungeon' else 10
    return SHEETS[atlas].crop((index%cols*16,index//cols*16,index%cols*16+16,index//cols*16+16))
def recolor(im,mapping):
    out=im.copy()
    out.putdata([tuple(mapping.get(px[:3],px[:3]))+(px[3],) if px[3] else px for px in im.getdata()])
    return out
GREEN={(37,149,106):(41,126,85),(67,225,179):(118,202,129)}
configs=[
 ('forest_bow','dungeon',112,GREEN,'bow'),
 ('dusk_assassin','creatures',19,{(139,155,180):(93,80,140),(192,203,220):(172,148,202)},'daggers'),
 ('sand_hunter','dungeon',112,{(37,149,106):(183,143,88),(67,225,179):(228,197,131)},'bow'),
 ('snow_hunter','dungeon',112,{(37,149,106):(146,181,193),(67,225,179):(211,233,235),(118,59,54):(63,79,101)},'bow'),
 ('crimson_rogue','dungeon',98,{(82,96,124):(130,47,67),(139,155,180):(193,74,88)},'daggers'),
 ('moon_ranger','dungeon',112,{(37,149,106):(110,83,150),(67,225,179):(179,148,213)},'bow'),
 ('falconer','dungeon',85,{(192,203,220):(89,145,144),(139,155,180):(55,106,110)},'bird'),
 ('beast_warden','dungeon',86,{(118,59,54):(37,99,91),(189,108,74):(93,145,116)},'staff'),
 ('beast_shaman','dungeon',111,{(189,108,74):(51,139,133),(232,69,55):(217,184,104)},'antlers'),
 ('duelist','dungeon',100,{(118,59,54):(43,70,104),(139,155,180):(180,181,218)},'rapier'),
 ('sun_paladin','dungeon',97,{(82,96,124):(145,115,61),(139,155,180):(208,173,94),(192,203,220):(244,222,157)},'shield'),
 ('grove_druid','dungeon',84,{(155,76,163):(39,129,85),(209,118,208):(113,192,108)},'staff'),
 ('moon_witch','creatures',100,{(139,155,180):(151,118,188),(192,203,220):(211,180,233)},'star'),
 ('night_ninja','creatures',19,{(139,155,180):(67,85,102),(192,203,220):(101,129,144)},'scarf'),
 ('crossbow_scout','dungeon',87,{(189,108,74):(162,78,60),(192,203,220):(187,178,153)},'crossbow'),
 ('blue_wayfarer','dungeon',88,{(118,59,54):(41,83,128),(189,108,74):(63,125,166)},'map')]
out=Image.new('RGBA',(128,48))
for i,(name,atlas,index,colors,gear) in enumerate(configs):
    im=recolor(tile(atlas,index),colors);d=ImageDraw.Draw(im)
    if gear=='bow':
        d.line([(2,6),(0,8),(0,12),(2,14)],fill=OUTLINE,width=2)
        d.line([(2,7),(1,9),(1,11),(2,13)],fill='#ca9862');d.line([(2,7),(2,13)],fill='#d7d9c1')
        d.line([(0,10),(5,10)],fill='#f3d8a0');d.point((5,9),fill='#d9e5ea')
    elif gear=='daggers':
        for x in [1,14]:
            d.rectangle((x-1,8,x+1,13),fill=OUTLINE);d.line((x,9,x,11),fill='#c0e0ef');d.point((x,12),fill='#bb8654')
    elif gear=='scarf':
        d.rectangle((4,7,10,8),fill='#344456');d.point((6,7),fill='#f4c382');d.line((9,8,14,6),fill='#b54b68',width=2)
        d.line((1,10,3,12),fill='#a9c6d6')
    elif gear=='bird':
        d.polygon([(1,6),(3,4),(5,6),(4,9),(1,9)],fill=OUTLINE);d.rectangle((2,6,3,8),fill='#c39a73');d.point((4,6),fill='#f1d784')
    elif gear in ['staff','antlers']:
        d.line((1,5,1,13),fill=OUTLINE,width=3);d.line((1,6,1,13),fill='#b99360')
        d.rectangle((0,3,3,6),fill=OUTLINE);d.rectangle((1,4,2,5),fill='#72c58b')
        if gear=='antlers':
            d.line([(4,4),(3,1),(1,1)],fill='#d5b16b');d.line([(11,4),(12,1),(14,1)],fill='#d5b16b')
    elif gear=='rapier':
        d.line((13,5,13,13),fill=OUTLINE,width=3);d.line((13,5,13,10),fill='#d2e8ed');d.line((12,11,14,11),fill='#e5c27d')
    elif gear=='shield':
        d.polygon([(0,8),(4,8),(4,12),(2,14),(0,12)],fill=OUTLINE);d.rectangle((1,9,3,11),fill='#d1b76a');d.line((2,9,2,12),fill='#f6edbf')
    elif gear=='star':
        d.line((2,7,2,14),fill=OUTLINE,width=2);d.point((2,5),fill='#f7de96');d.line((1,6,3,6),fill='#f7de96');d.point((2,7),fill='#f7de96')
    elif gear=='crossbow':
        d.rectangle((0,9,4,12),fill=OUTLINE);d.line((0,10,4,10),fill='#c4d5d3');d.line((2,8,2,13),fill='#ac7549')
    elif gear=='map':
        d.rectangle((0,9,4,13),fill=OUTLINE);d.rectangle((1,10,3,12),fill='#e6d6a4');d.point((2,11),fill='#7a9975')
    out.alpha_composite(im,(i%8*16,i//8*16))
# A small pointed-ear fox, edited from the canine silhouette. No tiger substitution.
fox=Image.new('RGBA',(16,16));d=ImageDraw.Draw(fox)
d.polygon([(2,4),(4,5),(5,3),(7,5),(9,5),(11,7),(12,10),(14,8),(15,9),(14,13),(10,14),(6,14),(3,12),(1,8)],fill=OUTLINE)
d.polygon([(3,5),(4,7),(6,5),(7,7),(9,6),(10,8),(10,11),(8,12),(5,12),(3,10),(2,8)],fill='#d78348')
d.polygon([(10,11),(13,10),(14,9),(14,12),(12,13),(10,13)],fill='#d78348')
d.rectangle((12,11,13,12),fill='#f1dfbd');d.polygon([(3,9),(5,10),(7,9),(7,11),(4,11)],fill='#f1dfbd')
d.point((3,8),fill='#262b44');d.point((7,8),fill='#262b44');d.point((5,10),fill='#262b44');d.point((4,13),fill='#bd6c4a');d.point((9,13),fill='#bd6c4a')
out.alpha_composite(fox,(0,32));out.save(ROOT/'assets/heroes-expansion.png')
# Indexed QA sheet (not a runtime dependency).
preview=Image.new('RGB',(8*112,3*124),'#19282e');draw=ImageDraw.Draw(preview)
for i,(name,*_) in enumerate(configs+[('fox',)]):
    tile_img=out.crop((i%8*16,i//8*16,i%8*16+16,i//8*16+16)).resize((80,80),Image.Resampling.NEAREST)
    preview.paste(tile_img,(i%8*112+16,i//8*124+5),tile_img)
    draw.text((i%8*112+3,i//8*124+90),name,fill='#e6dfc9')
(ROOT/'test-results').mkdir(exist_ok=True);preview.save(ROOT/'test-results/expanded-portraits.png')
print('Created 16 derivative hero sprites + fox. CC0 sources retained in assets/.')

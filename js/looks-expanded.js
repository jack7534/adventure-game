/* Sixteen extra CC0-derived appearances. Original IDs remain compatible. */
const EXTRA_LOOKS=[
 ['forest_bow','森弓遊俠'],['dusk_assassin','暮影刺客'],['sand_hunter','沙原獵人'],['snow_hunter','霜林獵人'],
 ['crimson_rogue','赤巾盜俠'],['moon_ranger','月弓遊俠'],['falconer','巡野馴鷹師'],['beast_warden','獸群守望者'],
 ['beast_shaman','獸語祭司'],['duelist','銀刃決鬥家'],['sun_paladin','曙光聖騎士'],['grove_druid','翠林德魯伊'],
 ['moon_witch','月夜女巫'],['night_ninja','夜行忍者'],['crossbow_scout','機弩斥候'],['blue_wayfarer','藍披風旅者']
].map(([id,name],tile)=>({id,name,tile,atlas:'expansion'}));
HERO_LOOKS.push(...EXTRA_LOOKS);
for(const look of EXTRA_LOOKS)SCENE_PORTRAITS[look.id]={...look,kind:'person'};
SCENE_PORTRAITS.fox={id:'fox',name:'嘴硬的小狐狸',atlas:'expansion',tile:16,kind:'animal'};
function expansionAt(el,index,size=64){el.style.backgroundImage='url(assets/heroes-expansion.png)';el.style.width=el.style.height=`${size}px`;el.style.backgroundSize=`${8*size}px ${3*size}px`;el.style.backgroundPosition=`-${index%8*size}px -${Math.floor(index/8)*size}px`;}

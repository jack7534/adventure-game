/* Validate NPC save data before applying it. Old saves default to an empty social ledger. */
function cleanSocial(input){
 if(input==null)return null;const s=validObject(input);if(s.version!==1)throw Error('NPC 紀錄版本無效');
 const out={version:1,roster:{},active:[],event:s.event??null,campVisits:[],helper:s.helper??null,helperBattles:validNumber(s.helperBattles,0,2),lastHelpRound:validNumber(s.lastHelpRound),lastHelpBattle:validNumber(s.lastHelpBattle),escapes:validNumber(s.escapes),repute:validNumber(s.repute,-5,5)};
 if(out.event!==null&&!Object.hasOwn(NPC_ENCOUNTERS,out.event))throw Error('NPC 遭遇無效');if(out.helper!==null&&!Object.hasOwn(NPC_ROSTER,out.helper))throw Error('同行 NPC 無效');
 if(!Array.isArray(s.active)||s.active.length>3||new Set(s.active).size!==s.active.length||s.active.some(id=>!Object.hasOwn(NPC_ROSTER,id)))throw Error('NPC 隊伍資料無效');out.active=[...s.active];
 if(!Array.isArray(s.campVisits)||s.campVisits.length>20||s.campVisits.some(x=>typeof x!=='string'||!/^([1-5]):\d{1,8}:[a-z]+$/.test(x)))throw Error('營地相遇紀錄無效');out.campVisits=[...s.campVisits];
 const roster=validObject(s.roster);if(Object.keys(roster).length>Object.keys(NPC_ROSTER).length)throw Error('NPC 名冊過大');
 for(const [id,n]of Object.entries(roster)){if(!Object.hasOwn(NPC_ROSTER,id))throw Error('未知 NPC');const maxHp=validNumber(n.maxHp,1,10000);out.roster[id]={level:validNumber(n.level,1,40),hp:validNumber(n.hp,1,maxHp),maxHp,trust:validNumber(n.trust,-5,5),meetings:validNumber(n.meetings),wins:validNumber(n.wins),lastSeen:validNumber(n.lastSeen)};}
 return out;
}
function cleanNpcEnemy(e,out){if(e.npcIds!=null){if(!Array.isArray(e.npcIds)||e.npcIds.length<1||e.npcIds.length>3||e.npcIds.some(id=>!Object.hasOwn(NPC_ROSTER,id))||new Set(e.npcIds).size!==e.npcIds.length)throw Error('敵方 NPC 隊伍無效');out.npcIds=[...e.npcIds];out.npcBounty=validNumber(e.npcBounty??0,0,50);out.npcDuel=validBool(e.npcDuel??false);}return out;}

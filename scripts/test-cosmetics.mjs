import assert from 'node:assert/strict';
import * as THREE from 'three';
import {loadGameModules} from './load-game-modules.mjs';
const {cosmetics:c,avatar:a}=await loadGameModules();
assert.equal(c.ITEMS.length,30);assert.equal(new Set(c.ITEMS.map(c.itemKey)).size,30);assert.equal(c.STARTER.length,10);
assert.deepEqual(c.spinOdds(c.STARTER).map(o=>o.percent),[60,30,10]);
const owned=[...c.STARTER];for(let i=0;i<20;i++){const item=c.drawItem(owned);assert.ok(item);assert.ok(!owned.includes(c.itemKey(item)));owned.push(c.itemKey(item));}
assert.equal(c.drawItem(owned),null);assert.deepEqual(c.spinOdds(owned),[]);
assert.equal(c.ticketsFor(99,1,0),0);assert.equal(c.ticketsFor(100,1,0),1);assert.equal(c.ticketsFor(300,1,1),2);assert.equal(c.ticketsFor(0,4,2),1);assert.equal(c.ticketsFor(200,4,2),1);
assert.deepEqual(c.parseCosmetics('{bad').equipped,c.DEFAULT_LOADOUT);
assert.equal(c.parseCosmetics({owned:[],equipped:{topi:'mahkota'}}).equipped.topi,'peran');
for(const role of ['Penjaga','Peramu','Penjelajah'])for(const item of c.ITEMS){
 const outfit={...c.DEFAULT_LOADOUT,[item.slot]:item.id};const rig=a.createAvatar({name:'QA',role,color:'#8baf9c',bed:'QA',outfit});
 rig.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(rig.root);assert.ok(bounds.min.y>=-.02);assert.ok(bounds.max.y<2.6);assert.ok(bounds.max.x-bounds.min.x<2.4,'Wide accessories must stay within the preview-fit envelope');
 if(item.slot==='baju')assert.equal('#'+rig.root.getObjectByName('Tunik linen').material.color.getHexString(),item.color);
 if(item.slot==='celana')assert.equal('#'+rig.root.getObjectByName('Celana').material.color.getHexString(),item.color);
 a.animateAvatar(rig,.5,true);a.disposeAvatar(rig.root);
}
console.log('PASS: catalog, starter unlocks, weighted odds, no duplicate draws, full collection, ticket milestones, locked equipment validation and 90 role/item model combinations.');

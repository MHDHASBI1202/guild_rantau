import assert from 'node:assert/strict';
import { loadGameModules } from './load-game-modules.mjs';

const { roles, cosmetics } = await loadGameModules();

console.log('Testing subroles definitions and functions...');

// 1. All 6 roles exist and have Indonesian subroles
const expectedRoles = ['Penjaga', 'Peramu', 'Penjelajah', 'Perajin', 'Petani', 'Penyihir'];
assert.equal(roles.ROLE_OPTIONS.length, 6, 'Should have exactly 6 roles');

for (const roleName of expectedRoles) {
  const role = roles.ROLE_OPTIONS.find(r => r.name === roleName);
  assert.ok(role, `Role ${roleName} must exist`);
  assert.ok(Array.isArray(role.subroles), `Role ${roleName} must have subroles array`);
  assert.equal(role.subroles.length, 3, `Role ${roleName} must have exactly 3 subroles`);

  for (const s of role.subroles) {
    assert.ok(typeof s.name === 'string' && s.name.length > 0, `Subrole name must be non-empty`);
    assert.ok(typeof s.desc === 'string' && s.desc.length > 0, `Subrole desc must be non-empty`);
    console.log(`  [${roleName}] ${s.name}: ${s.desc}`);
  }
}

// 2. Test getSubrolesForRole
for (const roleName of expectedRoles) {
  const subroles = roles.getSubrolesForRole(roleName);
  assert.equal(subroles.length, 3);
}
assert.equal(roles.getSubrolesForRole('UnknownRole').length, 0);

// 3. Test defaultSubrole
assert.equal(roles.defaultSubrole('Penjaga'), 'Ksatria Pelindung');
assert.equal(roles.defaultSubrole('Peramu'), 'Ahli Obat Rimba');
assert.equal(roles.defaultSubrole('Penjelajah'), 'Perintis Jalur');
assert.equal(roles.defaultSubrole('Perajin'), 'Tukang Kayu');
assert.equal(roles.defaultSubrole('Petani'), 'Penanam Pangan');
assert.equal(roles.defaultSubrole('Penyihir'), 'Penyihir Elemen');
assert.equal(roles.defaultSubrole('Unknown'), '');

// 4. Test validSubrole
assert.equal(roles.validSubrole('Penyihir', 'Penyihir Elemen'), true);
assert.equal(roles.validSubrole('Penyihir', 'Penyembuh Roh'), true);
assert.equal(roles.validSubrole('Penyihir', 'Penenun Mantra'), true);
assert.equal(roles.validSubrole('Penyihir', 'InvalidSubrole'), false);
assert.equal(roles.validSubrole('Penyihir', ''), false);

// 5. Test parseCosmetics preserves subrole
const parsedWithSubrole = cosmetics.parseCosmetics(JSON.stringify({
  equipped: { topi: 'peran' },
  subrole: 'Penyembuh Roh'
}));
assert.equal(parsedWithSubrole.subrole, 'Penyembuh Roh');

const parsedWithoutSubrole = cosmetics.parseCosmetics(JSON.stringify({
  equipped: { topi: 'peran' }
}));
assert.equal(parsedWithoutSubrole.subrole, undefined);

console.log('PASS: All 6 roles with Indonesian subroles, defaults, fallback validation, and cosmetics preservation verified.');

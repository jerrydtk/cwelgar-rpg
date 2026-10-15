const assert = require('assert');
const Rpg = require('./witcher-rpg');

assert.deepStrictEqual(Rpg.resolvePvPRound('obrona', 'atak'), { ok: true, winner: 1, draw: false });
assert.deepStrictEqual(Rpg.resolvePvPRound('atak', 'znak'), { ok: true, winner: 1, draw: false });
assert.deepStrictEqual(Rpg.resolvePvPRound('znak', 'obrona'), { ok: true, winner: 1, draw: false });
assert.deepStrictEqual(Rpg.resolvePvPRound('atak', 'atak'), { ok: true, winner: 0, draw: true });
assert.deepStrictEqual(Rpg.resolvePvPRound('nieznany', 'atak'), { ok: false, reason: 'action' });
const pvpWinner = { coins: 10 };
const pvpLoser = { coins: 250 };
assert.deepStrictEqual(Rpg.settlePvP(pvpWinner, pvpLoser, 2, 1), { ok: true, reward: 25 });
assert.strictEqual(pvpWinner.coins, 35);
assert.strictEqual(pvpLoser.coins, 225);
const cappedPvpLoser = { coins: 5000 };
assert.deepStrictEqual(Rpg.settlePvP(pvpWinner, cappedPvpLoser, 3, 0), { ok: true, reward: Rpg.PVP_REWARD_CAP });
assert.strictEqual(cappedPvpLoser.coins, 5000 - Rpg.PVP_REWARD_CAP);
assert.deepStrictEqual(Rpg.settlePvP(pvpWinner, pvpLoser, 1, 1), { ok: false, reason: 'draw', reward: 0 });
const pvpRecord = Rpg.ensureCharacter({});
const pvpOpponent = Rpg.ensureCharacter({});
assert.deepStrictEqual(pvpRecord.pvpStats, { wins: 0, losses: 0, draws: 0, rating: Rpg.PVP_STARTING_RATING });
assert.deepStrictEqual(Rpg.recordPvPMatch(pvpRecord, pvpOpponent, 2, 1), {
  ok: true,
  firstRatingChange: 16,
  secondRatingChange: -16
});
assert.deepStrictEqual(pvpRecord.pvpStats, { wins: 1, losses: 0, draws: 0, rating: 1016 });
assert.deepStrictEqual(pvpOpponent.pvpStats, { wins: 0, losses: 1, draws: 0, rating: 984 });
assert.deepStrictEqual(Rpg.recordPvPMatch(pvpRecord, pvpOpponent, 1, 1), {
  ok: true,
  firstRatingChange: -1,
  secondRatingChange: 1
});
assert.deepStrictEqual(pvpRecord.pvpStats, { wins: 1, losses: 0, draws: 1, rating: 1015 });
assert.deepStrictEqual(pvpOpponent.pvpStats, { wins: 0, losses: 1, draws: 1, rating: 985 });
assert.strictEqual(Rpg.canPlayRankedPvP(undefined, 1000), true);
assert.strictEqual(Rpg.PVP_RANKED_MATCH_COOLDOWN, 2 * 60 * 60 * 1000);
assert.strictEqual(Rpg.canPlayRankedPvP(1000, 1000 + Rpg.PVP_RANKED_MATCH_COOLDOWN - 1), false);
assert.strictEqual(Rpg.canPlayRankedPvP(1000, 1000 + Rpg.PVP_RANKED_MATCH_COOLDOWN), true);

function selectedCharacter(user = {}, username) {
  const character = Rpg.ensureCharacter(user, username);
  if (!character.school) Rpg.chooseSchool(character, 'wilczej_szkoly');
  return character;
}

const restedCharacter = Rpg.ensureCharacter({ witcher: {
  coins: 150,
  level: 1,
  health: 80,
  lastHealthUpdateAt: 1000,
  school: 'wilczej_szkoly',
  inventory: {},
  equipment: {},
  starterKitGranted: true,
  activeActivity: null
} }, undefined, 121000);
assert.strictEqual(restedCharacter.health, 81);
assert.strictEqual(restedCharacter.lastHealthUpdateAt, 121000);
assert.strictEqual(Rpg.HEALTH_REGEN_PER_MINUTE, 0.5);
const griffinSchool = Rpg.WITCHER_SCHOOLS.find(school => school.id === 'gryfa');
const manticoreSchool = Rpg.WITCHER_SCHOOLS.find(school => school.id === 'mantikory');
assert.deepStrictEqual(
  [griffinSchool.attack, griffinSchool.defense, griffinSchool.healthRegenBonus],
  [1, 2, 0.1]
);
assert.deepStrictEqual(
  [manticoreSchool.attack, manticoreSchool.defense, manticoreSchool.critChance, manticoreSchool.healingBonus],
  [2, 1, 0, 0.05]
);
const griffinRestedCharacter = Rpg.ensureCharacter({ witcher: {
  coins: 150,
  level: 1,
  health: 80,
  lastHealthUpdateAt: 1000,
  school: 'gryfa',
  inventory: {},
  equipment: {},
  starterKitGranted: true,
  activeActivity: null
} }, undefined, 121000);
assert.strictEqual(griffinRestedCharacter.health, 81.2);

const restingDuringActivity = Rpg.ensureCharacter({ witcher: {
  coins: 150,
  level: 1,
  health: 80,
  lastHealthUpdateAt: 1000,
  school: 'wilczej_szkoly',
  inventory: {},
  equipment: {},
  starterKitGranted: true,
  activeActivity: { kind: 'hunt', activityId: 'bory', finishesAt: 500000 }
} }, undefined, 121000);
assert.strictEqual(restingDuringActivity.health, 80);
assert.strictEqual(restingDuringActivity.lastHealthUpdateAt, 1000);

const herbalGatherer = selectedCharacter();
const firstGather = Rpg.startHerbGathering(herbalGatherer, 10000);
assert.strictEqual(firstGather.ok, true);
assert.strictEqual(firstGather.duration, 15 * 60 * 1000);
assert.deepStrictEqual(herbalGatherer.inventory, {
  srebrny_miecz: 1,
  miecz_stalowy: 1
});
assert.strictEqual(Rpg.startHerbGathering(herbalGatherer, 10001).reason, 'busy');
assert.strictEqual(Rpg.completeActivity(herbalGatherer, firstGather.finishesAt - 1), null);
const gatheredHerbs = Rpg.completeActivity(herbalGatherer, firstGather.finishesAt, () => 0);
assert.deepStrictEqual(gatheredHerbs.herbs, [
  { id: 'ziola', count: 2 },
  { id: 'korzen_mandragory', count: 1 }
]);
assert.strictEqual(herbalGatherer.inventory.ziola, 2);
assert.strictEqual(herbalGatherer.inventory.korzen_mandragory, 1);
assert.strictEqual(Rpg.startHerbGathering(herbalGatherer, firstGather.finishesAt + 1).reason, 'cooldown');
assert.strictEqual(
  Rpg.getHerbalismStatus(herbalGatherer, 10000 + Rpg.HERBALISM_COOLDOWN).cooldownRemaining,
  0
);
herbalGatherer.inventory.ziola++;
assert.strictEqual(Rpg.craftItem(herbalGatherer, Rpg.CRAFTING_RECIPES.napar_mandragory.name).ok, true);
herbalGatherer.health = 50;
assert.strictEqual(Rpg.useItem(herbalGatherer, Rpg.ITEMS.napar_mandragory.name).health, 95);
const doubleHealer = selectedCharacter({ witcher: {
  name: 'Ratownik',
  coins: 0,
  xp: 0,
  level: 1,
  health: 20,
  inventory: { jaskolka: 2 },
  equipment: { weapon: null, armor: null },
  starterKitGranted: true,
  activeActivity: null
} });
const doubleHeal = Rpg.useItem(doubleHealer, 'jaskolka', 2);
assert.strictEqual(doubleHeal.quantity, 2);
assert.strictEqual(doubleHeal.healed, 70);
assert.strictEqual(doubleHealer.health, 90);
assert.strictEqual(doubleHealer.inventory.jaskolka, 0);
doubleHealer.inventory.jaskolka = 2;
const cappedHeal = Rpg.useItem(doubleHealer, 'jaskolka', 2);
assert.strictEqual(cappedHeal.quantity, 1);
assert.strictEqual(cappedHeal.healed, 10);
assert.strictEqual(doubleHealer.inventory.jaskolka, 1);
assert.strictEqual(doubleHealer.toxicity, 0);
assert.strictEqual(Rpg.craftItem(herbalGatherer, 'wywar_lesny').reason, 'herbalism');

const masterHerbalist = selectedCharacter();
masterHerbalist.herbalism.level = Rpg.HERBALISM_MAX_LEVEL;
const masterGather = Rpg.startHerbGathering(masterHerbalist, 10000);
const masterGatherResult = Rpg.completeActivity(masterHerbalist, masterGather.finishesAt, () => 0);
assert.deepStrictEqual(masterGatherResult.herbs, [
  { id: 'ziola', count: 2 },
  { id: 'korzen_mandragory', count: 1 },
  { id: 'glistnik', count: 1 },
  { id: 'werbena', count: 1 },
  { id: 'oko_kruka', count: 1 },
  { id: 'tojad', count: 1 }
]);
masterHerbalist.inventory.oko_kruka = 2;
masterHerbalist.inventory.glistnik = 3;
masterHerbalist.inventory.werbena = 3;
masterHerbalist.inventory.korzen_mandragory = 1;
masterHerbalist.inventory.tojad = 2;
masterHerbalist.inventory.esencja_upiora = 3;
assert.strictEqual(Rpg.craftItem(masterHerbalist, 'kocie_oko').ok, true);
assert.strictEqual(Rpg.useItem(masterHerbalist, 'kocie_oko').combatBuff.critChance, 0.12);
masterHerbalist.combatBuff = null;
assert.strictEqual(Rpg.craftItem(masterHerbalist, 'wywar_lesny').ok, true);
assert.strictEqual(Rpg.craftItem(masterHerbalist, 'czarna_krew').ok, true);
assert.strictEqual(Rpg.craftItem(masterHerbalist, 'biala_mewa').ok, true);
for (const itemId of ['wywar_lesny', 'czarna_krew', 'biala_mewa']) {
  assert.strictEqual(Rpg.useItem(masterHerbalist, itemId).ok, true);
  masterHerbalist.combatBuff = null;
  masterHerbalist.toxicity = 0;
  masterHerbalist.lastToxicityUpdateAt = Date.now();
}
const manticoreHealer = selectedCharacter();
manticoreHealer.school = 'mantikory';
manticoreHealer.health = 50;
manticoreHealer.inventory.jaskolka = 1;
assert.strictEqual(Rpg.useItem(manticoreHealer, 'jaskolka').healed, 37);
assert.strictEqual(manticoreHealer.health, 87);

const herbalistInTheField = selectedCharacter();
herbalistInTheField.activeActivity = { kind: 'hunt', activityId: 'bory', finishesAt: 2000000 };
assert.strictEqual(Rpg.startHerbGathering(herbalistInTheField, 10000).reason, 'busy');

const progressingHerbalist = selectedCharacter();
for (let harvest = 0; harvest < 4; harvest++) {
  const harvestTime = 1000 + harvest * Rpg.HERBALISM_COOLDOWN;
  const gathering = Rpg.startHerbGathering(progressingHerbalist, harvestTime);
  assert.strictEqual(gathering.ok, true);
  assert.strictEqual(Rpg.completeActivity(progressingHerbalist, gathering.finishesAt, () => 0.99).kind, 'herbalism');
}
assert.deepStrictEqual(progressingHerbalist.herbalism, {
  level: 2,
  xp: 0,
  lastGatherAt: 1000 + 3 * Rpg.HERBALISM_COOLDOWN
});

const firstUser = { coins: 12, xp: 4, level: 1 };
const secondUser = {};
const first = Rpg.ensureCharacter(firstUser, 'Geralt');
const second = Rpg.ensureCharacter(secondUser, 'Ciri');

assert.strictEqual(first.name, 'Geralt');
assert.strictEqual(first.school, null);
assert.strictEqual(first.coins, 150);
assert.strictEqual(first.inventory.srebrny_miecz, 1);
assert.strictEqual(first.inventory.miecz_stalowy, 1);
assert.strictEqual(first.equipment.weapon, 'miecz_stalowy');
assert.strictEqual(first.equipment.steelWeapon, 'miecz_stalowy');
assert.strictEqual(first.equipment.silverWeapon, 'srebrny_miecz');
assert.strictEqual(first.starterKitGranted, true);
Rpg.ensureCharacter({ witcher: first });
assert.strictEqual(first.coins, 150);
assert.strictEqual(first.inventory.srebrny_miecz, 1);
assert.strictEqual(first.inventory.miecz_stalowy, 1);
const migratedSwordsman = Rpg.ensureCharacter({ witcher: {
  name: 'Stary profil',
  coins: 500,
  xp: 0,
  level: 5,
  health: 100,
  school: 'wilczej_szkoly',
  inventory: { miecz_stalowy: 1, srebrny_miecz: 1 },
  equipment: { weapon: 'miecz_stalowy', armor: null },
  starterKitGranted: true,
  activeActivity: null
} });
assert.strictEqual(migratedSwordsman.equipment.steelWeapon, 'miecz_stalowy');
assert.strictEqual(migratedSwordsman.equipment.silverWeapon, 'srebrny_miecz');
assert.strictEqual(Rpg.selectCombatWeapon(migratedSwordsman, 'wilki'), Rpg.ITEMS.miecz_stalowy);
assert.strictEqual(Rpg.selectCombatWeapon(migratedSwordsman, 'humans'), Rpg.ITEMS.miecz_stalowy);
assert.strictEqual(Rpg.selectCombatWeapon(migratedSwordsman, 'nekkerzy'), Rpg.ITEMS.srebrny_miecz);
assert.strictEqual(Rpg.selectCombatWeapon(migratedSwordsman, null), Rpg.ITEMS.srebrny_miecz);
migratedSwordsman.equipment.steelWeapon = 'miecz_stalowy_legendarny';
migratedSwordsman.equipment.weapon = 'miecz_stalowy_legendarny';
assert.strictEqual(Rpg.selectCombatWeapon(migratedSwordsman, null), Rpg.ITEMS.miecz_stalowy_legendarny);
assert.strictEqual(Rpg.selectCombatWeapon(migratedSwordsman, 'nekkerzy'), Rpg.ITEMS.srebrny_miecz);
const silverEquippedProfile = Rpg.ensureCharacter({ witcher: {
  name: 'Srebrny profil',
  coins: 500,
  xp: 0,
  level: 5,
  health: 100,
  school: 'wilczej_szkoly',
  inventory: { miecz_stalowy: 1, miecz_stalowy_kaedwenski: 1 },
  equipment: { weapon: 'miecz_srebrny_mahakamski', armor: null },
  starterKitGranted: true,
  activeActivity: null
} });
assert.strictEqual(silverEquippedProfile.equipment.silverWeapon, 'miecz_srebrny_mahakamski');
assert.strictEqual(silverEquippedProfile.equipment.steelWeapon, 'miecz_stalowy_kaedwenski');
assert.strictEqual(Rpg.equipItem(silverEquippedProfile, 'miecz_stalowy_kaedwenski').ok, true);
assert.strictEqual(silverEquippedProfile.equipment.steelWeapon, 'miecz_stalowy_kaedwenski');
assert.strictEqual(silverEquippedProfile.equipment.silverWeapon, 'miecz_srebrny_mahakamski');
assert.strictEqual(Rpg.startActivity(first, 'mission', 'gosciniec').reason, 'school');
assert.strictEqual(Rpg.buyItem(first, 'srebrny_miecz').reason, 'school');
assert.strictEqual(Rpg.chooseSchool(first, 'nieistniejaca').reason, 'unknown');
assert.strictEqual(Rpg.chooseSchool(first, 'wilczej_szkoly').ok, true);
assert.strictEqual(Rpg.chooseSchool(first, 'gryfa').reason, 'chosen');
assert.strictEqual(Rpg.chooseSchool(second, 'kota').ok, true);
const wolfSchoolChooser = Rpg.ensureCharacter({});
assert.strictEqual(Rpg.chooseSchool(wolfSchoolChooser, 'wilk').school.id, 'wilczej_szkoly');
assert.strictEqual(Rpg.chooseSchool(Rpg.ensureCharacter({}), 'Szkoła Wilka').school.id, 'wilczej_szkoly');
assert.strictEqual(first.coins, 150);
assert.strictEqual(firstUser.coins, 12);
first.coins += 10;
assert.strictEqual(second.coins, 150);

const leveling = selectedCharacter();
leveling.xp = 90;
assert.strictEqual(Rpg.addProgress(leveling, 0, 20), 1);
assert.strictEqual(leveling.level, 2);
assert.strictEqual(leveling.xp, 10);

const beginner = selectedCharacter();
assert.strictEqual(Rpg.startActivity(beginner, 'mission', 'gosciniec', 500).ok, true);
const beginnerHunt = selectedCharacter();
assert.strictEqual(Rpg.startActivity(beginnerHunt, 'hunt', 'bory', 500).requiredLevel, 3);
const beginnerHuntStatus = Rpg.getHuntStatus(beginnerHunt, 'bory');
assert.strictEqual(beginnerHuntStatus.available, false);
assert.strictEqual(beginnerHuntStatus.levelMet, false);
assert.strictEqual(beginnerHuntStatus.requiredLevel, 3);

assert.ok(Object.values(Rpg.MISSIONS).every(mission => mission.duration <= 120 * 60 * 1000));
assert.strictEqual(Object.keys(Rpg.MISSIONS).length, 45);
assert.strictEqual(Object.keys(Rpg.HUNTS).length, 20);
const missionDropIds = Object.values(Rpg.MISSIONS).map(mission => mission.loot[0]);
assert.strictEqual(new Set(missionDropIds).size, 45);
assert.ok(Object.values(Rpg.MISSIONS).every(mission => Rpg.SELLABLE_ITEMS[mission.loot[0]]?.price <= 70));
assert.ok(Object.values(Rpg.MISSIONS).every(mission => !mission.boss && mission.monsterType && mission.trophy && Rpg.TROPHIES[mission.trophy]));
assert.ok(Object.values(Rpg.HUNTS).every(hunt => hunt.boss && hunt.trophy && Rpg.TROPHIES[hunt.trophy]));
assert.ok(Object.values(Rpg.HUNTS).every(hunt => Number.isInteger(hunt.requiredLevel) && hunt.requiredLevel > 1));
for (const activityId of Object.keys(Rpg.MISSIONS)) {
	const novice = selectedCharacter();
	assert.strictEqual(Rpg.startActivity(novice, 'mission', activityId).ok, true);
}
const noviceDettlaffHunter = selectedCharacter();
const noviceDettlaffTrip = Rpg.startActivity(noviceDettlaffHunter, 'mission', 'dettlaff_toussaint', 0);
assert.strictEqual(Rpg.completeActivity(noviceDettlaffHunter, noviceDettlaffTrip.finishesAt, () => 0.5).victory, false);
const readyDettlaffHunter = selectedCharacter();
readyDettlaffHunter.level = Rpg.MISSIONS.dettlaff_toussaint.recommendedLevel;
const readyDettlaffTrip = Rpg.startActivity(readyDettlaffHunter, 'mission', 'dettlaff_toussaint', 0);
assert.strictEqual(Rpg.completeActivity(readyDettlaffHunter, readyDettlaffTrip.finishesAt, () => 0.5).victory, true);
assert.strictEqual(Rpg.HUNTS.bory.duration, 2 * 60 * 60 * 1000);
assert.strictEqual(Rpg.HUNTS.bagna.duration, 4 * 60 * 60 * 1000);
assert.strictEqual(Rpg.HUNTS.przelecz.duration, 8 * 60 * 60 * 1000);
assert.deepStrictEqual([Rpg.HUNTS.bory.requiredLevel, Rpg.HUNTS.bagna.requiredLevel, Rpg.HUNTS.przelecz.requiredLevel], [3, 8, 15]);
assert.deepStrictEqual([Rpg.HUNTS.bory.xp, Rpg.HUNTS.bagna.xp, Rpg.HUNTS.przelecz.xp], [120, 320, 700]);
assert.deepStrictEqual(
  ['polnocne_szlaki', 'ruiny_toussaint', 'ostatni_pochod'].map(id => Rpg.HUNTS[id].requiredLevel),
  [20, 25, 30]
);
assert.deepStrictEqual(
  ['serce_pustkowi', 'czarny_sztorm', 'koniec_swiata', 'ostatnia_wyprawa'].map(id => Rpg.HUNTS[id].requiredLevel),
  [35, 40, 45, 50]
);
assert.strictEqual(Rpg.HUNT_PROGRESSION.length, Object.keys(Rpg.HUNTS).length);
assert.ok(Rpg.HUNT_PROGRESSION.every((id, index, progression) =>
  index === 0 || Rpg.HUNTS[progression[index - 1]].requiredLevel <= Rpg.HUNTS[id].requiredLevel
));
assert.ok(Object.values(Rpg.HUNTS).every(hunt => Rpg.TROPHIES[hunt.trophy]));
assert.ok(Rpg.HUNTS.bory.trophyChance > Rpg.MISSIONS.gryf.trophyChance);
assert.ok(Rpg.HUNTS.bagna.trophyChance > Rpg.MISSIONS.upiory.trophyChance);
assert.strictEqual(Rpg.ITEMS.zbroja_temerska_kurtka.defense, 8);
for (const school of ['wilczej_szkoly', 'gryfa', 'niedzwiedzia', 'kota', 'zmiji', 'mantikory']) {
  const mastercraftedSword = Rpg.ITEMS[`miecz_${school}_mistrzowski`];
  const mastercraftedArmor = Rpg.ITEMS[`zbroja_${school}_mistrzowski`];
  assert.strictEqual(mastercraftedSword.requiredLevel, 30);
  assert.strictEqual(mastercraftedArmor.requiredLevel, 30);
  assert.strictEqual(mastercraftedSword.quality, 'Mistrzowski');
  assert.ok(mastercraftedSword.attack > Rpg.ITEMS[`miecz_${school}_podstawowy`].attack);
  assert.ok(mastercraftedArmor.defense > Rpg.ITEMS[`zbroja_${school}_podstawowy`].defense);
  for (const [tier, requiredLevel] of [['wielkiego_mistrza', 40], ['legendarny', 50]]) {
    const sword = Rpg.ITEMS[`miecz_${school}_${tier}`];
    const armor = Rpg.ITEMS[`zbroja_${school}_${tier}`];
    assert.strictEqual(sword.requiredLevel, requiredLevel);
    assert.strictEqual(armor.requiredLevel, requiredLevel);
  }
}
assert.strictEqual(Rpg.ITEMS.miecz_srebrny_arcymistrzowski.requiredLevel, 30);
assert.strictEqual(Rpg.ITEMS.miecz_stalowy_arcymistrzowski.requiredLevel, 30);
assert.strictEqual(Rpg.ITEMS.zbroja_reliktowa.requiredLevel, 30);
assert.strictEqual(Rpg.ITEMS.miecz_srebrny_wielkiego_mistrza.requiredLevel, 40);
assert.strictEqual(Rpg.ITEMS.miecz_stalowy_legendarny.requiredLevel, 50);
assert.strictEqual(Rpg.ITEMS.zbroja_legendarny_lowiec.requiredLevel, 50);
for (const legacyId of [
  'miecz_wilczej_szkoly', 'zbroja_wilczej_szkoly', 'miecz_greif',
  'zbroja_greif', 'miecz_niedzwiedzia', 'zbroja_niedzwiedzia'
]) {
  assert.strictEqual(Rpg.ITEMS[legacyId], undefined);
}
const legacyGearOwner = Rpg.ensureCharacter({ witcher: {
  name: 'Weteran dawnych wpisów',
  coins: 0,
  xp: 0,
  level: 10,
  health: 100,
  school: 'gryfa',
  inventory: { miecz_greif: 1, miecz_gryfa_ulepszony: 2 },
  equipment: { weapon: 'miecz_greif', armor: 'zbroja_greif' },
  activeActivity: null
} });
assert.strictEqual(legacyGearOwner.coins, 150);
assert.strictEqual(legacyGearOwner.inventory.srebrny_miecz, 1);
assert.strictEqual(legacyGearOwner.inventory.miecz_stalowy, 1);
assert.strictEqual(legacyGearOwner.inventory.miecz_gryfa_ulepszony, 3);
assert.strictEqual(legacyGearOwner.inventory.miecz_greif, undefined);
assert.strictEqual(legacyGearOwner.equipment.weapon, 'miecz_gryfa_ulepszony');
assert.strictEqual(legacyGearOwner.equipment.armor, 'zbroja_gryfa_ulepszony');
Rpg.ensureCharacter({ witcher: legacyGearOwner });
assert.strictEqual(legacyGearOwner.coins, 150);
assert.strictEqual(legacyGearOwner.inventory.srebrny_miecz, 1);
const level50 = Rpg.ensureCharacter({});
const xpToLevel50 = Array.from({ length: 49 }, (_, index) => Rpg.xpToNextLevel(index + 1)).reduce((sum, xp) => sum + xp, 0);
Rpg.addProgress(level50, 0, xpToLevel50);
assert.strictEqual(level50.level, 50);
assert.strictEqual(level50.xp, 0);
assert.strictEqual(Rpg.MAX_LEVEL, 50);
const cappedProgress = Rpg.addProgress(level50, 25, 5000);
assert.strictEqual(cappedProgress, 0);
assert.strictEqual(level50.level, 50);
assert.strictEqual(level50.xp, 0);
assert.strictEqual(level50.coins, 175);
const previouslyOverLevelled = Rpg.ensureCharacter({ witcher: {
  name: 'Dawny weteran',
  coins: 0,
  xp: 500,
  level: 35,
  health: 100,
  school: 'wilczej_szkoly',
  inventory: {},
  equipment: { weapon: null, armor: null },
  starterKitGranted: true
} });
assert.strictEqual(previouslyOverLevelled.level, 35);
assert.strictEqual(previouslyOverLevelled.xp, 500);
const migratedHuntProgress = Rpg.ensureCharacter({ witcher: {
  name: 'Łowca z zapiskami',
  coins: 0,
  xp: 0,
  level: 1,
  health: 100,
  school: 'wilczej_szkoly',
  inventory: {},
  equipment: { weapon: null, armor: null },
  completedHunts: ['bory', 'bory', 'nieistniejaca']
} });
assert.deepStrictEqual(migratedHuntProgress.completedHunts, ['bory']);
assert.deepStrictEqual(migratedHuntProgress.pvpStats, {
  wins: 0,
  losses: 0,
  draws: 0,
  rating: Rpg.PVP_STARTING_RATING
});
assert.strictEqual(Rpg.getHuntStatus(migratedHuntProgress, 'bory').completed, true);
assert.strictEqual(Rpg.getHuntStatus(migratedHuntProgress, Rpg.HUNT_PROGRESSION[1]).unlocked, true);
assert.strictEqual(Rpg.getHuntStatus(migratedHuntProgress, Rpg.HUNT_PROGRESSION[2]).unlocked, false);

const randomMissionCharacter = selectedCharacter();
randomMissionCharacter.level = 50;
const recentRandomMissions = new Set();
for (let index = 0; index < 4; index++) {
  const randomMission = Rpg.startRandomMission(randomMissionCharacter, index * 100000, () => 0);
  assert.strictEqual(randomMission.ok, true);
  assert.ok(Math.abs(randomMission.activity.recommendedLevel - randomMissionCharacter.level) <= 5);
  assert.ok(!recentRandomMissions.has(randomMission.activityId));
  recentRandomMissions.add(randomMission.activityId);
  assert.ok(randomMission.duration >= randomMission.activity.duration * 0.8);
  assert.ok(randomMission.duration <= randomMission.activity.duration * 1.2);
  assert.strictEqual(randomMission.duration % 60000, 0);
  randomMissionCharacter.activeActivity = null;
}
assert.strictEqual(randomMissionCharacter.recentMissionIds.length, 3);
randomMissionCharacter.activeActivity = { kind: 'mission', activityId: 'gosciniec', finishesAt: 1000 };
const busyRandomMission = Rpg.startRandomMission(randomMissionCharacter, 0, () => 0);
assert.strictEqual(busyRandomMission.reason, 'busy');
for (let level = 1; level <= Rpg.MAX_LEVEL; level++) {
  const levelCharacter = selectedCharacter();
  levelCharacter.level = level;
  const assignment = Rpg.startRandomMission(levelCharacter, 0, () => 0);
  assert.strictEqual(assignment.ok, true);
  assert.ok(Math.abs(assignment.activity.recommendedLevel - level) <= (level <= 5 ? 3 : 5));
  assert.ok(assignment.activity.recommendedLevel <= level + (level <= 5 ? 3 : 2));
}

const gryphon = Rpg.ensureCharacter({});
gryphon.coins = 10000;
gryphon.level = 5;
assert.strictEqual(Rpg.chooseSchool(gryphon, 'gryfa').ok, true);
assert.strictEqual(Rpg.buyItem(gryphon, 'miecz_wilczej_szkoly_podstawowy').reason, 'school');
assert.strictEqual(Rpg.buyItem(gryphon, 'miecz_gryfa_podstawowy').ok, true);
assert.strictEqual(Rpg.equipItem(gryphon, 'miecz_gryfa_podstawowy').ok, true);
assert.strictEqual(Rpg.buyItem(gryphon, 'miecz_stalowy_kaedwenski').ok, true);
assert.strictEqual(Rpg.buyItem(gryphon, 'zbroja_temerska_kurtka').ok, true);
assert.strictEqual(Rpg.equipItem(gryphon, 'zbroja_temerska_kurtka').ok, true);
assert.strictEqual(Rpg.ITEMS.jaskolka_wzmocniona.heal, 60);
assert.strictEqual(Rpg.ITEMS.biala_rafard.heal, 100);
assert.strictEqual(Rpg.CRAFTING_RECIPES.mutageny.randomItems.length, 15);
const alchemist = selectedCharacter({ witcher: {
  name: 'Alchemik',
  coins: 150,
  xp: 0,
  level: 1,
  health: 100,
  school: 'wilczej_szkoly',
  inventory: { mutagen: 2 },
  equipment: { weapon: null, armor: null },
  activeActivity: null,
  starterKitGranted: true
} });
assert.strictEqual(Rpg.craftItem(alchemist, 'mutageny', () => 0).reason, 'ingredients');
assert.strictEqual(alchemist.inventory.mutagen, 2);
alchemist.inventory.mutagen = 3;
const craftedMutagen = Rpg.craftItem(alchemist, 'mutageny', () => 0);
assert.strictEqual(craftedMutagen.itemId, 'mutagen_czerwony_1');
assert.strictEqual(alchemist.inventory.mutagen, 0);
assert.strictEqual(Rpg.useItem(alchemist, craftedMutagen.itemId).reason, 'equip');
assert.strictEqual(Rpg.equipItem(alchemist, craftedMutagen.itemId).ok, true);
assert.strictEqual(alchemist.inventory[craftedMutagen.itemId], 0);
assert.strictEqual(Rpg.getMutationBonuses(alchemist).attack, 1);
alchemist.inventory.mutagen_czerwony_2 = 5;
alchemist.inventory.mutagen_czerwony_3 = 1;
alchemist.inventory.mutagen_zielony_1 = 1;
alchemist.inventory.mutagen_zielony_2 = 1;
alchemist.inventory.mutagen_niebieski_1 = 1;
for (const id of [
  'mutagen_czerwony_2',
  'mutagen_czerwony_3',
  'mutagen_zielony_1',
  'mutagen_zielony_2',
  'mutagen_niebieski_1'
]) {
  assert.strictEqual(Rpg.equipItem(alchemist, id).ok, true);
}
assert.strictEqual(alchemist.equippedMutagens.length, 6);
assert.strictEqual(Rpg.equipItem(alchemist, 'mutagen_czerwony_2').reason, 'slots');
assert.strictEqual(alchemist.inventory.mutagen_czerwony_2, 4);
assert.strictEqual(Rpg.getMutationBonuses(alchemist).attack, 6);
assert.strictEqual(Rpg.removeMutagen(alchemist, 'mutagen_czerwony_2').ok, true);
assert.strictEqual(alchemist.equippedMutagens.length, 5);
assert.strictEqual(alchemist.inventory.mutagen_czerwony_2, 5);
assert.strictEqual(Rpg.equipItem(alchemist, 'mutagen_czerwony_2').ok, true);
assert.strictEqual(alchemist.equippedMutagens.length, 6);
assert.strictEqual(alchemist.inventory.mutagen_czerwony_2, 4);
alchemist.inventory.esencja_upiora = 1;
alchemist.inventory.pioro_gryfa = 1;
alchemist.inventory.ziola = 2;
const craftedThunderbolt = Rpg.craftItem(alchemist, 'grom');
assert.strictEqual(craftedThunderbolt.itemId, 'grom');
assert.strictEqual(Rpg.useItem(alchemist, 'grom').ok, true);
assert.strictEqual(Rpg.useItem(alchemist, 'grom').reason, 'missing');
const buffedTrip = Rpg.startActivity(alchemist, 'mission', 'gosciniec', 1000);
const buffedResult = Rpg.completeActivity(alchemist, buffedTrip.finishesAt, () => 0);
assert.strictEqual(buffedResult.combatBuffUsed, 'Eliksir Grom');
assert.strictEqual(buffedResult.toxicity, 25);
assert.strictEqual(alchemist.combatBuff, null);
const plainFighter = selectedCharacter({ witcher: {
  name: 'Bez eliksiru', coins: 150, xp: 0, level: 1, health: 100, school: 'wilczej_szkoly',
  inventory: {}, equipment: { weapon: null, armor: null }, activeActivity: null, starterKitGranted: true
} });
const plainTrip = Rpg.startActivity(plainFighter, 'mission', 'gosciniec', 1000);
const plainResult = Rpg.completeActivity(plainFighter, plainTrip.finishesAt, () => 0);
assert.ok(buffedResult.damageDealt > plainResult.damageDealt);
assert.ok(plainResult.combatLog.length > 0);
alchemist.inventory.esencja_upiora = 2;
alchemist.inventory.ziola = 4;
const craftedPuszczyk = Rpg.craftItem(alchemist, 'puszczyk');
assert.strictEqual(craftedPuszczyk.itemId, 'puszczyk');
assert.strictEqual(Rpg.craftItem(alchemist, 'puszczyk').itemId, 'puszczyk');
const puszczykDose = Rpg.useItem(alchemist, 'puszczyk', 2, 1000);
assert.strictEqual(puszczykDose.ok, true);
assert.strictEqual(puszczykDose.combatBuff.critChance, 0.16);
assert.strictEqual(puszczykDose.combatBuff.defense, 4);
assert.strictEqual(puszczykDose.toxicity, 75);
assert.strictEqual(puszczykDose.combatBuff.name, 'Eliksir Puszczyk ×2');
assert.strictEqual(Rpg.buyItem(alchemist, 'puszczyk').reason, 'craft');
assert.strictEqual(Rpg.CRAFTING_RECIPES.olej.output, 'olej_wiedzminski');
alchemist.inventory.wilcza_skora = 1;
alchemist.inventory.zab_utopca = 2;
alchemist.inventory.ruda_srebra = 1;
const craftedOil = Rpg.craftItem(alchemist, 'olej');
assert.strictEqual(craftedOil.itemId, 'olej_wiedzminski');
assert.strictEqual(Rpg.useItem(alchemist, 'olej_wiedzminski', 1, 1000).reason, 'toxicity');
assert.strictEqual(alchemist.inventory.olej_wiedzminski, 1);
const toxicDose = selectedCharacter({ witcher: {
  name: 'Zatruty',
  coins: 0,
  xp: 0,
  level: 1,
  health: 100,
  inventory: { puszczyk: 3 },
  equipment: { weapon: null, armor: null },
  starterKitGranted: true,
  activeActivity: null
} });
const doseTime = Date.now();
toxicDose.toxicity = 50;
toxicDose.lastToxicityUpdateAt = doseTime;
const maximumDose = Rpg.useItem(toxicDose, 'puszczyk', 2, doseTime);
assert.strictEqual(maximumDose.toxicity, Rpg.MAX_TOXICITY);
assert.strictEqual(Rpg.useItem(toxicDose, 'puszczyk', 1, doseTime).reason, 'toxicity');
assert.strictEqual(toxicDose.inventory.puszczyk, 1);
const recoveringToxicDose = Rpg.ensureCharacter({ witcher: {
  name: 'Trzeźwiejący',
  coins: 0,
  xp: 0,
  level: 1,
  health: 100,
  toxicity: 80,
  lastToxicityUpdateAt: 1000,
  lastHealthUpdateAt: 1000,
  inventory: {},
  equipment: { weapon: null, armor: null, steelWeapon: null, silverWeapon: null },
  starterKitGranted: true,
  activeActivity: { kind: 'hunt', activityId: 'bory', finishesAt: 9999999 }
} }, undefined, 3601000);
assert.strictEqual(recoveringToxicDose.toxicity, 70);
const potionMaker = selectedCharacter();
potionMaker.inventory.ziola = 2;
potionMaker.inventory.esencja_upiora = 1;
assert.strictEqual(Rpg.craftItem(potionMaker, 'jaskolka_wzmocniona').reason, 'level');
assert.strictEqual(potionMaker.inventory.ziola, 2);
potionMaker.level = 5;
assert.strictEqual(Rpg.craftItem(potionMaker, 'jaskolka_wzmocniona').ok, true);
const advancedSupplies = selectedCharacter();
advancedSupplies.coins = 500;
advancedSupplies.level = 10;
advancedSupplies.health = 1;
assert.strictEqual(Rpg.buyItem(advancedSupplies, 'biala_rafard').ok, true);
assert.strictEqual(Rpg.useItem(advancedSupplies, 'biala_rafard').health, 100);

const batchAlchemist = selectedCharacter();
batchAlchemist.inventory.mutagen = 6;
const batchStart = Date.now();
batchAlchemist.dailyQuests = {
  startedAt: batchStart,
  resetAt: batchStart + Rpg.DAILY_QUEST_RESET,
  tasks: [{ id: 'craft', name: 'Alchemia', target: 2, progress: 0, claimed: false }]
};
const batchMutagens = Rpg.craftItem(batchAlchemist, 'mutageny', 2, () => 0);
assert.strictEqual(batchMutagens.ok, true);
assert.strictEqual(batchMutagens.quantity, 2);
assert.deepStrictEqual(batchMutagens.crafted, { mutagen_czerwony_1: 2 });
assert.strictEqual(batchAlchemist.inventory.mutagen, 0);
assert.strictEqual(batchAlchemist.dailyQuests.tasks[0].progress, 2);
batchAlchemist.inventory.mutagen = 5;
assert.strictEqual(Rpg.craftItem(batchAlchemist, 'mutageny', 2).reason, 'ingredients');
assert.strictEqual(batchAlchemist.inventory.mutagen, 5);
assert.strictEqual(Rpg.craftItem(batchAlchemist, 'mutageny', 101).reason, 'quantity');

const dailyCharacter = selectedCharacter();
dailyCharacter.dailyQuests = null;
const dailyStart = 10000;
const dailyBoard = Rpg.getDailyQuests(dailyCharacter, dailyStart, () => 0);
assert.deepStrictEqual(dailyBoard.tasks.map(task => task.id), ['mission', 'hunt', 'herbalism']);
dailyBoard.tasks[0].progress = dailyBoard.tasks[0].target;
dailyCharacter.level = 10;
const dailyClaim = Rpg.claimDailyQuest(dailyCharacter, 'mission', dailyStart + 1);
assert.strictEqual(dailyClaim.ok, true);
assert.strictEqual(dailyClaim.reward, 70);
assert.strictEqual(Rpg.claimDailyQuest(dailyCharacter, 'mission', dailyStart + 2).reason, 'claimed');
const nextDailyBoard = Rpg.getDailyQuests(dailyCharacter, dailyStart + Rpg.DAILY_QUEST_RESET, () => 0.99);
assert.strictEqual(nextDailyBoard.startedAt, dailyStart + Rpg.DAILY_QUEST_RESET);
assert.strictEqual(nextDailyBoard.tasks.every(task => task.progress === 0 && !task.claimed), true);
assert.strictEqual(Rpg.claimDailyQuest(dailyCharacter, 'unknown', dailyStart + Rpg.DAILY_QUEST_RESET).reason, 'unknown');

const started = Rpg.startActivity(first, 'mission', 'gosciniec', 1000);
assert.strictEqual(started.ok, true);
assert.strictEqual(Rpg.startActivity(first, 'hunt', 'bory', 1000).reason, 'busy');
assert.strictEqual(Rpg.completeActivity(first, started.finishesAt - 1), null);
const missionResult = Rpg.completeActivity(first, started.finishesAt, () => 0);
assert.strictEqual(missionResult.gold, 18);
assert.strictEqual(missionResult.xp, 20);
assert.strictEqual(missionResult.victory, true);
assert.ok(missionResult.combatLog.length > 0);
assert.ok(missionResult.loot.includes('list_przewozowy'));
assert.strictEqual(first.activeActivity, null);

second.level = 3;
const hunt = Rpg.startActivity(second, 'hunt', 'bory', 5000);
const huntResult = Rpg.completeActivity(second, hunt.finishesAt, () => 0);
assert.strictEqual(huntResult.loot.length, 3);
assert.strictEqual(second.inventory[huntResult.loot[0]], 2);
assert.strictEqual(huntResult.monstersDefeated, 3);
assert.strictEqual(huntResult.monsterType, 'wilki');
assert.strictEqual(second.inventory.trofeum_nithrala, 1);
assert.deepStrictEqual(second.completedHunts, ['bory']);
assert.strictEqual(huntResult.unlockedHuntName, Rpg.HUNTS[Rpg.HUNT_PROGRESSION[1]].name);
assert.strictEqual(Rpg.getHuntStatus(second, Rpg.HUNT_PROGRESSION[1]).unlocked, true);
assert.strictEqual(Rpg.getHuntStatus(second, Rpg.HUNT_PROGRESSION[2]).unlocked, false);
assert.strictEqual(
  Rpg.startActivity(second, 'hunt', Rpg.HUNT_PROGRESSION[2]).reason,
  'prerequisite'
);

const expeditionRetry = selectedCharacter();
expeditionRetry.level = Rpg.HUNTS.bory.requiredLevel;
expeditionRetry.health = 1;
const failedExpedition = Rpg.startActivity(expeditionRetry, 'hunt', 'bory', 5000);
const failedExpeditionResult = Rpg.completeActivity(expeditionRetry, failedExpedition.finishesAt, () => 0);
assert.strictEqual(failedExpeditionResult.victory, false);
assert.deepStrictEqual(expeditionRetry.completedHunts, []);
assert.strictEqual(Rpg.startActivity(expeditionRetry, 'hunt', 'bory', 6000).ok, true);

const expeditionVeteran = selectedCharacter();
expeditionVeteran.level = Rpg.MAX_LEVEL;
expeditionVeteran.equipment.weapon = 'miecz_stalowy_legendarny';
expeditionVeteran.equipment.armor = 'zbroja_legendarny_lowiec';
assert.strictEqual(
  Rpg.startActivity(expeditionVeteran, 'hunt', Rpg.HUNT_PROGRESSION.at(-1)).reason,
  'prerequisite'
);
for (const huntId of Rpg.HUNT_PROGRESSION) {
  expeditionVeteran.health = 100;
  const expedition = Rpg.startActivity(expeditionVeteran, 'hunt', huntId, 10000, () => 0);
  assert.strictEqual(expedition.ok, true, `Expected ${huntId} to be unlocked`);
  const result = Rpg.completeActivity(expeditionVeteran, expedition.finishesAt, () => 0);
  assert.strictEqual(result.victory, true, `Expected victory on ${huntId}`);
  if (huntId === 'ostatnia_wyprawa') {
    assert.ok(result.combatLog[0].includes('/1106 PŻ potwora'));
  }
}
assert.strictEqual(expeditionVeteran.completedHunts.length, Object.keys(Rpg.HUNTS).length);
assert.strictEqual(Rpg.getHuntStatus(expeditionVeteran, 'ostatnia_wyprawa').completed, true);

let bossTestSeed = 1;
const bossTestRandom = () =>
  ((bossTestSeed = (bossTestSeed * 1664525 + 1013904223) >>> 0) / 4294967296);
const equippedFinalBossHunter = selectedCharacter();
equippedFinalBossHunter.level = 50;
equippedFinalBossHunter.completedHunts = Rpg.HUNT_PROGRESSION.slice(0, -1);
equippedFinalBossHunter.equipment.weapon = 'miecz_stalowy_legendarny';
equippedFinalBossHunter.equipment.armor = 'zbroja_legendarny_lowiec';
const finalBossFight = Rpg.startActivity(equippedFinalBossHunter, 'hunt', 'ostatnia_wyprawa', 0);
const finalBossLoss = Rpg.completeActivity(equippedFinalBossHunter, finalBossFight.finishesAt, bossTestRandom);
assert.strictEqual(finalBossLoss.victory, false);
assert.strictEqual(Rpg.getHuntStatus(equippedFinalBossHunter, 'ostatnia_wyprawa').completed, false);

const contractHunter = selectedCharacter();
const contract = Rpg.startActivity(contractHunter, 'mission', 'gryf', 8000);
Rpg.completeActivity(contractHunter, contract.finishesAt, () => 0);
assert.strictEqual(contractHunter.inventory.trofeum_gryfa, 1);

first.coins = 120;
assert.strictEqual(Rpg.buyItem(first, 'srebrny_miecz').reason, 'funds');
first.coins += 20;
const purchase = Rpg.buyItem(first, 'srebrny_miecz');
assert.strictEqual(purchase.ok, true);
assert.strictEqual(Rpg.equipItem(first, 'srebrny_miecz').ok, true);
assert.strictEqual(first.equipment.weapon, 'srebrny_miecz');
first.health = 50;
first.coins += 35;
assert.strictEqual(Rpg.buyItem(first, 'jaskolka').ok, true);
assert.strictEqual(Rpg.useItem(first, 'jaskolka').health, 85);
const bulkBuyer = selectedCharacter({ witcher: { coins: 100, level: 1 } });
bulkBuyer.coins = 100;
const bulkPurchase = Rpg.buyItem(bulkBuyer, 'jaskolka', 2);
assert.strictEqual(bulkPurchase.ok, true);
assert.strictEqual(bulkPurchase.quantity, 2);
assert.strictEqual(bulkPurchase.totalPrice, Rpg.ITEMS.jaskolka.price * 2);
assert.strictEqual(bulkBuyer.inventory.jaskolka, 2);
assert.strictEqual(bulkBuyer.coins, 100 - Rpg.ITEMS.jaskolka.price * 2);
assert.strictEqual(Rpg.buyItem(bulkBuyer, 'jaskolka', 3).reason, 'funds');
assert.strictEqual(Rpg.buyItem(bulkBuyer, 'jaskolka', 0).reason, 'quantity');
const namedBuyer = selectedCharacter({ witcher: { coins: 10000, level: 1 } });
const steelSwordName = Rpg.ITEMS.miecz_stalowy_kaedwenski.name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ł/g, 'l')
  .toUpperCase();
assert.strictEqual(Rpg.buyItem(namedBuyer, steelSwordName).ok, true);
assert.strictEqual(namedBuyer.inventory.miecz_stalowy_kaedwenski, 1);
assert.strictEqual(Rpg.equipItem(namedBuyer, Rpg.ITEMS.miecz_stalowy_kaedwenski.name).ok, true);
assert.strictEqual(Rpg.resolveCatalogId('Ten sam', {
  first_item: { name: 'Ten sam' },
  second_item: { name: 'Ten sam' }
}).reason, 'ambiguous');
assert.deepStrictEqual(Rpg.resolveCatalogId('ZERRIKANSKI', {
  miecz_zerrikanski: { name: 'Zerrikański miecz stalowy' }
}), { ok: true, id: 'miecz_zerrikanski' });
assert.deepStrictEqual(Rpg.resolveCatalogId('SREBRNY', {
  miecz_srebrny: { name: 'Srebrny miecz' },
  miecz_stalowy: { name: 'Stalowy miecz' }
}), { ok: true, id: 'miecz_srebrny' });

const lockedCharacter = Rpg.ensureCharacter({ witcher: { name: 'Nowicjusz', coins: 10000, xp: 0, level: 4, health: 100, inventory: {}, equipment: { weapon: null, armor: null }, activeActivity: null } });
assert.strictEqual(lockedCharacter.school, 'wilczej_szkoly');
assert.strictEqual(Rpg.buyItem(lockedCharacter, 'miecz_wilczej_szkoly').reason, 'level');
lockedCharacter.level = 5;
assert.strictEqual(Rpg.buyItem(lockedCharacter, 'miecz_wilczej_szkoly').ok, true);
assert.strictEqual(Rpg.equipItem(lockedCharacter, 'miecz_wilczej_szkoly').ok, true);
lockedCharacter.level = 4;
assert.strictEqual(Rpg.equipItem(lockedCharacter, 'miecz_wilczej_szkoly').reason, 'level');
lockedCharacter.level = 29;
assert.strictEqual(Rpg.buyItem(lockedCharacter, 'miecz_wilczej_szkoly_mistrzowski').reason, 'level');
lockedCharacter.level = 30;
assert.strictEqual(Rpg.buyItem(lockedCharacter, 'miecz_wilczej_szkoly_mistrzowski').ok, true);
assert.strictEqual(Rpg.equipItem(lockedCharacter, 'miecz_wilczej_szkoly_mistrzowski').ok, true);
lockedCharacter.completedHunts = Rpg.HUNT_PROGRESSION.slice(
  0,
  Rpg.HUNT_PROGRESSION.indexOf('ostatni_pochod')
);
assert.strictEqual(Rpg.startActivity(lockedCharacter, 'hunt', 'ostatni_pochod').ok, true);

const seller = Rpg.ensureCharacter({ witcher: { name: 'Kupiec', coins: 5, xp: 0, level: 1, health: 100, inventory: { trofeum_gryfa: 2, trofeum_wilka: 1, wilcza_skora: 4, list_przewozowy: 2 }, equipment: { weapon: null, armor: null }, activeActivity: null } });
const singleSale = Rpg.sellLoot(seller, 'trofeum_gryfa', 1);
assert.strictEqual(singleSale.gold, Rpg.TROPHIES.trofeum_gryfa.price);
assert.strictEqual(seller.inventory.trofeum_gryfa, 1);
assert.strictEqual(seller.inventory.wilcza_skora, 4);
assert.strictEqual(Rpg.sellLoot(seller, 'Wilcza skora', 1).sold[0].id, 'wilcza_skora');
const uniqueDropSale = Rpg.sellLoot(seller, 'list_przewozowy', 1);
assert.strictEqual(uniqueDropSale.gold, 8);
assert.strictEqual(seller.inventory.list_przewozowy, 1);
const allLootSale = Rpg.sellLoot(seller, 'wszystko');
assert.strictEqual(allLootSale.sold.length, 4);
assert.strictEqual(seller.inventory.trofeum_gryfa, 0);
assert.strictEqual(seller.inventory.list_przewozowy, 0);
assert.strictEqual(seller.inventory.wilcza_skora, 0);

const blacksmithSeller = Rpg.ensureCharacter({ witcher: {
  name: 'Kowalowy klient',
  coins: 0,
  xp: 0,
  level: 1,
  health: 100,
  inventory: { miecz_stalowy_kaedwenski: 2, zbroja_temerska_kurtka: 1 },
  equipment: {
    weapon: 'miecz_stalowy_kaedwenski',
    steelWeapon: 'miecz_stalowy_kaedwenski',
    silverWeapon: null,
    armor: null
  },
  starterKitGranted: true,
  activeActivity: null
} });
assert.strictEqual(Rpg.sellLoot(blacksmithSeller, 'Kaedwenski').gold, Math.floor(Rpg.ITEMS.miecz_stalowy_kaedwenski.price / 2));
assert.strictEqual(blacksmithSeller.inventory.miecz_stalowy_kaedwenski, 1);
const armorSale = Rpg.sellLoot(blacksmithSeller, 'TEMERSKA');
assert.strictEqual(armorSale.sold[0].id, 'zbroja_temerska_kurtka');
assert.strictEqual(armorSale.gold, Math.floor(Rpg.ITEMS.zbroja_temerska_kurtka.price / 2));
assert.strictEqual(blacksmithSeller.inventory.zbroja_temerska_kurtka, 0);
assert.strictEqual(Rpg.sellLoot(blacksmithSeller, 'Kaedwenski').reason, 'equipped');
assert.strictEqual(Rpg.sellLoot(blacksmithSeller, 'wszystko').reason, 'empty');
assert.strictEqual(blacksmithSeller.inventory.miecz_stalowy_kaedwenski, 1);

const armed = Rpg.ensureCharacter({ witcher: { name: 'Łowca', coins: 0, xp: 0, level: 1, health: 100, inventory: {}, equipment: { weapon: 'srebrny_miecz', armor: null }, starterKitGranted: true, activeActivity: null } });
const armedTrip = Rpg.startActivity(armed, 'mission', 'gosciniec', 10000);
const armedResult = Rpg.completeActivity(armed, armedTrip.finishesAt, () => 0);
assert.strictEqual(armedResult.victory, true);
assert.ok(armedResult.loot.includes('trofeum_nekker'));
const unarmed = Rpg.ensureCharacter({ witcher: { name: 'Rekrut', coins: 0, xp: 0, level: 1, health: 100, inventory: {}, equipment: { weapon: null, armor: null }, starterKitGranted: true, activeActivity: null } });
const unarmedTrip = Rpg.startActivity(unarmed, 'mission', 'gosciniec', 10000);
const unarmedResult = Rpg.completeActivity(unarmed, unarmedTrip.finishesAt, () => 0);
assert.strictEqual(Rpg.selectCombatWeapon(armed, 'nekkerzy'), Rpg.ITEMS.srebrny_miecz);
assert.strictEqual(Rpg.selectCombatWeapon(unarmed, 'nekkerzy'), undefined);

const armored = Rpg.ensureCharacter({ witcher: { name: 'Twardziel', coins: 0, xp: 0, level: 1, health: 100, inventory: {}, equipment: { weapon: null, armor: 'zbroja_kaedwen' }, activeActivity: null } });
const armoredTrip = Rpg.startActivity(armored, 'mission', 'upiory', 20000);
const armoredResult = Rpg.completeActivity(armored, armoredTrip.finishesAt, () => 0.999);
const exposed = Rpg.ensureCharacter({ witcher: { name: 'Bez Zbroi', coins: 0, xp: 0, level: 1, health: 100, inventory: {}, equipment: { weapon: null, armor: null }, activeActivity: null } });
const exposedTrip = Rpg.startActivity(exposed, 'mission', 'upiory', 20000);
const exposedResult = Rpg.completeActivity(exposed, exposedTrip.finishesAt, () => 0.999);
assert.ok(armoredResult.healthLost < exposedResult.healthLost);

const bear = selectedCharacter({ witcher: { name: 'Niedźwiedź', coins: 0, xp: 0, level: 1, health: 100, inventory: {}, equipment: { weapon: null, armor: null }, activeActivity: null, school: 'niedzwiedzia' } });
const bearTrip = Rpg.startActivity(bear, 'mission', 'upiory', 20000);
const bearResult = Rpg.completeActivity(bear, bearTrip.finishesAt, () => 0.999);
const firstCounterDamage = result => Number(result.combatLog[1].match(/\*\*(\d+)\*\*/)[1]);
assert.ok(firstCounterDamage(bearResult) < firstCounterDamage(exposedResult));

const defeated = Rpg.ensureCharacter({ witcher: { name: 'Ranny', coins: 100, xp: 0, level: 1, health: 1, inventory: {}, equipment: { weapon: null, armor: null }, activeActivity: null } });
const defeatedTrip = Rpg.startActivity(defeated, 'mission', 'upiory', 30000);
const defeatResult = Rpg.completeActivity(defeated, defeatedTrip.finishesAt, () => 0);
assert.strictEqual(defeatResult.victory, false);
assert.strictEqual(defeatResult.loot.length, 0);
assert.strictEqual(defeated.inventory.trofeum_upiora, undefined);

const highLevel = Rpg.ensureCharacter({ witcher: { name: 'Weteran', coins: 0, xp: 0, level: 10, health: 100, inventory: {}, equipment: { weapon: null, armor: null }, activeActivity: null } });
const highLevelTrip = Rpg.startActivity(highLevel, 'mission', 'gosciniec', 40000);
const highLevelResult = Rpg.completeActivity(highLevel, highLevelTrip.finishesAt, () => 0);
assert.strictEqual(highLevelResult.rewardMultiplier, 1.45);
assert.ok(highLevelResult.xp > missionResult.xp);

console.log('Witcher RPG tests passed.');
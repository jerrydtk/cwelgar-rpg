const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const MAX_LEVEL = 50;
const RECENT_MISSION_LIMIT = 3;
const HUNT_BOSS_HEALTH_MULTIPLIER = 1.65;
const HUNT_BOSS_DAMAGE_MULTIPLIER = 1.25;
const HEALTH_REGEN_PER_MINUTE = 0.5;
const PVP_STARTING_RATING = 1000;
const PVP_RATING_K_FACTOR = 32;
const PVP_RANKED_MATCH_COOLDOWN = 2 * HOUR;
const HERBALISM_COOLDOWN = 30 * MINUTE;
const HERBALISM_MAX_LEVEL = 5;
const HERBALISM_XP_PER_HARVEST = 25;
const HERBALISM_XP_PER_LEVEL = 100;

const MISSION_MONSTER_TYPES = {
  strzyga_wyzima: 'ghule', kayran_pontar: 'utopce', ksiaze_ropuch: 'utopce', dagon_fyke: 'wraiths',
  leszy_brokilon: 'alghule', bazyliszek_vergen: 'wyverny', kokatryks_montecalvo: 'harpie',
  wyverna_temerianska: 'wyverny', archigryf_mahakam: 'gryfy', czart_velen: 'nekkerzy', bies_velen: 'ghule',
  katakan_novigrad: 'wraiths', bruxa_oxenfurt: 'wraiths', orianna_beauclair: 'ghule', dettlaff_toussaint: 'wraiths',
  shaelmaar_arena: 'golemy', hym_hindarsfjall: 'wraiths', nocnica_velen: 'wraiths', poludnica_bialy_sad: 'wraiths',
  upior_fyke: 'wraiths', golem_loc_muinne: 'golemy', gargulec_kaer_trolde: 'golemy', wodz_nekkerow: 'nekkerzy',
  alghul_cmentarz: 'alghule', arachas_stary_las: 'endriagi', matka_endriag: 'endriagi',
  lodowy_gigant_undvik: 'ghule', svalblod_skellige: 'nekkerzy', imlerith: 'wild_hunt_riders', caranthir_gon: 'wild_hunt_riders',
  niedzwiedz_zimowego_szlaku: 'golemy', cien_toussaint: 'bruxy', smok_zlocisty: 'wyverny',
  demon_pustkowi: 'wild_hunt_riders', krol_gonu: 'wild_hunt_riders', serce_golema: 'golemy',
  wiedzma_szlaku: 'wraiths', leszy_wieczny: 'alghule', bestia_korath: 'bazyliszki',
  upior_krolewski: 'wraiths', hydra_morza: 'utopce', straznik_portalu: 'wild_hunt_riders'
};

const MISSION_TROPHIES = {
  nekkerzy: { id: 'trofeum_nekker', name: 'Trofeum nekkera', price: 85 },
  ghule: { id: 'trofeum_ghula', name: 'Trofeum ghula', price: 135 },
  utopce: { id: 'trofeum_utopca', name: 'Trofeum utopca', price: 110 },
  wraiths: { id: 'trofeum_upiora', name: 'Trofeum upiora', price: 240 },
  alghule: { id: 'trofeum_alghula', name: 'Trofeum alghula', price: 190 },
  wyverny: { id: 'trofeum_wyverny', name: 'Trofeum wyverny', price: 190 },
  harpie: { id: 'trofeum_harpii', name: 'Trofeum harpii', price: 190 },
  gryfy: { id: 'trofeum_gryfa', name: 'Trofeum gryfa', price: 280 },
  golemy: { id: 'trofeum_golema', name: 'Trofeum golema', price: 380 },
  endriagi: { id: 'trofeum_endriagi', name: 'Trofeum endriagi', price: 190 },
  wild_hunt_riders: { id: 'trofeum_gonu', name: 'Trofeum jeźdźca Gonu', price: 460 }
};

const MISSION_DROPS = {
  gosciniec: { id: 'list_przewozowy', name: 'List przewozowy kupca', price: 8 },
  gryf: { id: 'lotka_bialego_sadu', name: 'Lotka z Białego Sadu', price: 14 },
  upiory: { id: 'popiol_nawiedzonego_traktu', name: 'Popiół z nawiedzonego traktu', price: 18 },
  strzyga_wyzima: { id: 'wisior_wyzimski', name: 'Pęknięty wisior z Wyzimy', price: 12 },
  kayran_pontar: { id: 'luska_pontaru', name: 'Łuska z Pontaru', price: 24 },
  ksiaze_ropuch: { id: 'sluz_oxenfurcka', name: 'Kwaśna śluzówka z kanałów', price: 20 },
  dagon_fyke: { id: 'muszla_fyke', name: 'Muszla z wyspy Fyke', price: 11 },
  leszy_brokilon: { id: 'zywica_brokilonu', name: 'Żywica z Brokilonu', price: 16 },
  bazyliszek_vergen: { id: 'jajko_vergen', name: 'Skorupa jaja spod Vergen', price: 19 },
  kokatryks_montecalvo: { id: 'grzebien_montecalvo', name: 'Grzebień z Montecalvo', price: 18 },
  wyverna_temerianska: { id: 'skorupa_temerska', name: 'Łuska z temerskiej wyverny', price: 17 },
  archigryf_mahakam: { id: 'lotka_mahakamska', name: 'Lotka z Mahakamu', price: 26 },
  czart_velen: { id: 'kopyto_velen', name: 'Kopyto z bagien Velen', price: 22 },
  bies_velen: { id: 'rog_velenski', name: 'Róg z Velen', price: 23 },
  katakan_novigrad: { id: 'kiel_novigradzki', name: 'Kieł z Novigradu', price: 21 },
  bruxa_oxenfurt: { id: 'krysztal_oxenfurcki', name: 'Kryształek z Oxenfurtu', price: 20 },
  orianna_beauclair: { id: 'perfumy_beauclair', name: 'Flakon perfum z Beauclair', price: 24 },
  dettlaff_toussaint: { id: 'czerwony_krysztal', name: 'Czerwony kryształ z Toussaint', price: 32 },
  shaelmaar_arena: { id: 'kolec_arenowy', name: 'Kolec z areny Beauclair', price: 24 },
  hym_hindarsfjall: { id: 'wosk_hindarsfjall', name: 'Wosk z Hindarsfjall', price: 19 },
  nocnica_velen: { id: 'srebrna_moneta_velen', name: 'Srebrna moneta z Velen', price: 10 },
  poludnica_bialy_sad: { id: 'kwiat_bialego_sadu', name: 'Kwiat z Białego Sadu', price: 7 },
  upior_fyke: { id: 'lancuch_fyke', name: 'Fragment łańcucha z Fyke', price: 13 },
  golem_loc_muinne: { id: 'odlamek_loc_muinne', name: 'Odłamek z ruin Loc Muinne', price: 25 },
  gargulec_kaer_trolde: { id: 'glif_kaer_trolde', name: 'Kamienny glif z Kaer Trolde', price: 18 },
  wodz_nekkerow: { id: 'szpon_vergen', name: 'Szpon z Vergen', price: 8 },
  alghul_cmentarz: { id: 'zab_cmentarny', name: 'Ząb z cmentarza w Velen', price: 12 },
  arachas_stary_las: { id: 'jad_starego_lasu', name: 'Gruczoł jadowy ze Starego Lasu', price: 18 },
  matka_endriag: { id: 'jad_bagienny', name: 'Jad z bagien', price: 12 },
  lodowy_gigant_undvik: { id: 'lodowy_odlamek', name: 'Lodowy odłamek z Undvik', price: 30 },
  svalblod_skellige: { id: 'runiczny_odlamek', name: 'Runiczny odłamek ze Skellige', price: 28 },
  imlerith: { id: 'zlamany_grot_gonu', name: 'Złamany grot Dzikiego Gonu', price: 30 },
  caranthir_gon: { id: 'krysztal_portalu', name: 'Kryształ z portalu Gonu', price: 32 },
  niedzwiedz_zimowego_szlaku: { id: 'pazur_zimowego_niedzwiedzia', name: 'Pazur zimowego niedźwiedzia', price: 42 },
  cien_toussaint: { id: 'welon_toussaint', name: 'Welon cienia z Toussaint', price: 48 },
  smok_zlocisty: { id: 'luska_zlocistego_smoka', name: 'Łuska złocistego smoka', price: 55 },
  demon_pustkowi: { id: 'rdzen_pustkowi', name: 'Rdzeń z Pustkowi', price: 58 },
  krol_gonu: { id: 'korona_krola_gonu', name: 'Odłamek korony Króla Gonu', price: 68 },
  serce_golema: { id: 'serce_starozytnego_golema', name: 'Serce starożytnego golema', price: 52 },
  wiedzma_szlaku: { id: 'krysztal_wiedzmy', name: 'Kryształ wiedźmy ze szlaku', price: 45 },
  leszy_wieczny: { id: 'kora_wiecznego_leszego', name: 'Kora wiecznego leszego', price: 50 },
  bestia_korath: { id: 'kolec_korath', name: 'Kolec bestii z Korath', price: 60 },
  upior_krolewski: { id: 'korona_upiora', name: 'Korona królewskiego upiora', price: 62 },
  hydra_morza: { id: 'jad_hydry_morskiej', name: 'Jad hydry morskiej', price: 57 },
  straznik_portalu: { id: 'rdzen_portalu', name: 'Rdzeń strażnika portalu', price: 70 }
};

function createMission(id, name, monsterType, minutes, minGold, maxGold, xp, damage, trophyChance, levelRecommendation) {
  const trophy = MISSION_TROPHIES[monsterType] || MISSION_TROPHIES.nekkerzy;
  const uniqueDrop = MISSION_DROPS[id];
  const recommendedLevel = levelRecommendation || Math.min(MAX_LEVEL, Math.max(1, Math.ceil(xp / 15)));
  const minMonsters = Math.max(1, Math.min(5, Math.ceil(xp / 60)));
  return {
    name,
    monsterType,
    recommendedLevel,
    duration: minutes * MINUTE,
    minGold,
    maxGold,
    xp,
    lootChance: 0.2,
    loot: [uniqueDrop.id],
    damage,
    minMonsters,
    maxMonsters: minMonsters + 1,
    monsterHealth: 22 + Math.ceil(damage * 1.4),
    trophy: trophy.id,
    trophyName: trophy.name,
    trophyPrice: trophy.price,
    trophyChance
  };
}

function createHunt(name, hours, minGold, maxGold, xp, minLoot, maxLoot, loot, minMonsters, maxMonsters, monsterTypes, boss, trophy, trophyName, trophyPrice, damage) {
  return {
    name,
    boss,
    duration: hours * HOUR,
    minGold,
    maxGold,
    xp,
    minLoot,
    maxLoot,
    loot,
    minMonsters,
    maxMonsters,
    monsterTypes,
    trophy,
    trophyName,
    trophyPrice,
    trophyChance: Math.min(0.95, 0.62 + hours * 0.035),
    minTrophies: 1,
    maxTrophies: hours >= 4 ? 2 : 1,
    requiredLevel: hours >= 8 ? 15 : hours >= 4 ? 8 : 3,
    damage
  };
}

const ADDITIONAL_MISSION_DATA = [
  ['strzyga_wyzima', 'Klątwa nad Wyzimą', 20, 65, 95, 95, 14, ['mutagen', 'ziola'], 0.1],
  ['kayran_pontar', 'Szlak nad Pontarem', 30, 120, 170, 160, 21, ['esencja_upiora', 'ruda_srebra'], 0.14],
  ['ksiaze_ropuch', 'Klątwa kanałów Oxenfurtu', 30, 130, 180, 175, 22, ['zab_utopca', 'esencja_upiora'], 0.15],
  ['dagon_fyke', 'Rytuał na wyspie Fyke', 25, 95, 140, 130, 17, ['esencja_upiora', 'mutagen'], 0.12],
  ['leszy_brokilon', 'Cień nad Brokilonem', 25, 105, 150, 140, 19, ['ziola', 'wilcza_skora'], 0.13],
  ['bazyliszek_vergen', 'Bazyliszek spod Vergen', 20, 80, 115, 105, 15, ['pioro_gryfa', 'ruda_srebra'], 0.1],
  ['kokatryks_montecalvo', 'Gniazdo na Montecalvo', 20, 85, 120, 110, 15, ['pioro_gryfa', 'mutagen'], 0.1],
  ['wyverna_temerianska', 'Skrzydła nad Temerią', 15, 60, 90, 80, 12, ['pioro_gryfa', 'wilcza_skora'], 0.08],
  ['archigryf_mahakam', 'Archigryf z Mahakamu', 30, 145, 200, 190, 23, ['pioro_gryfa', 'ruda_srebra'], 0.16],
  ['czart_velen', 'Czart z bagien Velen', 25, 110, 155, 145, 19, ['mutagen', 'ziola'], 0.13],
  ['bies_velen', 'Tropem biesa z Velen', 25, 115, 160, 150, 20, ['wilcza_skora', 'mutagen'], 0.13],
  ['katakan_novigrad', 'Krew na ulicach Novigradu', 20, 90, 130, 120, 16, ['esencja_upiora', 'mutagen'], 0.11],
  ['bruxa_oxenfurt', 'Ślady w Oxenfurcie', 20, 95, 135, 125, 17, ['esencja_upiora', 'ziola'], 0.11],
  ['orianna_beauclair', 'Ślady w kanałach Beauclair', 30, 155, 215, 205, 23, ['esencja_upiora', 'mutagen'], 0.16],
  ['dettlaff_toussaint', 'Nocne polowanie w Toussaint', 30, 190, 260, 260, 27, ['mutagen', 'esencja_upiora'], 0.18],
  ['shaelmaar_arena', 'Bestia z areny Beauclair', 25, 135, 185, 170, 21, ['ruda_srebra', 'mutagen'], 0.14],
  ['hym_hindarsfjall', 'Szepty na Hindarsfjall', 20, 90, 130, 120, 16, ['esencja_upiora', 'ziola'], 0.11],
  ['nocnica_velen', 'Nocne niepokoje na moczarach', 15, 60, 90, 80, 12, ['ziola', 'esencja_upiora'], 0.08],
  ['poludnica_bialy_sad', 'Nieumarli na trakcie Białego Sadu', 10, 40, 60, 50, 8, ['ziola', 'wilcza_skora'], 0.06],
  ['upior_fyke', 'Niepokój na wyspie Fyke', 15, 65, 95, 85, 13, ['esencja_upiora', 'mutagen'], 0.09],
  ['golem_loc_muinne', 'Strażnik ruin Loc Muinne', 25, 120, 170, 155, 20, ['ruda_srebra', 'mutagen'], 0.14],
  ['gargulec_kaer_trolde', 'Gargulce nad Kaer Trolde', 15, 65, 95, 85, 13, ['ruda_srebra', 'mutagen'], 0.09],
  ['wodz_nekkerow', 'Nekkerzy z Vergen', 10, 45, 65, 55, 9, ['wilcza_skora', 'ziola'], 0.06],
  ['alghul_cmentarz', 'Cmentarzysko w Velen', 15, 60, 90, 80, 12, ['esencja_upiora', 'mutagen'], 0.08],
  ['arachas_stary_las', 'Pajęczyny Starego Lasu', 20, 90, 130, 120, 16, ['mutagen', 'ziola'], 0.11],
  ['matka_endriag', 'Endriagi na bagnach', 15, 60, 90, 80, 12, ['ziola', 'mutagen'], 0.08],
  ['lodowy_gigant_undvik', 'Zimowy trakt Undvik', 30, 165, 225, 220, 25, ['ruda_srebra', 'mutagen'], 0.17],
  ['svalblod_skellige', 'Zaginieni na Skellige', 30, 170, 235, 230, 26, ['mutagen', 'esencja_upiora'], 0.17],
  ['imlerith', 'Patrol Dzikiego Gonu', 30, 180, 245, 240, 27, ['mutagen', 'ruda_srebra'], 0.18],
  ['caranthir_gon', 'Ślady portalu na północy', 30, 185, 250, 250, 27, ['mutagen', 'ruda_srebra'], 0.18],
  ['niedzwiedz_zimowego_szlaku', 'Bestia na zimowym szlaku', 45, 260, 340, 300, 29, ['mutagen', 'ruda_srebra'], 0.2],
  ['cien_toussaint', 'Cień nad winnicami Toussaint', 50, 300, 390, 340, 31, ['esencja_upiora', 'mutagen'], 0.21],
  ['smok_zlocisty', 'Smok nad Mahakamem', 55, 340, 430, 380, 33, ['pioro_gryfa', 'ruda_srebra'], 0.22],
  ['demon_pustkowi', 'Demon na Pustkowiach', 60, 380, 480, 420, 35, ['mutagen', 'esencja_upiora'], 0.23],
  ['krol_gonu', 'Król bez korony', 65, 420, 530, 460, 37, ['mutagen', 'ruda_srebra'], 0.24],
  ['serce_golema', 'Serce pradawnego golema', 70, 460, 580, 500, 39, ['ruda_srebra', 'mutagen'], 0.25],
  ['wiedzma_szlaku', 'Wiedźma z zapomnianego szlaku', 75, 500, 630, 540, 41, ['esencja_upiora', 'ziola'], 0.26],
  ['leszy_wieczny', 'Wieczny leszy z Głębokiego Lasu', 80, 540, 680, 580, 43, ['wilcza_skora', 'mutagen'], 0.27],
  ['bestia_korath', 'Bestia z pustyni Korath', 90, 590, 740, 620, 45, ['ruda_srebra', 'pioro_gryfa'], 0.28, 45],
  ['upior_krolewski', 'Królewski upiór z Cintry', 100, 640, 800, 660, 47, ['esencja_upiora', 'mutagen'], 0.29, 46],
  ['hydra_morza', 'Hydra na końcu świata', 110, 700, 870, 700, 49, ['zab_utopca', 'mutagen'], 0.3, 48],
  ['straznik_portalu', 'Strażnik ostatniego portalu', 120, 760, 940, 750, 50, ['mutagen', 'ruda_srebra'], 0.32]
];

const MISSIONS = {
  gosciniec: {
    name: 'Zaginiony kupiec',
    duration: 5 * MINUTE,
    minGold: 18,
    maxGold: 30,
    xp: 20,
    lootChance: 0.15,
    loot: [MISSION_DROPS.gosciniec.id],
    damage: 3,
    monsterType: 'nekkerzy',
    recommendedLevel: 1,
    minMonsters: 1,
    maxMonsters: 2,
    monsterHealth: 24,
    trophy: 'trofeum_nekker',
    trophyChance: 0.05
  },
  gryf: {
    name: 'Kontrakt na gryfa',
    duration: 15 * MINUTE,
    minGold: 40,
    maxGold: 65,
    xp: 55,
    lootChance: 0.35,
    loot: [MISSION_DROPS.gryf.id],
    trophyChance: 0.08,
    trophy: 'trofeum_gryfa',
    damage: 10,
    monsterType: 'gryfy',
    recommendedLevel: 1,
    minMonsters: 2,
    maxMonsters: 3,
    monsterHealth: 32
  },
  upiory: {
    name: 'Nawiedzony trakt',
    duration: 30 * MINUTE,
    minGold: 90,
    maxGold: 130,
    xp: 100,
    lootChance: 0.55,
    loot: [MISSION_DROPS.upiory.id],
    trophyChance: 0.12,
    trophy: 'trofeum_upiora',
    damage: 16,
    monsterType: 'wraiths',
    recommendedLevel: 2,
    minMonsters: 3,
    maxMonsters: 4,
    monsterHealth: 38
  },
  ...Object.fromEntries(ADDITIONAL_MISSION_DATA.map(([id, name, minutes, minGold, maxGold, xp, damage, loot, trophyChance, levelRecommendation]) => [
    id,
    createMission(id, name, MISSION_MONSTER_TYPES[id] || 'nekkerzy', minutes, minGold, maxGold, xp, damage, trophyChance, levelRecommendation)
  ]))
};

const ADDITIONAL_HUNTS = {
  wyspa_fyke: createHunt('Wyspa Fyke', 2, 110, 155, 160, 2, 4, ['esencja_upiora', 'ziola', 'ruda_srebra'], 4, 9, ['wraiths', 'noonwraiths'], 'Płaczka z Fyke Isle', 'trofeum_placzki', 'Trofeum płaczki', 195, 10),
  kanal_oxenfurt: createHunt('Kanały Oxenfurtu', 4, 230, 330, 350, 3, 5, ['zab_utopca', 'esencja_upiora', 'mutagen'], 8, 14, ['utopce', 'ghule'], 'Książę Ropuch', 'trofeum_ropucha', 'Trofeum Księcia Ropucha', 430, 16),
  velen: createHunt('Krzywuchowe Moczary', 4, 210, 315, 340, 3, 5, ['ziola', 'esencja_upiora', 'wilcza_skora'], 7, 13, ['ghule', 'alghule'], 'Brewess, Warzelnica', 'trofeum_brewess', 'Trofeum Brewess', 390, 17),
  skellige: createHunt('Wyspy Skellige', 8, 620, 880, 820, 5, 8, ['pioro_gryfa', 'mutagen', 'ruda_srebra'], 15, 24, ['harpie', 'gryfy'], 'Eredin, Król Gonu', 'trofeum_eredina', 'Trofeum Eredina', 720, 26),
  kaer_morhen: createHunt('Przełęcz Kaer Morhen', 8, 580, 840, 780, 5, 8, ['mutagen', 'ruda_srebra', 'wilcza_skora'], 14, 23, ['wild_hunt_riders', 'nekkerzy'], 'Imlerith', 'trofeum_imleritha', 'Trofeum Imleritha', 620, 27),
  toussaint: createHunt('Winnice Toussaint', 8, 700, 980, 950, 6, 9, ['esencja_upiora', 'mutagen', 'pioro_gryfa'], 16, 26, ['bruxy', 'ghule'], 'Dettlaff van der Eretein', 'trofeum_dettlaffa', 'Trofeum Dettlaffa', 650, 28),
  vergen: createHunt('Wąwóz pod Vergen', 4, 260, 365, 390, 3, 5, ['ruda_srebra', 'mutagen', 'pioro_gryfa'], 9, 15, ['draugi', 'golemy'], 'Draug', 'trofeum_drauga', 'Trofeum Drauga', 455, 18),
  brokilon: createHunt('Stary Las Brokilonu', 4, 245, 350, 370, 3, 6, ['ziola', 'wilcza_skora', 'mutagen'], 8, 15, ['leszy', 'endriagi'], 'Leszy z Brokilonu', 'trofeum_leszego', 'Trofeum leszego', 350, 19),
  mahakam: createHunt('Szczyty Mahakamu', 8, 660, 920, 880, 5, 9, ['ruda_srebra', 'mutagen', 'pioro_gryfa'], 15, 25, ['wyverny', 'bazyliszki'], 'Villentretenmerth, Złoty Smok', 'trofeum_zlotego_smoka', 'Trofeum Złotego Smoka', 780, 27),
  novigrad: createHunt('Trakt pod Novigradem', 2, 120, 170, 175, 2, 4, ['esencja_upiora', 'mutagen', 'ziola'], 5, 9, ['katakany', 'wraiths'], 'Katakan z Novigradu', 'trofeum_katakana', 'Trofeum katakana', 290, 11),
  polnocne_szlaki: {
    ...createHunt('Północne szlaki', 10, 900, 1250, 1100, 6, 9, ['ruda_srebra', 'mutagen', 'pioro_gryfa'], 18, 28, ['wild_hunt_riders', 'golemy'], 'Generał Dzikiego Gonu', 'trofeum_generala_gonu', 'Trofeum generała Gonu', 850, 31),
    requiredLevel: 20
  },
  ruiny_toussaint: {
    ...createHunt('Ruiny Toussaint', 12, 1200, 1650, 1450, 7, 10, ['esencja_upiora', 'mutagen', 'ruda_srebra'], 20, 32, ['bruxy', 'ghule', 'golemy'], 'Bestia z ruin', 'trofeum_bestii_ruin', 'Trofeum bestii z ruin', 980, 34),
    requiredLevel: 25
  },
  ostatni_pochod: {
    ...createHunt('Ostatni pochód Gonu', 14, 1550, 2100, 1850, 8, 12, ['mutagen', 'ruda_srebra', 'pioro_gryfa'], 24, 36, ['wild_hunt_riders', 'golemy'], 'Dowódca Dzikiego Gonu', 'trofeum_dowodcy_gonu', 'Trofeum dowódcy Gonu', 1200, 38),
    requiredLevel: 30
  },
  serce_pustkowi: {
    ...createHunt('Serce Pustkowi', 16, 1900, 2500, 2100, 9, 13, ['mutagen', 'ruda_srebra', 'luska_zlocistego_smoka'], 28, 40, ['golemy', 'wild_hunt_riders'], 'Strażnik Pustkowi', 'trofeum_straznika_pustkowi', 'Trofeum Strażnika Pustkowi', 1450, 42),
    requiredLevel: 35
  },
  czarny_sztorm: {
    ...createHunt('Czarny Sztorm', 20, 2350, 3100, 2450, 10, 15, ['esencja_upiora', 'mutagen', 'luska_zlocistego_smoka'], 32, 46, ['bruxy', 'golemy', 'wild_hunt_riders'], 'Władca Czarnego Sztormu', 'trofeum_wladcy_sztormu', 'Trofeum Władcy Sztormu', 1700, 46),
    requiredLevel: 40
  },
  koniec_swiata: {
    ...createHunt('Koniec Świata', 24, 2900, 3800, 2850, 12, 17, ['mutagen', 'ruda_srebra', 'luska_zlocistego_smoka'], 36, 52, ['wild_hunt_riders', 'golemy', 'wyverny'], 'Bestia z Końca Świata', 'trofeum_bestii_konca_swiata', 'Trofeum Bestii z Końca Świata', 2050, 50),
    requiredLevel: 45
  },
  ostatnia_wyprawa: {
    ...createHunt('Ostatnia Wyprawa', 30, 3600, 4700, 3300, 14, 20, ['mutagen', 'ruda_srebra', 'luska_zlocistego_smoka'], 42, 60, ['wild_hunt_riders', 'golemy', 'bruxy'], 'Pradawny Król Gonu', 'trofeum_pradawnego_krola', 'Trofeum Pradawnego Króla', 2500, 55),
    requiredLevel: 50
  }
};

const HUNTS = {
  bory: {
    name: 'Bory pod Novigradem',
    duration: 2 * HOUR,
    minGold: 75,
    maxGold: 110,
    xp: 120,
    minLoot: 2,
    maxLoot: 3,
    loot: ['wilcza_skora', 'ziola', 'wilczy_kl'],
    minMonsters: 3,
    maxMonsters: 7,
    monsterTypes: ['wilki', 'nekkerzy'],
    boss: 'Nithral',
    requiredLevel: 3,
    trophy: 'trofeum_nithrala',
    trophyName: 'Trofeum Nithrala',
    trophyPrice: 360,
    trophyChance: 0.65,
    minTrophies: 1,
    maxTrophies: 1,
    damage: 8
  },
  bagna: {
    name: 'Bagna Wyzimy',
    duration: 4 * HOUR,
    minGold: 200,
    maxGold: 300,
    xp: 320,
    minLoot: 3,
    maxLoot: 5,
    loot: ['zab_utopca', 'ziola', 'esencja_upiora'],
    minMonsters: 8,
    maxMonsters: 14,
    monsterTypes: ['utopce', 'ghule'],
    boss: 'Weavess, Tkaczka',
    requiredLevel: 8,
    trophy: 'trofeum_weavess',
    trophyName: 'Trofeum Weavess',
    trophyPrice: 420,
    trophyChance: 0.78,
    minTrophies: 1,
    maxTrophies: 2,
    damage: 15
  },
  przelecz: {
    name: 'Górska przełęcz',
    duration: 8 * HOUR,
    minGold: 500,
    maxGold: 700,
    xp: 700,
    minLoot: 5,
    maxLoot: 8,
    loot: ['pioro_gryfa', 'ruda_srebra', 'mutagen'],
    minMonsters: 15,
    maxMonsters: 25,
    monsterTypes: ['harpie', 'gryfy'],
    boss: 'Imlerith',
    requiredLevel: 15,
    trophy: 'trofeum_imleritha',
    trophyName: 'Trofeum Imleritha',
    trophyPrice: 620,
    trophyChance: 0.9,
    minTrophies: 1,
    maxTrophies: 2,
    damage: 25
  }
};
Object.assign(HUNTS, ADDITIONAL_HUNTS);
const HUNT_PROGRESSION = Object.keys(HUNTS).sort((leftId, rightId) =>
  HUNTS[leftId].requiredLevel - HUNTS[rightId].requiredLevel
);

const ITEMS = {
  srebrny_miecz: { name: 'Srebrny miecz', price: 140, type: 'equipment', slot: 'weapon', attack: 8, critChance: 0.08 },
  miecz_srebrny_ban_ard: { name: 'Srebrny miecz z Ban Ard', price: 620, type: 'equipment', slot: 'weapon', attack: 17, critChance: 0.12, requiredLevel: 5 },
  miecz_srebrny_runiczny: { name: 'Runiczny miecz srebrny', price: 1750, type: 'equipment', slot: 'weapon', attack: 29, critChance: 0.16, requiredLevel: 10 },
  miecz_srebrny_mahakamski: { name: 'Mahakamski miecz srebrny', price: 3200, type: 'equipment', slot: 'weapon', attack: 40, critChance: 0.18, requiredLevel: 15 },
  miecz_srebrny_toussaint: { name: 'Srebrny miecz z Toussaint', price: 4700, type: 'equipment', slot: 'weapon', attack: 49, critChance: 0.2, requiredLevel: 20 },
  miecz_srebrny_relikt: { name: 'Reliktowy miecz srebrny', price: 6800, type: 'equipment', slot: 'weapon', attack: 57, critChance: 0.22, requiredLevel: 25 },
  miecz_srebrny_arcymistrzowski: { name: 'Arcymistrzowski miecz srebrny', price: 9000, type: 'equipment', slot: 'weapon', attack: 64, critChance: 0.24, requiredLevel: 30 },
  miecz_srebrny_wielkiego_mistrza: { name: 'Srebrny miecz Wielkiego Mistrza', price: 12800, type: 'equipment', slot: 'weapon', attack: 76, critChance: 0.26, requiredLevel: 40 },
  miecz_srebrny_legendarny: { name: 'Legendarny miecz srebrny', price: 18500, type: 'equipment', slot: 'weapon', attack: 90, critChance: 0.28, requiredLevel: 50 },
  miecz_stalowy: { name: 'Miecz stalowy', price: 100, type: 'equipment', slot: 'weapon', attack: 7, critChance: 0.05 },
  miecz_stalowy_kaedwenski: { name: 'Kaedweński miecz stalowy', price: 190, type: 'equipment', slot: 'weapon', attack: 11, critChance: 0.06 },
  miecz_stalowy_zerrikanski: { name: 'Zerrikański miecz stalowy', price: 360, type: 'equipment', slot: 'weapon', attack: 14, critChance: 0.1, requiredLevel: 3 },
  miecz_temerski: { name: 'Temerski miecz stalowy', price: 160, type: 'equipment', slot: 'weapon', attack: 9, critChance: 0.08 },
  miecz_stalowy_redanski: { name: 'Redański miecz stalowy', price: 1050, type: 'equipment', slot: 'weapon', attack: 25, critChance: 0.12, requiredLevel: 10 },
  miecz_stalowy_nilfgaardzki: { name: 'Nilfgaardzki miecz stalowy', price: 2350, type: 'equipment', slot: 'weapon', attack: 36, critChance: 0.14, requiredLevel: 15 },
  miecz_stalowy_toussaint: { name: 'Stalowy miecz z Toussaint', price: 3900, type: 'equipment', slot: 'weapon', attack: 45, critChance: 0.17, requiredLevel: 20 },
  miecz_stalowy_relikt: { name: 'Reliktowy miecz stalowy', price: 5900, type: 'equipment', slot: 'weapon', attack: 53, critChance: 0.19, requiredLevel: 25 },
  miecz_stalowy_arcymistrzowski: { name: 'Arcymistrzowski miecz stalowy', price: 8200, type: 'equipment', slot: 'weapon', attack: 60, critChance: 0.21, requiredLevel: 30 },
  miecz_stalowy_wielkiego_mistrza: { name: 'Stalowy miecz Wielkiego Mistrza', price: 11600, type: 'equipment', slot: 'weapon', attack: 72, critChance: 0.23, requiredLevel: 40 },
  miecz_stalowy_legendarny: { name: 'Legendarny miecz stalowy', price: 17200, type: 'equipment', slot: 'weapon', attack: 86, critChance: 0.25, requiredLevel: 50 },
  zbroja_temerska_kurtka: { name: 'Temerska kurtka', price: 220, type: 'equipment', slot: 'armor', defense: 8 },
  zbroja_skora_wzmocniona: { name: 'Wzmocniona skórzana kurtka', price: 320, type: 'equipment', slot: 'armor', defense: 11, requiredLevel: 2 },
  zbroja_kaedwen: { name: 'Kaedweńska zbroja', price: 110, type: 'equipment', slot: 'armor', defense: 6 },
  zbroja_plyty_redanskie: { name: 'Redański pancerz płytowy', price: 880, type: 'equipment', slot: 'armor', defense: 19, requiredLevel: 10 },
  zbroja_nilfgaardzka: { name: 'Nilfgaardzka zbroja oficerska', price: 1900, type: 'equipment', slot: 'armor', defense: 27, requiredLevel: 15 },
  zbroja_toussaint: { name: 'Pancerz rycerski z Toussaint', price: 3500, type: 'equipment', slot: 'armor', defense: 36, requiredLevel: 20 },
  zbroja_skellige: { name: 'Skelligeńska kolczuga', price: 5100, type: 'equipment', slot: 'armor', defense: 44, requiredLevel: 25 },
  zbroja_reliktowa: { name: 'Reliktowy pancerz łowcy', price: 7800, type: 'equipment', slot: 'armor', defense: 54, requiredLevel: 30 },
  zbroja_wielkiego_mistrza: { name: 'Pancerz Wielkiego Mistrza', price: 12400, type: 'equipment', slot: 'armor', defense: 68, requiredLevel: 40 },
  zbroja_legendarny_lowiec: { name: 'Legendarny pancerz łowcy', price: 18200, type: 'equipment', slot: 'armor', defense: 82, requiredLevel: 50 },
  jaskolka: { name: 'Mikstura Jaskółka', price: 35, type: 'consumable', heal: 35 },
  jaskolka_wzmocniona: { name: 'Silna Jaskółka', price: 85, type: 'consumable', heal: 60, requiredLevel: 5 },
  biala_rafard: { name: 'Biała Raffard', price: 160, type: 'consumable', heal: 100, requiredLevel: 10 },
  napar_mandragory: { name: 'Napar z mandragory', type: 'consumable', heal: 45, craftOnly: true },
  kocie_oko: {
    name: 'Eliksir Kocie Oko',
    type: 'consumable',
    craftOnly: true,
    combatBuff: { critChance: 0.12 },
    effectDescription: '+12% szansy na krytyk w następnej walce'
  },
  wywar_lesny: {
    name: 'Wywar Leśny',
    type: 'consumable',
    craftOnly: true,
    combatBuff: { attack: 5, defense: 2 },
    effectDescription: '+5 do obrażeń i +2 obrony w następnej walce'
  },
  czarna_krew: {
    name: 'Czarna Krew',
    type: 'consumable',
    craftOnly: true,
    combatBuff: { attack: 3, defense: 7 },
    effectDescription: '+3 do obrażeń i +7 obrony w następnej walce'
  },
  biala_mewa: {
    name: 'Biała Mewa',
    type: 'consumable',
    craftOnly: true,
    combatBuff: { attack: 4, critChance: 0.06 },
    effectDescription: '+4 do obrażeń i +6% szansy na krytyk w następnej walce'
  }
};

const WITCHER_SCHOOLS = [
  { id: 'wilczej_szkoly', name: 'Szkoła Wilka', gearName: 'Wilczej Szkoły', attack: 3, defense: 0, critChance: 0, gearAttack: 0, gearDefense: 0, gearCritChance: 0, bonus: '+3 do obrażeń' },
  { id: 'gryfa', name: 'Szkoła Gryfa', gearName: 'Szkoły Gryfa', attack: 0, defense: 3, critChance: 0, gearAttack: -1, gearDefense: 2, gearCritChance: 0, bonus: '+3 do obrony' },
  { id: 'niedzwiedzia', name: 'Szkoła Niedźwiedzia', gearName: 'Szkoły Niedźwiedzia', attack: 0, defense: 5, critChance: 0, gearAttack: -3, gearDefense: 6, gearCritChance: -0.01, bonus: '+5 do obrony' },
  { id: 'kota', name: 'Szkoła Kota', gearName: 'Szkoły Kota', attack: 1, defense: 0, critChance: 0.02, gearAttack: 5, gearDefense: -3, gearCritChance: 0.04, bonus: '+1 do obrażeń i +2% szansy na krytyk' },
  { id: 'zmiji', name: 'Szkoła Żmii', gearName: 'Szkoły Żmii', attack: 0.5, defense: 0, critChance: 0.03, gearAttack: 2, gearDefense: -1, gearCritChance: 0.02, bonus: '+0.5 do obrażeń i +3% szansy na krytyk' },
  { id: 'mantikory', name: 'Szkoła Mantikory', gearName: 'Szkoły Mantikory', attack: 1, defense: 2, critChance: 0.01, gearAttack: 1, gearDefense: 1, gearCritChance: 0.01, bonus: '+1 do obrażeń, +2 do obrony i +1% szansy na krytyk' }
];
const GEAR_TIERS = [
  { id: 'podstawowy', name: 'Podstawowy', requiredLevel: 5, price: 650, attack: 18, defense: 14, critChance: 0.12 },
  { id: 'ulepszony', name: 'Ulepszony', requiredLevel: 10, price: 1800, attack: 30, defense: 25, critChance: 0.16 },
  { id: 'wysmienity', name: 'Wyśmienity', requiredLevel: 20, price: 4300, attack: 45, defense: 40, critChance: 0.20 },
  { id: 'mistrzowski', name: 'Mistrzowski', requiredLevel: 30, price: 8500, attack: 62, defense: 56, critChance: 0.24 },
  { id: 'wielkiego_mistrza', name: 'Wielkiego Mistrza', requiredLevel: 40, price: 12500, attack: 76, defense: 68, critChance: 0.27 },
  { id: 'legendarny', name: 'Legendarny', requiredLevel: 50, price: 18500, attack: 90, defense: 82, critChance: 0.30 }
];

for (const school of WITCHER_SCHOOLS) {
  for (const tier of GEAR_TIERS) {
    const suffix = `_${tier.id}`;
    ITEMS[`miecz_${school.id}${suffix}`] = {
      name: `Srebrny miecz ${school.gearName} — ${tier.name.toLowerCase()}`,
      price: tier.price,
      type: 'equipment',
      slot: 'weapon',
      attack: tier.attack + school.gearAttack,
      critChance: Math.min(0.35, tier.critChance + school.gearCritChance),
      requiredLevel: tier.requiredLevel,
      school: school.id,
      set: school.gearName,
      quality: tier.name
    };
    ITEMS[`zbroja_${school.id}${suffix}`] = {
      name: `Zbroja ${school.gearName} — ${tier.name.toLowerCase()}`,
      price: tier.price,
      type: 'equipment',
      slot: 'armor',
      defense: tier.defense + school.gearDefense,
      requiredLevel: tier.requiredLevel,
      school: school.id,
      set: school.gearName,
      quality: tier.name
    };
  }
}

const MUTAGEN_VARIANTS = [
  ['mutagen_czerwony_1', 'Mutagen czerwony I', { attack: 1 }],
  ['mutagen_czerwony_2', 'Mutagen czerwony II', { attack: 2 }],
  ['mutagen_czerwony_3', 'Mutagen czerwony III', { attack: 3 }],
  ['mutagen_czerwony_4', 'Mutagen czerwony IV', { attack: 2, critChance: 0.01 }],
  ['mutagen_czerwony_5', 'Mutagen czerwony V', { attack: 1, defense: 1 }],
  ['mutagen_zielony_1', 'Mutagen zielony I', { defense: 1 }],
  ['mutagen_zielony_2', 'Mutagen zielony II', { defense: 2 }],
  ['mutagen_zielony_3', 'Mutagen zielony III', { defense: 3 }],
  ['mutagen_zielony_4', 'Mutagen zielony IV', { defense: 2, attack: 1 }],
  ['mutagen_zielony_5', 'Mutagen zielony V', { defense: 1, critChance: 0.01 }],
  ['mutagen_niebieski_1', 'Mutagen niebieski I', { critChance: 0.01 }],
  ['mutagen_niebieski_2', 'Mutagen niebieski II', { critChance: 0.02 }],
  ['mutagen_niebieski_3', 'Mutagen niebieski III', { critChance: 0.03 }],
  ['mutagen_niebieski_4', 'Mutagen niebieski IV', { attack: 1, critChance: 0.01 }],
  ['mutagen_niebieski_5', 'Mutagen niebieski V', { defense: 1, critChance: 0.01 }]
];
const RANDOM_MUTAGEN_IDS = MUTAGEN_VARIANTS.map(([id, name, mutationBonus]) => {
  ITEMS[id] = { name, type: 'consumable', mutationBonus, craftOnly: true };
  return id;
});
const MUTAGEN_SLOT_LIMIT = 6;
const PVP_ACTIONS = ['atak', 'znak', 'obrona'];
const PVP_ROUNDS = 3;
const PVP_REWARD_RATE = 0.1;
const PVP_REWARD_CAP = 100;

ITEMS.grom = {
  name: 'Eliksir Grom',
  type: 'consumable',
  craftOnly: true,
  combatBuff: { attack: 8 },
  effectDescription: '+8 do obrażeń w następnej walce'
};
ITEMS.puszczyk = {
  name: 'Eliksir Puszczyk',
  type: 'consumable',
  craftOnly: true,
  combatBuff: { critChance: 0.08, defense: 2 },
  effectDescription: '+8% krytyka i +2 obrony w następnej walce'
};
ITEMS.olej_wiedzminski = {
  name: 'Olej wiedźmiński',
  type: 'consumable',
  craftOnly: true,
  combatBuff: { attack: 4, defense: 3 },
  effectDescription: '+4 do obrażeń i +3 obrony w następnej walce'
};

const CRAFTING_RECIPES = {
  mutageny: {
    name: 'Mieszanina mutagenów',
    ingredients: { mutagen: 3 },
    randomItems: RANDOM_MUTAGEN_IDS,
    description: 'Losowy mutagen z 15; jego użycie trwale wzmacnia statystyki.'
  },
  grom: {
    name: 'Eliksir Grom',
    ingredients: { esencja_upiora: 1, pioro_gryfa: 1 },
    output: 'grom',
    description: '+8 do obrażeń w następnej walce.'
  },
  puszczyk: {
    name: 'Eliksir Puszczyk',
    ingredients: { esencja_upiora: 1, ziola: 2 },
    output: 'puszczyk',
    description: '+8% szansy na krytyk i +2 obrony w następnej walce.'
  },
  olej: {
    name: 'Olej wiedźmiński',
    ingredients: { wilcza_skora: 1, zab_utopca: 2, ruda_srebra: 1 },
    output: 'olej_wiedzminski',
    description: '+4 do obrażeń i +3 obrony w następnej walce.'
  },
  jaskolka_wzmocniona: {
    name: 'Silna Jaskółka',
    ingredients: { ziola: 2, esencja_upiora: 1 },
    output: 'jaskolka_wzmocniona',
    description: 'Przywraca do 60 punktów zdrowia.',
    requiredLevel: 5
  },
  napar_mandragory: {
    name: 'Napar z mandragory',
    ingredients: { ziola: 3, korzen_mandragory: 1 },
    output: 'napar_mandragory',
    description: 'Przywraca do 45 punktów zdrowia; korzeń zdobędziesz dzięki zielarstwu.'
  },
  kocie_oko: {
    name: 'Eliksir Kocie Oko',
    ingredients: { oko_kruka: 2, glistnik: 1 },
    output: 'kocie_oko',
    description: '+12% szansy na krytyk w następnej walce.',
    requiredHerbalismLevel: 4
  },
  wywar_lesny: {
    name: 'Wywar Leśny',
    ingredients: { werbena: 2, ziola: 2, korzen_mandragory: 1 },
    output: 'wywar_lesny',
    description: '+5 do obrażeń i +2 obrony w następnej walce.',
    requiredHerbalismLevel: 3
  },
  czarna_krew: {
    name: 'Czarna Krew',
    ingredients: { tojad: 2, esencja_upiora: 1 },
    output: 'czarna_krew',
    description: '+3 do obrażeń i +7 obrony w następnej walce.',
    requiredHerbalismLevel: 5
  },
  biala_mewa: {
    name: 'Biała Mewa',
    ingredients: { glistnik: 2, werbena: 1, esencja_upiora: 1 },
    output: 'biala_mewa',
    description: '+4 do obrażeń i +6% szansy na krytyk w następnej walce.',
    requiredHerbalismLevel: 3
  }
};

const ITEM_ALIASES = {
  miecz_wilczej_szkoly: 'miecz_wilczej_szkoly_podstawowy',
  zbroja_wilczej_szkoly: 'zbroja_wilczej_szkoly_podstawowy',
  miecz_greif: 'miecz_gryfa_ulepszony',
  zbroja_greif: 'zbroja_gryfa_ulepszony',
  miecz_niedzwiedzia: 'miecz_niedzwiedzia_wysmienity',
  zbroja_niedzwiedzia: 'zbroja_niedzwiedzia_wysmienity'
};

function resolveItemId(itemId) {
  return ITEM_ALIASES[itemId] || itemId;
}

const LOOT_NAMES = {
  wilcza_skora: 'Wilcza skóra',
  wilczy_kl: 'Wilczy kieł',
  ziola: 'Zioła alchemiczne',
  korzen_mandragory: 'Korzeń mandragory',
  glistnik: 'Glistnik',
  werbena: 'Werbena',
  oko_kruka: 'Oko kruka',
  tojad: 'Tojad',
  pioro_gryfa: 'Pióro gryfa',
  mutagen: 'Mutagen',
  esencja_upiora: 'Esencja upiora',
  zab_utopca: 'Ząb utopca',
  ruda_srebra: 'Ruda srebra',
  trofeum_wilka: 'Trofeum wilka',
  trofeum_nekker: 'Trofeum nekkera',
  trofeum_utopca: 'Trofeum utopca',
  trofeum_ghula: 'Trofeum ghula',
  trofeum_harpii: 'Trofeum harpii',
  trofeum_gryfa: 'Trofeum gryfa',
  trofeum_upiora: 'Trofeum upiora'
};

const TROPHIES = {
  trofeum_wilka: { name: 'Trofeum wilka', price: 55 },
  trofeum_nekker: { name: 'Trofeum nekkera', price: 85 },
  trofeum_utopca: { name: 'Trofeum utopca', price: 110 },
  trofeum_ghula: { name: 'Trofeum ghula', price: 135 },
  trofeum_harpii: { name: 'Trofeum harpii', price: 190 },
  trofeum_gryfa: { name: 'Trofeum gryfa', price: 280 },
  trofeum_upiora: { name: 'Trofeum upiora', price: 240 }
};

for (const activity of [...Object.values(MISSIONS), ...Object.values(HUNTS)]) {
  if (!activity.trophy || !activity.trophyName) continue;
  LOOT_NAMES[activity.trophy] = activity.trophyName;
  TROPHIES[activity.trophy] ||= { name: activity.trophyName, price: activity.trophyPrice || 200 };
}

const LOOT_VALUES = {
  wilcza_skora: { name: 'Wilcza skóra', price: 8 },
  wilczy_kl: { name: 'Wilczy kieł', price: 7 },
  ziola: { name: 'Zioła alchemiczne', price: 5 },
  korzen_mandragory: { name: 'Korzeń mandragory', price: 14 },
  glistnik: { name: 'Glistnik', price: 9 },
  werbena: { name: 'Werbena', price: 12 },
  oko_kruka: { name: 'Oko kruka', price: 16 },
  tojad: { name: 'Tojad', price: 18 },
  pioro_gryfa: { name: 'Pióro gryfa', price: 18 },
  mutagen: { name: 'Mutagen', price: 28 },
  esencja_upiora: { name: 'Esencja upiora', price: 16 },
  zab_utopca: { name: 'Ząb utopca', price: 6 },
  ruda_srebra: { name: 'Ruda srebra', price: 20 }
};

for (const drop of Object.values(MISSION_DROPS)) {
  LOOT_NAMES[drop.id] = drop.name;
  LOOT_VALUES[drop.id] = { name: drop.name, price: drop.price };
}

const SELLABLE_ITEMS = { ...TROPHIES, ...LOOT_VALUES };

const MONSTER_TROPHIES = {
  wilki: 'trofeum_wilka',
  nekkerzy: 'trofeum_nekker',
  utopce: 'trofeum_utopca',
  ghule: 'trofeum_ghula',
  harpie: 'trofeum_harpii',
  gryfy: 'trofeum_gryfa'
};

const MONSTER_NAMES = {
  nekkerzy: 'nekkery',
  ghule: 'ghule',
  utopce: 'utopce',
  wraiths: 'upiory',
  alghule: 'alghule',
  wyverny: 'wyverny',
  harpie: 'harpie',
  gryfy: 'gryfy',
  golemy: 'golemy',
  endriagi: 'endriagi',
  wild_hunt_riders: 'jeźdźcy Dzikiego Gonu',
  wilki: 'wilki',
  noonwraiths: 'południce',
  katakany: 'katakany',
  bruxy: 'bruxy',
  draugi: 'draugi',
  bazyliszki: 'bazyliszki'
};

function ensureCharacter(user, username, now = Date.now()) {
  const isNewCharacter = !user.witcher;
  if (isNewCharacter) {
    user.witcher = {
      name: username || 'Wiedźmin',
      coins: 150,
      xp: 0,
      level: 1,
      health: 100,
      lastHealthUpdateAt: now,
      school: null,
      inventory: { srebrny_miecz: 1, miecz_stalowy: 1 },
      equipment: { weapon: 'miecz_stalowy', armor: null },
      herbalism: { level: 1, xp: 0, lastGatherAt: null },
      starterKitGranted: true,
      activeActivity: null
    };
  }

  const character = user.witcher;
  if (!character.name) character.name = username || 'Wiedźmin';
  if (typeof character.coins !== 'number') character.coins = 100;
  if (typeof character.xp !== 'number') character.xp = 0;
  if (typeof character.level !== 'number') character.level = 1;
  if (character.level >= MAX_LEVEL) {
    character.level = MAX_LEVEL;
    character.xp = 0;
  }
  if (!Number.isFinite(character.health)) character.health = 100;
  character.health = Math.max(0, Math.min(100, character.health));
  if (!Number.isFinite(character.lastHealthUpdateAt)) character.lastHealthUpdateAt = now;
  if (!isNewCharacter && !Object.hasOwn(character, 'school')) character.school = 'wilczej_szkoly';
  if (character.school !== null && !WITCHER_SCHOOLS.some(school => school.id === character.school)) character.school = null;
  if (!character.inventory || typeof character.inventory !== 'object') character.inventory = {};
  for (const [legacyId, currentId] of Object.entries(ITEM_ALIASES)) {
    if (character.inventory[legacyId] !== undefined) {
      character.inventory[currentId] = (character.inventory[currentId] || 0) + character.inventory[legacyId];
      delete character.inventory[legacyId];
    }
    if (character.equipment?.weapon === legacyId) character.equipment.weapon = currentId;
    if (character.equipment?.armor === legacyId) character.equipment.armor = currentId;
  }
  if (!character.equipment) character.equipment = { weapon: null, armor: null };
  if (!Object.hasOwn(character.equipment, 'weapon')) character.equipment.weapon = null;
  if (!Object.hasOwn(character.equipment, 'armor')) character.equipment.armor = null;
  if (character.starterKitGranted !== true) {
    character.coins += 150;
    character.inventory.srebrny_miecz = (character.inventory.srebrny_miecz || 0) + 1;
    character.inventory.miecz_stalowy = (character.inventory.miecz_stalowy || 0) + 1;
    if (!character.equipment.weapon) character.equipment.weapon = 'miecz_stalowy';
    character.starterKitGranted = true;
  }
  if (!character.mutationBonuses || typeof character.mutationBonuses !== 'object') {
    character.mutationBonuses = { attack: 0, defense: 0, critChance: 0 };
  } else {
    character.mutationBonuses.attack = Number(character.mutationBonuses.attack) || 0;
    character.mutationBonuses.defense = Number(character.mutationBonuses.defense) || 0;
    character.mutationBonuses.critChance = Number(character.mutationBonuses.critChance) || 0;
  }
  if (character.combatBuff !== null && typeof character.combatBuff !== 'object') character.combatBuff = null;
  if (character.combatBuff === undefined) character.combatBuff = null;
  if (!character.mutationBonuses || typeof character.mutationBonuses !== 'object') {
    character.mutationBonuses = { attack: 0, defense: 0, critChance: 0 };
  }
  if (!Array.isArray(character.equippedMutagens)) character.equippedMutagens = [];
  character.equippedMutagens = character.equippedMutagens
    .filter(itemId => ITEMS[itemId]?.mutationBonus)
    .slice(0, MUTAGEN_SLOT_LIMIT);
  if (!Array.isArray(character.recentMissionIds)) character.recentMissionIds = [];
  character.recentMissionIds = character.recentMissionIds
    .filter(missionId => Object.hasOwn(MISSIONS, missionId))
    .slice(-RECENT_MISSION_LIMIT);
  if (!Array.isArray(character.completedHunts)) character.completedHunts = [];
  character.completedHunts = [...new Set(character.completedHunts)]
    .filter(huntId => Object.hasOwn(HUNTS, huntId));
  if (!character.pvpStats || typeof character.pvpStats !== 'object') character.pvpStats = {};
  for (const stat of ['wins', 'losses', 'draws']) {
    character.pvpStats[stat] = Number.isInteger(character.pvpStats[stat])
      ? Math.max(0, character.pvpStats[stat])
      : 0;
  }
  character.pvpStats.rating = Number.isFinite(character.pvpStats.rating)
    ? Math.max(0, character.pvpStats.rating)
    : PVP_STARTING_RATING;
  if (!character.herbalism || typeof character.herbalism !== 'object') {
    character.herbalism = { level: 1, xp: 0, lastGatherAt: null };
  }
  character.herbalism.level = Number.isInteger(character.herbalism.level)
    ? Math.max(1, Math.min(HERBALISM_MAX_LEVEL, character.herbalism.level))
    : 1;
  character.herbalism.xp = Number.isFinite(character.herbalism.xp)
    ? Math.max(0, character.herbalism.xp)
    : 0;
  if (character.herbalism.level >= HERBALISM_MAX_LEVEL) character.herbalism.xp = 0;
  if (!Number.isFinite(character.herbalism.lastGatherAt)) character.herbalism.lastGatherAt = null;
  if (character.activeActivity === undefined) character.activeActivity = null;
  regenerateHealth(character, now);
  return character;
}

function regenerateHealth(character, now = Date.now()) {
  if (character.activeActivity) return 0;

  const previousUpdate = character.lastHealthUpdateAt;
  if (!Number.isFinite(previousUpdate) || now < previousUpdate) {
    character.lastHealthUpdateAt = now;
    return 0;
  }
  if (character.health >= 100) return 0;

  const elapsedMinutes = (now - previousUpdate) / MINUTE;
  const oldHealth = character.health;
  character.health = Math.min(100, character.health + elapsedMinutes * HEALTH_REGEN_PER_MINUTE);
  character.lastHealthUpdateAt = now;
  return character.health - oldHealth;
}

function getHerbalismStatus(character, now = Date.now()) {
  const herbalism = character.herbalism || { level: 1, xp: 0, lastGatherAt: null };
  const cooldownRemaining = Number.isFinite(herbalism.lastGatherAt)
    ? Math.max(0, HERBALISM_COOLDOWN - (now - herbalism.lastGatherAt))
    : 0;
  return {
    level: herbalism.level || 1,
    xp: herbalism.xp || 0,
    xpToNextLevel: (herbalism.level || 1) >= HERBALISM_MAX_LEVEL ? 0 : HERBALISM_XP_PER_LEVEL,
    cooldownRemaining,
    readyAt: cooldownRemaining ? now + cooldownRemaining : null
  };
}

function gatherHerbs(character, now = Date.now(), random = Math.random) {
  if (!character.school) return { ok: false, reason: 'school' };
  if (character.activeActivity) return { ok: false, reason: 'busy' };

  const status = getHerbalismStatus(character, now);
  if (status.cooldownRemaining > 0) {
    return { ok: false, reason: 'cooldown', remaining: status.cooldownRemaining };
  }

  const herbalism = character.herbalism || (character.herbalism = { level: 1, xp: 0, lastGatherAt: null });
  const herbs = [{ id: 'ziola', count: randomBetween(random, 2, 4) }];
  const rareHerbs = [
    { id: 'korzen_mandragory', requiredLevel: 1, baseChance: 0.05, chancePerLevel: 0.05, maxChance: 0.25 },
    { id: 'glistnik', requiredLevel: 2, baseChance: 0.08, chancePerLevel: 0.04, maxChance: 0.20 },
    { id: 'werbena', requiredLevel: 3, baseChance: 0.08, chancePerLevel: 0.04, maxChance: 0.20 },
    { id: 'oko_kruka', requiredLevel: 4, baseChance: 0.05, chancePerLevel: 0.04, maxChance: 0.17 },
    { id: 'tojad', requiredLevel: 5, baseChance: 0.04, chancePerLevel: 0.04, maxChance: 0.16 }
  ];
  for (const herb of rareHerbs) {
    if (herbalism.level < herb.requiredLevel) continue;
    const chance = Math.min(herb.maxChance,
      herb.baseChance + (herbalism.level - herb.requiredLevel) * herb.chancePerLevel);
    if (random() < chance) herbs.push({ id: herb.id, count: 1 });
  }
  for (const herb of herbs) {
    character.inventory[herb.id] = (character.inventory[herb.id] || 0) + herb.count;
  }

  const previousLevel = herbalism.level;
  herbalism.xp += HERBALISM_XP_PER_HARVEST;
  while (herbalism.level < HERBALISM_MAX_LEVEL && herbalism.xp >= HERBALISM_XP_PER_LEVEL) {
    herbalism.xp -= HERBALISM_XP_PER_LEVEL;
    herbalism.level++;
  }
  if (herbalism.level >= HERBALISM_MAX_LEVEL) herbalism.xp = 0;
  herbalism.lastGatherAt = now;

  return {
    ok: true,
    herbs,
    xpGained: HERBALISM_XP_PER_HARVEST,
    level: herbalism.level,
    levelsGained: herbalism.level - previousLevel,
    cooldownEndsAt: now + HERBALISM_COOLDOWN
  };
}

function chooseSchool(character, schoolId) {
  const school = WITCHER_SCHOOLS.find(entry => entry.id === schoolId);
  if (!school) return { ok: false, reason: 'unknown' };
  if (character.school) return { ok: false, reason: 'chosen', school: WITCHER_SCHOOLS.find(entry => entry.id === character.school) };
  character.school = school.id;
  return { ok: true, school };
}

function xpToNextLevel(level) {
  return 100 + Math.max(0, level - 1) * 50;
}

function addProgress(character, gold, xp) {
  character.coins += gold;
  let levelsGained = 0;

  if (character.level < MAX_LEVEL) character.xp += xp;
  while (character.level < MAX_LEVEL && character.xp >= xpToNextLevel(character.level)) {
    character.xp -= xpToNextLevel(character.level);
    character.level++;
    levelsGained++;
  }
  if (character.level >= MAX_LEVEL) {
    character.level = MAX_LEVEL;
    character.xp = 0;
  }

  return levelsGained;
}

function getHuntStatus(character, huntId) {
  const progressionIndex = HUNT_PROGRESSION.indexOf(huntId);
  if (progressionIndex < 0) return null;

  const completedHunts = character.completedHunts || [];
  const prerequisiteId = progressionIndex > 0 ? HUNT_PROGRESSION[progressionIndex - 1] : null;
  const completed = completedHunts.includes(huntId);
  const unlocked = completed || !prerequisiteId || completedHunts.includes(prerequisiteId);
  const levelMet = character.level >= HUNTS[huntId].requiredLevel;
  return {
    completed,
    unlocked,
    available: unlocked && levelMet,
    levelMet,
    prerequisiteId,
    requiredLevel: HUNTS[huntId].requiredLevel
  };
}

function startActivity(character, kind, activityId, now = Date.now(), random = Math.random) {
  if (!character.school) return { ok: false, reason: 'school' };
  const activities = kind === 'mission' ? MISSIONS : kind === 'hunt' ? HUNTS : null;
  if (!activities || !activities[activityId]) return { ok: false, reason: 'unknown' };
  if (character.activeActivity) return { ok: false, reason: 'busy' };

  const activity = activities[activityId];
  if (kind === 'hunt') {
    const status = getHuntStatus(character, activityId);
    if (!status.unlocked) {
      return {
        ok: false,
        reason: 'prerequisite',
        prerequisiteId: status.prerequisiteId,
        prerequisiteName: HUNTS[status.prerequisiteId].name
      };
    }
  }
  if (kind === 'hunt' && character.level < (activity.requiredLevel || 1)) {
    return { ok: false, reason: 'level', requiredLevel: activity.requiredLevel || 1 };
  }
  regenerateHealth(character, now);
  const duration = kind === 'mission'
    ? randomBetween(random,
      Math.max(MINUTE, Math.floor(activity.duration * 0.8 / MINUTE) * MINUTE),
      Math.ceil(activity.duration * 1.2 / MINUTE) * MINUTE)
    : activity.duration;
  character.activeActivity = {
    kind,
    activityId,
    startedAt: now,
    duration,
    finishesAt: now + duration,
    levelAtStart: character.level
  };
  character.lastHealthUpdateAt = now;
  return { ok: true, activity, duration, finishesAt: character.activeActivity.finishesAt };
}

function startRandomMission(character, now = Date.now(), random = Math.random) {
  if (character.activeActivity) return { ok: false, reason: 'busy' };

  const missions = Object.entries(MISSIONS);
  const levelRange = character.level <= 5 ? 3 : 5;
  const maximumLevelAhead = character.level <= 5 ? 3 : 2;
  const nearbyMissions = missions.filter(([, activity]) =>
    Math.abs(activity.recommendedLevel - character.level) <= levelRange &&
    activity.recommendedLevel <= character.level + maximumLevelAhead
  );
  let candidates = nearbyMissions.length ? nearbyMissions : missions
    .slice()
    .sort((left, right) =>
      Math.abs(left[1].recommendedLevel - character.level) - Math.abs(right[1].recommendedLevel - character.level)
    )
    .slice(0, 1);

  const recentMissionIds = character.recentMissionIds || [];
  const freshCandidates = candidates.filter(([missionId]) => !recentMissionIds.includes(missionId));
    if (freshCandidates.length) {
      const nearestLevel = Math.min(...freshCandidates.map(([, activity]) =>
        Math.abs(activity.recommendedLevel - character.level)
      ));
      candidates = freshCandidates.filter(([, activity]) =>
        Math.abs(activity.recommendedLevel - character.level) <= nearestLevel + 2
      );
    }
    else {
    const otherMissions = missions.filter(([missionId]) => !recentMissionIds.includes(missionId));
    if (otherMissions.length) {
        const levelAppropriateMissions = otherMissions.filter(([, activity]) =>
          activity.recommendedLevel <= character.level + maximumLevelAhead
        );
        const fallbackMissions = levelAppropriateMissions.length ? levelAppropriateMissions : otherMissions;
        const nearestLevel = Math.min(...fallbackMissions.map(([, activity]) =>
          Math.abs(activity.recommendedLevel - character.level)
        ));
        candidates = fallbackMissions.filter(([, activity]) =>
          Math.abs(activity.recommendedLevel - character.level) === nearestLevel
        );
    }
  }

  const [activityId] = candidates[Math.floor(Math.max(0, Math.min(0.999999999, random())) * candidates.length)];
  const started = startActivity(character, 'mission', activityId, now, random);
  if (!started.ok) return started;
  character.recentMissionIds = [...recentMissionIds, activityId].slice(-RECENT_MISSION_LIMIT);
  return { ...started, activityId };
}

function randomBetween(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function getMutationBonuses(character) {
  const bonuses = {
    attack: character.mutationBonuses?.attack || 0,
    defense: character.mutationBonuses?.defense || 0,
    critChance: character.mutationBonuses?.critChance || 0
  };
  for (const itemId of character.equippedMutagens || []) {
    const mutationBonus = ITEMS[itemId]?.mutationBonus;
    if (!mutationBonus) continue;
    for (const [stat, amount] of Object.entries(mutationBonus)) {
      bonuses[stat] = (bonuses[stat] || 0) + amount;
    }
  }
  return bonuses;
}

function resolvePvPRound(firstAction, secondAction) {
  if (!PVP_ACTIONS.includes(firstAction) || !PVP_ACTIONS.includes(secondAction)) {
    return { ok: false, reason: 'action' };
  }
  if (firstAction === secondAction) return { ok: true, winner: 0, draw: true };

  const defeats = { obrona: 'atak', atak: 'znak', znak: 'obrona' };
  return {
    ok: true,
    winner: defeats[firstAction] === secondAction ? 1 : 2,
    draw: false
  };
}

function settlePvP(winner, loser, winnerScore, loserScore) {
  if (winnerScore === loserScore) return { ok: false, reason: 'draw', reward: 0 };
  if (winnerScore < loserScore) return { ok: false, reason: 'winner' };

  const reward = Math.min(PVP_REWARD_CAP, Math.floor(Math.max(0, loser.coins) * PVP_REWARD_RATE));
  loser.coins -= reward;
  winner.coins += reward;
  return { ok: true, reward };
}

function recordPvPMatch(first, second, firstScore, secondScore) {
  if (firstScore === secondScore) {
    first.pvpStats.draws++;
    second.pvpStats.draws++;
  } else {
    const firstWon = firstScore > secondScore;
    first.pvpStats[firstWon ? 'wins' : 'losses']++;
    second.pvpStats[firstWon ? 'losses' : 'wins']++;
  }

  const firstExpected = 1 / (1 + 10 ** ((second.pvpStats.rating - first.pvpStats.rating) / 400));
  const secondExpected = 1 - firstExpected;
  const firstActual = firstScore === secondScore ? 0.5 : firstScore > secondScore ? 1 : 0;
  const secondActual = 1 - firstActual;
  const firstRatingChange = Math.round(PVP_RATING_K_FACTOR * (firstActual - firstExpected));
  const secondRatingChange = Math.round(PVP_RATING_K_FACTOR * (secondActual - secondExpected));
  first.pvpStats.rating += firstRatingChange;
  second.pvpStats.rating += secondRatingChange;
  return { ok: true, firstRatingChange, secondRatingChange };
}

function canPlayRankedPvP(lastRankedMatchAt, now = Date.now()) {
  return !Number.isFinite(lastRankedMatchAt) ||
    now - lastRankedMatchAt >= PVP_RANKED_MATCH_COOLDOWN;
}

function simulateBattle(character, activity, kind, random) {
  const monsterType = kind === 'hunt'
    ? activity.monsterTypes[Math.floor(random() * activity.monsterTypes.length)]
    : activity.monsterType;
  const monstersEncountered = randomBetween(random, activity.minMonsters, activity.maxMonsters);
  const monsterName = activity.boss || MONSTER_NAMES[monsterType] || monsterType;
  const weapon = ITEMS[character.equipment.weapon];
  const armor = ITEMS[character.equipment.armor];
  const school = WITCHER_SCHOOLS.find(entry => entry.id === character.school);
  const mutationBonuses = getMutationBonuses(character);
  const combatBuff = character.combatBuff || {};
  const recommendedLevel = kind === 'mission' ? activity.recommendedLevel || 1 : activity.requiredLevel || 1;
  const levelGap = Math.max(0, recommendedLevel - character.level);
  const enemyGroupMultiplier = kind === 'hunt' ? Math.max(1, Math.ceil(monstersEncountered / 10)) : 1;
  const bossHealthMultiplier = kind === 'hunt' ? HUNT_BOSS_HEALTH_MULTIPLIER : 1;
  const enemyMaxHealth = Math.ceil((activity.monsterHealth || 24 + activity.damage * 2) *
    enemyGroupMultiplier * bossHealthMultiplier) +
    Math.ceil(levelGap * (20 + activity.damage * 3));
  let enemyHealth = enemyMaxHealth;
  let playerHealth = character.health;
  let damageDealt = 0;
  let damageTaken = 0;
  let rounds = 0;
  const combatLog = [];

  while (enemyHealth > 0 && playerHealth > 0 && rounds < 20) {
    rounds++;
    let playerDamage = Math.max(1,
      6 + character.level * 2 + (weapon?.attack || 0) + (school?.attack || 0) +
      mutationBonuses.attack + (combatBuff.attack || 0) + randomBetween(random, 0, 4));
    const critical = random() < Math.min(0.75,
      (weapon?.critChance || 0) + (school?.critChance || 0) +
      mutationBonuses.critChance + (combatBuff.critChance || 0));
    if (critical) playerDamage = Math.floor(playerDamage * 1.5);
    enemyHealth = Math.max(0, enemyHealth - playerDamage);
    damageDealt += playerDamage;

    if (rounds <= 5) {
      combatLog.push(`${character.name} ${critical ? 'zadaje cios krytyczny' : 'uderza'} ${monsterName} za **${playerDamage}** obrażeń (${enemyHealth}/${enemyMaxHealth} PŻ potwora).`);
    }
    if (enemyHealth <= 0) break;

    const defense = (armor?.defense || 0) + (school?.defense || 0) +
      mutationBonuses.defense + (combatBuff.defense || 0);
    const incomingDamage = Math.max(1,
      Math.ceil(activity.damage / 4) + randomBetween(random, 0, 2) -
      Math.floor(defense / (kind === 'hunt' ? 8 : 5)));
    const bossPressure = kind === 'hunt' ? Math.ceil(activity.damage / 5) : 0;
    const scaledIncomingDamage = Math.max(1, Math.ceil(
      (incomingDamage + Math.ceil(levelGap * activity.damage / 6) + bossPressure) *
      (kind === 'hunt' ? HUNT_BOSS_DAMAGE_MULTIPLIER : 1)
    ));
    playerHealth = Math.max(0, playerHealth - scaledIncomingDamage);
    damageTaken += scaledIncomingDamage;
    if (rounds <= 5) combatLog.push(`${monsterName} kontratakuje za **${scaledIncomingDamage}** obrażeń (${playerHealth}/100 PŻ wiedźmina).`);
  }

  const victory = enemyHealth <= 0;
  const monstersDefeated = victory ? monstersEncountered : 0;
  character.health = playerHealth;
  if (rounds > 5) combatLog.push(`Walka trwała ${rounds} rund. ${victory ? 'Potwór został pokonany.' : 'Wiedźmin nie zdołał pokonać potwora.'}`);

  return {
    victory,
    monsterType,
    monstersEncountered,
    monstersDefeated,
    damageDealt,
    damageTaken,
    healthRemaining: playerHealth,
    rounds,
    combatLog
  };
}

function completeActivity(character, now = Date.now(), random = Math.random) {
  const active = character.activeActivity;
  if (!active || now < active.finishesAt) return null;

  const activities = active.kind === 'mission' ? MISSIONS : HUNTS;
  const activity = activities[active.activityId];
  if (!activity) {
    character.activeActivity = null;
    return null;
  }

  const combat = simulateBattle(character, activity, active.kind, random);
  const combatBuffUsed = character.combatBuff?.name || null;
  character.combatBuff = null;
  const levelAtStart = active.levelAtStart || character.level;
  const rewardMultiplier = active.kind === 'mission'
    ? 1 + Math.min(15, Math.max(0, levelAtStart - 1)) * 0.05
    : 1;
  let gold = Math.floor(random() * (activity.maxGold - activity.minGold + 1)) + activity.minGold;
  let xp = activity.xp;
  gold = Math.floor(gold * rewardMultiplier);
  xp = Math.floor(xp * rewardMultiplier);
  if (!combat.victory) {
    gold = Math.floor(gold * 0.2);
    xp = Math.max(1, Math.floor(xp * 0.1));
  }

  const loot = [];
  const lootChance = active.kind === 'hunt' ? 1 : activity.lootChance;
  const lootCount = !combat.victory
    ? 0
    : active.kind === 'hunt'
      ? randomBetween(random, activity.minLoot, activity.maxLoot)
      : (random() < lootChance ? 1 : 0);

  for (let drop = 0; drop < lootCount; drop++) {
    const lootId = activity.loot[Math.floor(random() * activity.loot.length)];
    character.inventory[lootId] = (character.inventory[lootId] || 0) + 1;
    loot.push(lootId);
  }

  const monstersDefeated = combat.monstersDefeated;
  const monsterType = combat.monsterType;
  const trophyId = activity.trophy || (active.kind === 'hunt' ? MONSTER_TROPHIES[monsterType] : null);
  const trophies = [];
  if (combat.victory && trophyId && random() < (activity.trophyChance || 0)) {
    const trophyCount = active.kind === 'hunt'
      ? Math.floor(random() * (activity.maxTrophies - activity.minTrophies + 1)) + activity.minTrophies
      : 1;
    character.inventory[trophyId] = (character.inventory[trophyId] || 0) + trophyCount;
    for (let index = 0; index < trophyCount; index++) trophies.push(trophyId);
    loot.push(...trophies);
  }
  const levelsGained = addProgress(character, gold, xp);
  let unlockedHuntName = null;
  if (active.kind === 'hunt' && combat.victory) {
    if (!character.completedHunts.includes(active.activityId)) {
      character.completedHunts.push(active.activityId);
    }
    const progressionIndex = HUNT_PROGRESSION.indexOf(active.activityId);
    const nextHuntId = HUNT_PROGRESSION[progressionIndex + 1];
    if (nextHuntId && !character.completedHunts.includes(nextHuntId)) {
      unlockedHuntName = HUNTS[nextHuntId].name;
    }
  }
  character.activeActivity = null;
  character.lastHealthUpdateAt = now;

  return {
    kind: active.kind,
    name: activity.name,
    gold,
    xp,
    rewardMultiplier,
    healthLost: combat.damageTaken,
    healthRemaining: combat.healthRemaining,
    victory: combat.victory,
    damageDealt: combat.damageDealt,
    rounds: combat.rounds,
    combatLog: combat.combatLog,
    loot,
    monstersDefeated,
    monsterType,
    boss: active.kind === 'hunt' ? activity.boss || null : null,
    levelsGained,
    level: character.level,
    unlockedHuntName,
    combatBuffUsed
  };
}

function craftItem(character, recipeId, random = Math.random) {
  const recipe = CRAFTING_RECIPES[recipeId];
  if (!recipe) return { ok: false, reason: 'unknown' };
  const outputId = recipe.randomItems
    ? recipe.randomItems[Math.min(recipe.randomItems.length - 1, Math.floor(Math.max(0, random()) * recipe.randomItems.length))]
    : recipe.output;
  const item = ITEMS[outputId];
  const requiredLevel = recipe.requiredLevel || item.requiredLevel || 1;
  if (character.level < requiredLevel) return { ok: false, reason: 'level', requiredLevel };
  const requiredHerbalismLevel = recipe.requiredHerbalismLevel || 1;
  const herbalismLevel = character.herbalism?.level || 1;
  if (herbalismLevel < requiredHerbalismLevel) {
    return { ok: false, reason: 'herbalism', requiredLevel: requiredHerbalismLevel };
  }

  for (const [ingredientId, required] of Object.entries(recipe.ingredients)) {
    const owned = character.inventory[ingredientId] || 0;
    if (owned < required) return { ok: false, reason: 'ingredients', ingredientId, required, owned };
  }

  for (const [ingredientId, required] of Object.entries(recipe.ingredients)) {
    character.inventory[ingredientId] -= required;
  }
  character.inventory[outputId] = (character.inventory[outputId] || 0) + 1;
  return { ok: true, recipe, item, itemId: outputId, count: character.inventory[outputId] };
}

function buyItem(character, itemId) {
  itemId = resolveItemId(itemId);
  const item = ITEMS[itemId];
  if (!item) return { ok: false, reason: 'unknown' };
  if (item.craftOnly) return { ok: false, reason: 'craft' };
  if (item.school && item.school !== character.school) return { ok: false, reason: 'school', requiredSchool: item.school };
  if (!character.school) return { ok: false, reason: 'school' };
  if (item.school && !character.school) return { ok: false, reason: 'school', requiredSchool: item.school };
  const requiredLevel = item.requiredLevel || 1;
  if (character.level < requiredLevel) return { ok: false, reason: 'level', requiredLevel };
  if (character.coins < item.price) return { ok: false, reason: 'funds', missing: item.price - character.coins };

  character.coins -= item.price;
  character.inventory[itemId] = (character.inventory[itemId] || 0) + 1;
  return { ok: true, item, count: character.inventory[itemId] };
}

function equipItem(character, itemId) {
  itemId = resolveItemId(itemId);
  const item = ITEMS[itemId];
  if (item?.mutationBonus) return equipMutagen(character, itemId);
  if (!item || item.type !== 'equipment') return { ok: false, reason: 'unknown' };
  if (item.school && item.school !== character.school) return { ok: false, reason: 'school', requiredSchool: item.school };
  if (!character.school) return { ok: false, reason: 'school' };
  if (character.level < (item.requiredLevel || 1)) return { ok: false, reason: 'level', requiredLevel: item.requiredLevel || 1 };
  if (!character.inventory[itemId]) return { ok: false, reason: 'missing' };

  character.equipment[item.slot] = itemId;
  return { ok: true, item };
}

function equipMutagen(character, itemId) {
  const item = ITEMS[itemId];
  if (!item?.mutationBonus) return { ok: false, reason: 'unknown' };
  if (!character.inventory[itemId]) return { ok: false, reason: 'missing' };
  if (!Array.isArray(character.equippedMutagens)) character.equippedMutagens = [];
  if (character.equippedMutagens.length >= MUTAGEN_SLOT_LIMIT) {
    return { ok: false, reason: 'slots', limit: MUTAGEN_SLOT_LIMIT };
  }
  character.inventory[itemId]--;
  character.equippedMutagens.push(itemId);
  return { ok: true, item, count: character.equippedMutagens.length };
}

function removeMutagen(character, itemId) {
  const equippedMutagens = character.equippedMutagens || [];
  const index = equippedMutagens.indexOf(itemId);
  if (index < 0) return { ok: false, reason: 'missing' };
  equippedMutagens.splice(index, 1);
  character.inventory[itemId] = (character.inventory[itemId] || 0) + 1;
  return { ok: true, item: ITEMS[itemId], count: equippedMutagens.length };
}

function useItem(character, itemId) {
  const item = ITEMS[itemId];
  if (!item || item.type !== 'consumable') return { ok: false, reason: 'unknown' };
  if (!character.inventory[itemId]) return { ok: false, reason: 'missing' };

  if (item.mutationBonus) return { ok: false, reason: 'equip', item };
  if (item.combatBuff) {
    if (character.combatBuff) return { ok: false, reason: 'buff_active', buffName: character.combatBuff.name };
    character.combatBuff = { ...item.combatBuff, name: item.name };
    character.inventory[itemId]--;
    return { ok: true, item, combatBuff: item.combatBuff };
  }
  if (!item.heal) return { ok: false, reason: 'unknown' };
  if (character.health >= 100) return { ok: false, reason: 'healthy' };

  const oldHealth = character.health;
  character.health = Math.min(100, character.health + item.heal);
  character.inventory[itemId]--;
  return { ok: true, item, healed: character.health - oldHealth, health: character.health };
}

function sellLoot(character, itemId, quantity) {
  if (itemId === 'wszystko' || itemId === 'all') {
    const sold = [];
    let gold = 0;
    for (const [id, item] of Object.entries(SELLABLE_ITEMS)) {
      const count = character.inventory[id] || 0;
      if (count < 1) continue;
      const value = count * item.price;
      character.inventory[id] = 0;
      gold += value;
      sold.push({ id, count, gold: value });
    }
    if (sold.length === 0) return { ok: false, reason: 'empty' };
    character.coins += gold;
    return { ok: true, sold, gold };
  }

  const item = SELLABLE_ITEMS[itemId];
  if (!item) return { ok: false, reason: 'unknown' };
  const owned = character.inventory[itemId] || 0;
  const amount = quantity === undefined ? owned : Number(quantity);
  if (!Number.isInteger(amount) || amount < 1) return { ok: false, reason: 'quantity' };
  if (owned < amount) return { ok: false, reason: 'missing', owned };

  const gold = amount * item.price;
  character.inventory[itemId] -= amount;
  character.coins += gold;
  return { ok: true, sold: [{ id: itemId, count: amount, gold }], gold };
}

module.exports = {
  HUNTS,
  HUNT_PROGRESSION,
  ITEMS,
  MAX_LEVEL,
  HEALTH_REGEN_PER_MINUTE,
  HERBALISM_COOLDOWN,
  HERBALISM_MAX_LEVEL,
  HERBALISM_XP_PER_HARVEST,
  HERBALISM_XP_PER_LEVEL,
  LOOT_NAMES,
  MONSTER_NAMES,
  MISSIONS,
  PVP_ACTIONS,
  PVP_STARTING_RATING,
  PVP_RATING_K_FACTOR,
  PVP_RANKED_MATCH_COOLDOWN,
  PVP_REWARD_CAP,
  PVP_ROUNDS,
  PVP_REWARD_RATE,
  WITCHER_SCHOOLS,
  SELLABLE_ITEMS,
  TROPHIES,
  CRAFTING_RECIPES,
  MUTAGEN_SLOT_LIMIT,
  addProgress,
  buyItem,
  completeActivity,
  chooseSchool,
  craftItem,
  gatherHerbs,
  ensureCharacter,
  equipItem,
  getMutationBonuses,
  getHuntStatus,
  getHerbalismStatus,
  removeMutagen,
  resolvePvPRound,
  recordPvPMatch,
  canPlayRankedPvP,
  regenerateHealth,
  settlePvP,
  startActivity,
  startRandomMission,
  sellLoot,
  useItem,
  xpToNextLevel
};
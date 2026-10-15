const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, GatewayIntentBits, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const Rpg = require('./witcher-rpg');

const DATA_DIRECTORY = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : __dirname;
const DATA_FILE = path.join(DATA_DIRECTORY, 'data.json');
const BACKUP_FILE = `${DATA_FILE}.bak`;
const CHANNEL_NAME = 'cwelgar';
const TARGET_GUILD_ID = process.env.DISCORD_GUILD_ID?.trim();
const COMMAND_COOLDOWN_MS = 2000;
const COMMAND_COOLDOWN_NOTICE_MS = 10000;
const activePvPUsers = new Set();
const commandCooldowns = new Map();
const commandCooldownNotices = new Map();
const PVP_ACTION_LABELS = { atak: 'Atak', znak: 'Znak', obrona: 'Obrona' };
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

fs.mkdirSync(DATA_DIRECTORY, { recursive: true });

function loadData() {
  try {
    const loaded = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded) ||
        !loaded.users || typeof loaded.users !== 'object' || Array.isArray(loaded.users)) {
      throw new Error('Nieprawidłowy format data.json: oczekiwano obiektu z mapą users.');
    }
    return loaded;
  } catch (error) {
    if (error.code === 'ENOENT') return { users: {} };
    console.error(`Nie udało się wczytać danych: ${error.message}`);
    throw error;
  }
}

let data = loadData();
if (!data.users || typeof data.users !== 'object') data.users = {};
if (!data.pvpPairCooldowns || typeof data.pvpPairCooldowns !== 'object' || Array.isArray(data.pvpPairCooldowns)) {
  data.pvpPairCooldowns = {};
}

function saveData() {
  const temporaryFile = `${DATA_FILE}.tmp`;
  if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2));
  fs.renameSync(temporaryFile, DATA_FILE);
}

function ensurePlayer(userId, username) {
  const isNewPlayer = !data.users[userId]?.witcher;
  if (!data.users[userId] || typeof data.users[userId] !== 'object') data.users[userId] = {};
  const user = data.users[userId];
  const previousCharacter = user.witcher ? JSON.stringify(user.witcher) : null;
  const character = Rpg.ensureCharacter(user, username);
  if (isNewPlayer || previousCharacter !== JSON.stringify(character)) saveData();
  return character;
}

let migratedProfiles = false;
for (const user of Object.values(data.users)) {
  if (!user || typeof user !== 'object') continue;
  if (!user.witcher) {
    const character = Rpg.ensureCharacter(user);
    character.school = 'wilczej_szkoly';
    migratedProfiles = true;
  } else if (!Object.hasOwn(user.witcher, 'school') || !user.witcher.starterKitGranted ||
      !Object.hasOwn(user.witcher.equipment || {}, 'steelWeapon') ||
      !Object.hasOwn(user.witcher.equipment || {}, 'silverWeapon')) {
    Rpg.ensureCharacter(user);
    migratedProfiles = true;
  }
}
if (migratedProfiles) saveData();

function durationText(milliseconds) {
  if (milliseconds >= 60 * 60 * 1000) return `${milliseconds / (60 * 60 * 1000)} godz.`;
  const minutes = Math.round(milliseconds / 60000);
  return `${minutes} min`;
}

function catalogMatchMessage(matches, catalog, subject) {
  if (!matches?.length) return null;
  const options = matches.slice(0, 5).map(id => `\`${id}\` — ${catalog[id]?.name || id}`);
  const remaining = matches.length > options.length ? `\n…i ${matches.length - options.length} kolejnych.` : '';
  return `Ta nazwa pasuje do kilku ${subject}. Użyj jednego z ID:\n${options.join('\n')}${remaining}`;
}

function catalogEmbed(listings, pageNumber, totalPages, character, title, footer) {
  return new EmbedBuilder()
    .setTitle(`${title} · strona ${pageNumber}/${totalPages}`)
    .setDescription(`💰 Saldo: **${character.coins} koron**`)
    .addFields(listings.slice((pageNumber - 1) * 12, pageNumber * 12))
    .setFooter({ text: footer })
    .setColor(0x547a46);
}

function catalogComponents(pageNumber, totalPages, menuId) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`${menuId}:page`)
    .setPlaceholder('Przejdź do strony…')
    .addOptions(Array.from({ length: totalPages }, (_, index) => ({
      label: `Strona ${index + 1}`,
      value: String(index + 1),
      default: index + 1 === pageNumber
    })));
  const navigation = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${menuId}:previous`)
      .setLabel('Poprzednia')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageNumber <= 1),
    new ButtonBuilder()
      .setCustomId(`${menuId}:next`)
      .setLabel('Następna')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageNumber >= totalPages)
  );
  return [new ActionRowBuilder().addComponents(select), navigation];
}

function createHelpEmbed(pageNumber) {
  const pages = [
    {
      title: '🐺 Wiedźmińskie RPG — pomoc · 1/2',
      description: 'Postać, kontrakty, wyprawy i codzienne zlecenia.',
      fields: [
        {
          name: '1. Postać',
          value: '`!wiedzmin` — utwórz postać (tylko raz).\n`!status` — sprawdź profil, wyposażenie, eliksiry i zatrucie.\n`!szkoly`, `!szkola <nazwa>` — wybierz szkołę; wybór jest stały.\n`!imie <nazwa>` — nazwij postać.'
        },
        {
          name: '2. Kontrakty i wyprawy',
          value: '`!misje`, `!misja` — informacje i przyjęcie losowego kontraktu.\n`!polowanie` — lista wypraw; `!polowanie info <id>` — przeciwnik, poziom, czas i łupy przed wyruszeniem.\n`!polowanie <id>` — wyrusz na wyprawę. Kolejne etapy odblokowują się po pokonaniu bossa poprzedniego.'
        },
        {
          name: '3. Codzienne zlecenia',
          value: '`!daily` — zobacz trzy zlecenia odnawiane co 24 godziny.\nPostęp zdobywasz podczas gry; gotowe zadanie odbierzesz przez `!daily odbierz <id>`.\nNagroda za każde zlecenie zależy od poziomu: **50 + 2 × poziom** koron.'
        }
      ]
    },
    {
      title: '🐺 Wiedźmińskie RPG — pomoc · 2/2',
      description: 'Ekwipunek, alchemia, aktywności i pojedynki.',
      fields: [
        {
          name: '4. Sklep i ekwipunek',
          value: '`!ekwipunek` — plecak i założony sprzęt.\n`!sklep`, `!kup <nazwa|id> [ilość]` — np. `!kup jaskolka 2`.\n`!skup`, `!sprzedaj <początek nazwy|id> [ilość]` — sprzedaj łupy lub niezałożony sprzęt.\n`!wyposaz <nazwa|id>`, `!mutageny`, `!zdejmijmutagen <nazwa|id>` — zarządzaj wyposażeniem.'
        },
        {
          name: '5. Zielarstwo i alchemia',
          value: '`!zielarstwo`, `!zielarstwo status` — zbiory i postęp umiejętności.\n`!alchemia` — receptury i wymagane składniki.\n`!wytworz <nazwa|id> [ilość]` — wytwarzaj kilka przedmiotów naraz, np. `!wytworz jaskolka_wzmocniona 2`.\n`!uzyj <nazwa|id> [ilość]` — mikstury i eliksiry; premie eliksirów bojowych sumują się, ale zwiększają zatrucie.'
        },
        {
          name: '6. Arena i rankingi',
          value: '`!arena @gracz` — wyzwij gracza na pojedynek; `!arena ranking` — ranking PvP.\n`!ranking [xp|pvp|wyprawy|korony]` — rankingi serwera; `!top` — ranking XP.\nW nazwach przedmiotów wielkość liter i polskie znaki nie mają znaczenia. Gdy nazwa pasuje do kilku pozycji, bot pokaże ich ID.'
        }
      ]
    }
  ];
  const page = pages[pageNumber - 1];
  return new EmbedBuilder()
    .setTitle(page.title)
    .setDescription(page.description)
    .addFields(page.fields)
    .setFooter({ text: 'Nawiguj przyciskami lub wybierz stronę z menu.' })
    .setColor(0x547a46);
}

function getShopCategory(id, item) {
  if (item.school) {
    const schoolIndex = Rpg.WITCHER_SCHOOLS.findIndex(school => school.id === item.school);
    const school = Rpg.WITCHER_SCHOOLS[schoolIndex];
    return {
      order: 2 + schoolIndex,
      label: `🏰 ${school?.name || 'Innej szkoły'} · rynsztunek`
    };
  }
  if (item.type === 'equipment' && item.slot === 'weapon') {
    const isSilver = id === 'srebrny_miecz' || id.startsWith('miecz_srebrny_');
    return { order: isSilver ? 1 : 0, label: isSilver ? '🗡️ Miecze srebrne' : '⚔️ Miecze stalowe' };
  }
  if (item.type === 'equipment' && item.slot === 'armor') {
    return { order: 8, label: '🛡️ Zbroje' };
  }
  if (item.mutationBonus) return { order: 10, label: '🧬 Mutageny' };
  if (item.type === 'consumable') return { order: 9, label: '🧪 Mikstury i eliksiry' };
  return { order: 11, label: '📦 Pozostałe' };
}

function createNoticeEmbed(title, description, color = 0x547a46) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);
}

function createCharacterCard(character, user) {
  const steelWeaponItem = Rpg.ITEMS[character.equipment.steelWeapon];
  const silverWeaponItem = Rpg.ITEMS[character.equipment.silverWeapon];
  const armorItem = Rpg.ITEMS[character.equipment.armor];
  const school = Rpg.WITCHER_SCHOOLS.find(entry => entry.id === character.school);
  const mutationBonuses = Rpg.getMutationBonuses(character);
  const mutationSummary = `ATK +${mutationBonuses.attack} · DEF +${mutationBonuses.defense} · krytyk +${Math.round(mutationBonuses.critChance * 100)}%`;
  const equippedMutagens = character.equippedMutagens || [];
  const mutagenSummary = equippedMutagens.length
    ? equippedMutagens.map((itemId, index) => `${index + 1}. ${Rpg.ITEMS[itemId]?.name || itemId}`).join('\n')
    : 'Brak założonych mutagenów';
  const formatWeapon = item => item
    ? `${item.name} · ATK +${item.attack}${item.critChance ? ` · krytyk ${Math.round(item.critChance * 100)}%` : ''}`
    : 'brak';
  const armor = armorItem ? `${armorItem.name} · DEF +${armorItem.defense}` : 'brak';
  const inventory = Object.entries(character.inventory)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => `${Rpg.ITEMS[id]?.name || Rpg.LOOT_NAMES[id] || id} x${count}`);
  const active = character.activeActivity;
  const activities = active?.kind === 'hunt' ? Rpg.HUNTS : Rpg.MISSIONS;
  const activityName = active?.kind === 'herbalism'
    ? 'Zbieranie ziół'
    : active
      ? activities[active.activityId]?.name || 'Wyprawa'
      : 'Brak';
  const activityStatus = active
    ? `${activityName} · powrót <t:${Math.floor(active.finishesAt / 1000)}:R>`
    : 'Nic teraz nie robi';
  const herbalism = Rpg.getHerbalismStatus(character);
  const isMaxLevel = character.level >= Rpg.MAX_LEVEL;
  const xpRequired = Rpg.xpToNextLevel(character.level);
  const xpProgress = isMaxLevel ? `Maksymalny poziom (${Rpg.MAX_LEVEL})` : `${character.xp}/${xpRequired} XP (${Math.floor((character.xp / xpRequired) * 100)}%)`;
  const combatBuff = character.combatBuff;
  const activeBuffSummary = combatBuff
    ? `${combatBuff.name}\nPremie: ATK +${combatBuff.attack || 0} · DEF +${combatBuff.defense || 0} · krytyk +${Math.round((combatBuff.critChance || 0) * 100)}%`
    : 'Brak aktywnych eliksirów';
  const toxicitySummary = `${Math.round(character.toxicity || 0)}/${Rpg.MAX_TOXICITY} pkt · oczyszczanie ${Rpg.TOXICITY_DECAY_PER_HOUR} pkt/h`;
  const dailySummary = character.dailyQuests?.tasks
    ?.map(task => `${task.claimed ? '✅' : task.progress >= task.target ? '🎁' : '▫️'} ${task.name}: ${task.progress}/${task.target}${task.claimed ? ' · odebrane' : ''}`)
    .join('\n') || 'Użyj `!daily`, aby zobaczyć zlecenia';

  return new EmbedBuilder()
    .setTitle(`🐺 Karta postaci: ${character.name}`)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 256 }) })
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setColor(0x547a46)
    .addFields(
      { name: 'Poziom', value: `${character.level}${isMaxLevel ? ' (MAX)' : ''}`, inline: true },
      { name: 'Doświadczenie', value: xpProgress, inline: true },
      { name: 'Korony', value: `${character.coins}`, inline: true },
      { name: 'Zdrowie', value: `${character.health}/100`, inline: true },
      { name: 'Zatrucie', value: toxicitySummary, inline: true },
      { name: 'Szkoła', value: school ? `${school.name} · ${school.bonus}` : 'Niewybrana · użyj `!szkoly` i `!szkola wilk` lub innej nazwy szkoły', inline: false },
      { name: '⚔️ Miecz stalowy', value: formatWeapon(steelWeaponItem), inline: true },
      { name: '🗡️ Miecz srebrny', value: formatWeapon(silverWeaponItem), inline: true },
      { name: 'Pancerz', value: armor, inline: true },
      { name: `Mutageny (${equippedMutagens.length}/${Rpg.MUTAGEN_SLOT_LIMIT})`, value: `${mutagenSummary}\n${mutationSummary}`, inline: false },
      { name: 'Eliksiry na następną walkę', value: activeBuffSummary, inline: false },
      { name: 'Zielarstwo', value: `poziom ${herbalism.level} · ${herbalism.level >= Rpg.HERBALISM_MAX_LEVEL ? 'MAX' : `${herbalism.xp}/${herbalism.xpToNextLevel} XP`}`, inline: true },
      { name: 'Codzienne zlecenia', value: `${dailySummary}\nSzczegóły i odbiór nagród: \`!daily\``, inline: false },
      { name: 'Ekwipunek', value: inventory.length ? inventory.slice(0, 15).join('\n') : 'Pusty', inline: false },
      { name: 'Aktywność', value: activityStatus, inline: false }
    );
}

function findWelcomeChannel(guild) {
  return guild.channels.cache.find(channel => channel.name === CHANNEL_NAME && channel.isTextBased()) || guild.systemChannel;
}

function findActivityChannel(guild) {
  return guild.channels.cache.find(channel => channel.name === CHANNEL_NAME && channel.isTextBased());
}

function formatActivityResult(userId, result) {
  if (result.kind === 'herbalism') {
    const levelUp = result.levelsGained
      ? `\n🌿 Awans na poziom zielarstwa **${result.level}**!`
      : '';
    const harvest = new EmbedBuilder()
      .setTitle('🌿 Powrót ze zbiorów')
      .setDescription(`Zbieranie ziół zakończone.\n\n**Znalezione składniki**\n${result.herbs
        .map(herb => `• ${Rpg.LOOT_NAMES[herb.id]} ×${herb.count}`)
        .join('\n')}\n\n**Zielarstwo**\nPoziom ${result.level}/${Rpg.HERBALISM_MAX_LEVEL} · +${result.xpGained} XP${levelUp}\n\nNastępne zbiory: <t:${Math.floor(result.cooldownEndsAt / 1000)}:R>.`)
      .setColor(0x547a46);
    return { content: `<@${userId}> wraca ze zbiorów ziół.`, embeds: [harvest] };
  }

  const lootCounts = result.loot.reduce((counts, itemId) => {
    counts[itemId] = (counts[itemId] || 0) + 1;
    return counts;
  }, {});
  const loot = Object.entries(lootCounts).map(([itemId, count]) =>
    `${Rpg.LOOT_NAMES[itemId] || Rpg.ITEMS[itemId]?.name || itemId} x${count}`
  );
  const embed = new EmbedBuilder()
    .setTitle(`${result.victory ? '✅' : '🩹'} ${result.name}`)
    .setDescription(result.victory
      ? 'Wyprawa zakończona — oto podsumowanie starcia.'
      : result.kind === 'hunt'
        ? 'Boss okazał się silniejszy. Wyprawa nie została zaliczona; możesz spróbować ponownie.'
        : 'Wiedźmin musiał się wycofać. Trofeum i zwykły łup przepadają.')
    .setColor(result.victory ? 0x547a46 : 0x9b3d37)
    .addFields(
      { name: 'Wynik walki', value: `${result.victory ? 'Zwycięstwo' : 'Porażka'}${result.boss ? `\nBoss: **${result.boss}**` : ''}${result.monstersDefeated ? `\nPokonane potwory: **${result.monstersDefeated}**` : ''}`, inline: true },
      { name: 'Nagroda', value: `🪙 **${result.gold}** koron\n✨ **${result.xp}** XP${result.levelsGained ? `\n🏆 Awans na poziom **${result.level}**!` : ''}`, inline: true },
      { name: 'Stan po walce', value: `❤️ **${result.healthRemaining}/100** PŻ\n☠️ Zatrucie: **${Math.round(result.toxicity)}/${Rpg.MAX_TOXICITY}** (spadek o połowę)\n⚔️ Zadane: **${result.damageDealt}**\n🛡️ Otrzymane: **${result.healthLost}**`, inline: true },
      { name: 'Zdobyty łup', value: loot.length ? loot.join('\n').slice(0, 1024) : 'Tym razem nic nie znaleziono.', inline: false }
    );
  if (result.unlockedHuntName) {
    embed.addFields({ name: 'Nowy etap', value: `🔓 Odblokowano wyprawę: **${result.unlockedHuntName}**.`, inline: false });
  }
  if (result.combatBuffUsed) {
    embed.addFields({ name: 'Zużyty eliksir', value: result.combatBuffUsed, inline: true });
  }
  if (result.combatLog.length) {
    embed.addFields({ name: 'Dziennik walki', value: result.combatLog.slice(0, 6).join('\n').slice(0, 1024), inline: false });
  }
  return { content: `<@${userId}> wraca z wyprawy.`, embeds: [embed] };
}

function completePlayerActivity(userId, character, channel) {
  const result = Rpg.completeActivity(character);
  if (!result) return false;
  saveData();
  channel.send(formatActivityResult(userId, result)).catch(error => console.error(`Błąd wysyłania wyniku wyprawy: ${error.message}`));
  return true;
}

function activityList(activities, requestedPage = 1, character = null) {
  const entries = activities === Rpg.HUNTS
    ? Rpg.HUNT_PROGRESSION.map(id => [id, activities[id]])
    : Object.entries(activities);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > totalPages) return null;

  const pageEntries = entries.slice((requestedPage - 1) * pageSize, requestedPage * pageSize);
  const fields = pageEntries.map(([id, activity]) => {
    const huntStatus = activities === Rpg.HUNTS && character ? Rpg.getHuntStatus(character, id) : null;
    const target = activity.boss
      ? `🎯 Boss: ${activity.boss}`
      : `👹 Cel: ${Rpg.MONSTER_NAMES[activity.monsterType] || activity.monsterType}`;
    const level = activity.requiredLevel
      ? `🎚️ Poziom wymagany: ${activity.requiredLevel}`
      : `🎚️ Poziom zalecany: ${activity.recommendedLevel}`;
    let status = '';
    if (huntStatus?.completed) status = '\n✅ Etap zaliczony';
    else if (huntStatus?.available) status = '\n🟢 Dostępna';
    else if (huntStatus) {
      const blockers = [
        !huntStatus.unlocked ? `poprzednia wyprawa: ${Rpg.HUNTS[huntStatus.prerequisiteId].name}` : null,
        !huntStatus.levelMet ? `poziom ${huntStatus.requiredLevel}` : null
      ].filter(Boolean);
      status = `\n🔒 Wymaga: ${blockers.join(' i ')}`;
    }
    const loot = activity.minLoot ? `\n🎒 Łup: ${activity.minLoot}-${activity.maxLoot}` : '';
    const possibleLoot = activities === Rpg.HUNTS
      ? [...new Set([...(activity.loot || []), ...(activity.trophy ? [activity.trophy] : [])])]
        .map(itemId => Rpg.LOOT_NAMES[itemId] || Rpg.TROPHIES[itemId]?.name || itemId)
        .join(', ')
      : '';
    return {
      name: `${id} · ${activity.name}`,
      value: `${target}\n⏱️ ${durationText(activity.duration)} · ${level}\n🪙 ${activity.minGold}-${activity.maxGold} koron · ✨ ${activity.xp} XP${loot}${possibleLoot ? `\n🎁 Możliwy łup: ${possibleLoot}` : ''}${status}`,
      inline: false
    };
  });
  return { fields, page: requestedPage, totalPages };
}

function pvpChallengeButtons(matchId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pvp:${matchId}:accept`).setLabel('Przyjmuję').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`pvp:${matchId}:decline`).setLabel('Odrzucam').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
  );
}

function pvpChoiceButtons(matchId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pvp:${matchId}:choice:atak`).setLabel('Atak').setStyle(ButtonStyle.Danger).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`pvp:${matchId}:choice:znak`).setLabel('Znak').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`pvp:${matchId}:choice:obrona`).setLabel('Obrona').setStyle(ButtonStyle.Success).setDisabled(disabled)
  );
}

function createRankingEmbed(guild, rankingType = 'xp') {
  const rankings = {
    xp: {
      title: '🏆 Ranking wiedźminów',
      sort: (left, right) => right.character.level - left.character.level || right.character.xp - left.character.xp,
      line: entry => entry.character.level >= Rpg.MAX_LEVEL
        ? `poziom ${Rpg.MAX_LEVEL} (MAX) · ${entry.character.xp} XP`
        : `poziom ${entry.character.level} · ${entry.character.xp}/${Rpg.xpToNextLevel(entry.character.level)} XP`
    },
    pvp: {
      title: '⚔️ Ranking areny PvP',
      sort: (left, right) => right.stats.rating - left.stats.rating ||
        right.stats.wins - left.stats.wins ||
        getMatchCount(right.stats) - getMatchCount(left.stats),
      line: entry => `${entry.stats.rating} ELO · ${entry.stats.wins}W/${entry.stats.losses}P/${entry.stats.draws}R · ${getWinRate(entry.stats)}% zwycięstw`
    },
    wyprawy: {
      title: '🐾 Ranking zdobywców wypraw',
      sort: (left, right) => right.completedHunts - left.completedHunts ||
        right.character.level - left.character.level,
      line: entry => `${entry.completedHunts}/${Rpg.HUNT_PROGRESSION.length} wypraw · poziom ${entry.character.level}`
    },
    korony: {
      title: '🪙 Ranking koron',
      sort: (left, right) => right.character.coins - left.character.coins ||
        right.character.level - left.character.level,
      line: entry => `${entry.character.coins} koron · poziom ${entry.character.level}`
    }
  };
  const selected = rankings[rankingType];
  if (!selected) return null;

  const entries = Object.entries(data.users)
    .filter(([userId, user]) => guild.members.cache.has(userId) && user?.witcher)
    .map(([userId, user]) => ({
      userId,
      character: user.witcher,
      stats: {
        wins: Number.isInteger(user.witcher.pvpStats?.wins) ? user.witcher.pvpStats.wins : 0,
        losses: Number.isInteger(user.witcher.pvpStats?.losses) ? user.witcher.pvpStats.losses : 0,
        draws: Number.isInteger(user.witcher.pvpStats?.draws) ? user.witcher.pvpStats.draws : 0,
        rating: Number.isFinite(user.witcher.pvpStats?.rating)
          ? user.witcher.pvpStats.rating
          : Rpg.PVP_STARTING_RATING
      },
      completedHunts: Array.isArray(user.witcher.completedHunts)
        ? new Set(user.witcher.completedHunts).size
        : 0
    }))
    .sort(selected.sort)
    .slice(0, 10)
    .map((entry, index) => `${index + 1}. <@${entry.userId}> · ${selected.line(entry)}`);

  return new EmbedBuilder()
    .setTitle(selected.title)
    .setDescription(entries.join('\n') || 'Brak graczy w tym rankingu.')
    .setFooter({ text: 'Rankingi obejmują graczy tego serwera.' })
    .setColor(0x547a46);
}

function getMatchCount(stats) {
  return stats.wins + stats.losses + stats.draws;
}

function getWinRate(stats) {
  const matches = getMatchCount(stats);
  return matches ? Math.round((stats.wins / matches) * 100) : 0;
}

function collectChallengeResponse(challengeMessage, matchId, opponentId) {
  return new Promise((resolve, reject) => {
    let response = null;
    let collectorError = null;
    const collector = challengeMessage.createMessageComponentCollector({
      time: 30_000,
      filter: interaction => interaction.customId.startsWith(`pvp:${matchId}:`)
    });
    collector.on('collect', async interaction => {
      try {
        if (interaction.user.id !== opponentId) {
          await interaction.reply({ content: 'Tylko wyzwany gracz może odpowiedzieć na to wyzwanie.', ephemeral: true });
          return;
        }
        response = interaction.customId.endsWith(':accept') ? 'accepted' : 'declined';
        await interaction.reply({ content: response === 'accepted' ? 'Przyjmujesz wyzwanie.' : 'Odrzucasz wyzwanie.', ephemeral: true });
        collector.stop(response);
      } catch (error) {
        collectorError = error;
        collector.stop('error');
      }
    });
    collector.on('end', async (_collected, reason) => {
      try {
        await challengeMessage.edit({ components: [pvpChallengeButtons(matchId, true)] });
        if (collectorError) reject(collectorError);
        else resolve(reason === 'accepted' ? 'accepted' : reason === 'declined' ? 'declined' : response);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function collectPvPChoices(roundMessage, matchId, playerIds) {
  return new Promise((resolve, reject) => {
    const choices = {};
    let collectorError = null;
    const collector = roundMessage.createMessageComponentCollector({
      time: 30_000,
      filter: interaction => interaction.customId.startsWith(`pvp:${matchId}:choice:`)
    });
    collector.on('collect', async interaction => {
      try {
        const playerIndex = playerIds.indexOf(interaction.user.id);
        if (playerIndex === -1) {
          await interaction.reply({ content: 'Nie bierzesz udziału w tym pojedynku.', ephemeral: true });
          return;
        }
        if (choices[interaction.user.id]) {
          await interaction.reply({ content: 'Twój wybór na tę turę został już zapisany.', ephemeral: true });
          return;
        }
        const choice = interaction.customId.slice(`pvp:${matchId}:choice:`.length);
        choices[interaction.user.id] = choice;
        await interaction.reply({ content: `Wybór zapisany: **${PVP_ACTION_LABELS[choice]}**. Przeciwnik nie widzi Twojej decyzji.`, ephemeral: true });
        if (playerIds.every(userId => choices[userId])) collector.stop('both');
      } catch (error) {
        collectorError = error;
        collector.stop('error');
      }
    });
    collector.on('end', (_collected, reason) => {
      if (collectorError) reject(collectorError);
      else resolve({ choices, complete: reason === 'both' });
    });
  });
}

async function runPvPChallenge(message, challenger, opponentUser) {
  if (opponentUser.id === message.author.id) return message.reply('Nie możesz wyzwać samego siebie.');
  if (opponentUser.bot) return message.reply('Możesz wyzwać tylko innego gracza.');
  if (!data.users[opponentUser.id]?.witcher) {
    return message.reply(`Gracz <@${opponentUser.id}> nie ma jeszcze postaci. Musi ją najpierw utworzyć komendą \`!wiedzmin\`.`);
  }
  if (activePvPUsers.has(message.author.id) || activePvPUsers.has(opponentUser.id)) {
    return message.reply('Ty lub ten gracz bierzecie już udział w innym pojedynku.');
  }

  const opponent = ensurePlayer(opponentUser.id, opponentUser.username);
  if (!challenger.school || !opponent.school) {
    return message.reply('Obaj gracze muszą najpierw wybrać szkołę wiedźmińską (`!szkoly`, potem `!szkola wilk` lub inna nazwa szkoły).');
  }
  if (challenger.activeActivity || opponent.activeActivity) {
    return message.reply('Nie można rozpocząć pojedynku, gdy któryś z graczy jest na wyprawie.');
  }

  const matchId = randomUUID();
  const playerIds = [message.author.id, opponentUser.id];
  const pairKey = playerIds.slice().sort().join(':');
  const rankedMatch = Rpg.canPlayRankedPvP(data.pvpPairCooldowns[pairKey]);
  activePvPUsers.add(playerIds[0]);
  activePvPUsers.add(playerIds[1]);
  try {
    const challengeMessage = await message.channel.send({
      content: `<@${message.author.id}> wyzywa <@${opponentUser.id}>.`,
      embeds: [createNoticeEmbed(
        rankedMatch ? '⚔️ Wyzwanie rankingowe' : '🤝 Wyzwanie towarzyskie',
        `${rankedMatch ? 'Ten mecz wpłynie na ELO i statystyki.' : 'Ta para rozegrała już mecz rankingowy w ciągu ostatnich 2 godzin. Ten pojedynek nie zmieni ELO, statystyk ani koron.'}\n\n<@${opponentUser.id}>, masz **30 sekund** na odpowiedź.`,
        rankedMatch ? 0x9b3d37 : 0x547a46
      )],
      components: [pvpChallengeButtons(matchId)]
    });
    const response = await collectChallengeResponse(challengeMessage, matchId, opponentUser.id);
    if (response !== 'accepted') {
      await challengeMessage.edit({
        content: response === 'declined' ? `<@${opponentUser.id}> odrzuca wyzwanie.` : '',
        embeds: [createNoticeEmbed(
          response === 'declined' ? '🚫 Wyzwanie odrzucone' : '⌛ Wyzwanie wygasło',
          response === 'declined' ? 'Pojedynek nie został rozpoczęty.' : 'Odpowiedź nie nadeszła w ciągu 30 sekund.',
          0x6b7280
        )],
        components: [pvpChallengeButtons(matchId, true)]
      });
      return;
    }

    const scores = [0, 0];
    for (let round = 1; round <= Rpg.PVP_ROUNDS; round += 1) {
      const roundMessage = await message.channel.send({
        content: `<@${playerIds[0]}> · <@${playerIds[1]}>`,
        embeds: [new EmbedBuilder()
          .setTitle(`${rankedMatch ? '⚔️ Arena rankingowa' : '🤝 Pojedynek towarzyski'} · tura ${round}/${Rpg.PVP_ROUNDS}`)
          .setDescription(`**Wynik:** ${scores[0]} : ${scores[1]}\nWybierz ruch — wybór pozostaje ukryty przez maksymalnie 30 sekund.`)
          .addFields(
            { name: 'Atak', value: 'Pokonuje Znak', inline: true },
            { name: 'Znak', value: 'Pokonuje Obronę', inline: true },
            { name: 'Obrona', value: 'Pokonuje Atak', inline: true }
          )
          .setColor(rankedMatch ? 0x9b3d37 : 0x547a46)],
        components: [pvpChoiceButtons(matchId)]
      });
      const { choices, complete } = await collectPvPChoices(roundMessage, matchId, playerIds);
      let resultText;
      if (complete) {
        const firstAction = choices[playerIds[0]];
        const secondAction = choices[playerIds[1]];
        const result = Rpg.resolvePvPRound(firstAction, secondAction);
        if (!result.ok) throw new Error(`Nieprawidłowy wybór PvP: ${firstAction}, ${secondAction}`);
        if (result.draw) {
          resultText = `Obaj wybrali **${PVP_ACTION_LABELS[firstAction]}** — remis, punktów brak.`;
        } else {
          scores[result.winner - 1] += 1;
          resultText = `**${PVP_ACTION_LABELS[firstAction]}** kontra **${PVP_ACTION_LABELS[secondAction]}** — punkt dla <@${playerIds[result.winner - 1]}>.`;
        }
      } else {
        const firstChose = Boolean(choices[playerIds[0]]);
        const secondChose = Boolean(choices[playerIds[1]]);
        if (firstChose !== secondChose) {
          const winnerIndex = firstChose ? 0 : 1;
          scores[winnerIndex] += 1;
          resultText = `Jeden z graczy nie wybrał ruchu w 30 sekund — punkt dla <@${playerIds[winnerIndex]}>.`;
        } else {
          resultText = 'Żaden z graczy nie wybrał ruchu w 30 sekund — tura bez punktu.';
        }
      }
      await roundMessage.edit({
        content: `<@${playerIds[0]}> · <@${playerIds[1]}>`,
        embeds: [new EmbedBuilder()
          .setTitle(`Tura ${round}/${Rpg.PVP_ROUNDS} · ${scores[0]} : ${scores[1]}`)
          .setDescription(resultText)
          .setColor(0x547a46)],
        components: [pvpChoiceButtons(matchId, true)]
      });
    }

    let finalText;
    if (!rankedMatch) {
      finalText = `**Pojedynek towarzyski zakończony wynikiem ${scores[0]} : ${scores[1]}.** Ten mecz nie zmienia rankingu ani koron. Rankingowy rewanż będzie możliwy po upływie 2 godzin od poprzedniego meczu rankingowego.`;
    } else if (scores[0] === scores[1]) {
      const recorded = Rpg.recordPvPMatch(challenger, opponent, scores[0], scores[1]);
      if (!recorded.ok) throw new Error('Nie udało się zapisać remisu PvP.');
      data.pvpPairCooldowns[pairKey] = Date.now();
      saveData();
      finalText = `**Rankingowy pojedynek zakończony remisem ${scores[0]} : ${scores[1]}.** Zmiana rankingu: <@${playerIds[0]}> **${recorded.firstRatingChange >= 0 ? '+' : ''}${recorded.firstRatingChange} ELO**, <@${playerIds[1]}> **${recorded.secondRatingChange >= 0 ? '+' : ''}${recorded.secondRatingChange} ELO**. Korony nie zmieniają właściciela.`;
    } else {
      const winnerIndex = scores[0] > scores[1] ? 0 : 1;
      const winner = winnerIndex === 0 ? challenger : opponent;
      const loser = winnerIndex === 0 ? opponent : challenger;
      const settlement = Rpg.settlePvP(winner, loser, scores[winnerIndex], scores[1 - winnerIndex]);
      if (!settlement.ok) throw new Error(`Nie udało się rozliczyć wyniku PvP: ${settlement.reason}`);
      const recorded = Rpg.recordPvPMatch(challenger, opponent, scores[0], scores[1]);
      if (!recorded.ok) throw new Error('Nie udało się zapisać statystyk PvP.');
      data.pvpPairCooldowns[pairKey] = Date.now();
      saveData();
      const winnerRatingChange = winnerIndex === 0 ? recorded.firstRatingChange : recorded.secondRatingChange;
      finalText = `<@${playerIds[winnerIndex]}> wygrywa rankingowy pojedynek **${scores[0]} : ${scores[1]}**, zyskuje **${winnerRatingChange} ELO** i otrzymuje **${settlement.reward} koron** od przeciwnika.`;
    }
    await message.channel.send({
      content: scores[0] === scores[1]
        ? `<@${playerIds[0]}> <@${playerIds[1]}> — pojedynek zakończony remisem.`
        : `<@${playerIds[scores[0] > scores[1] ? 0 : 1]}>`,
      embeds: [createNoticeEmbed(
        rankedMatch ? '⚔️ Wynik pojedynku rankingowego' : '🤝 Wynik pojedynku towarzyskiego',
        finalText,
        rankedMatch ? 0x9b3d37 : 0x547a46
      )]
    });
  } finally {
    activePvPUsers.delete(playerIds[0]);
    activePvPUsers.delete(playerIds[1]);
  }
}

async function handleCommand(message, character) {
  const [rawCommand, ...args] = message.content.trim().split(/\s+/);
  const command = rawCommand.toLowerCase();
  const argument = args[0]?.toLowerCase();
  const fullArgument = args.join(' ');

  if (completePlayerActivity(message.author.id, character, message.channel)) return;

  if (command === '!pomoc' || command === '!help') {
    let pageNumber = argument ? Number(argument) : 1;
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 2) {
      return message.reply('Pomoc ma dwie strony. Użyj `!pomoc 1` albo `!pomoc 2`.');
    }
    const helpMessage = await message.reply({
      embeds: [createHelpEmbed(pageNumber)],
      components: catalogComponents(pageNumber, 2, 'help')
    });
    const collector = helpMessage.createMessageComponentCollector({
      time: 10 * 60 * 1000,
      filter: interaction => interaction.customId.startsWith('help:')
    });
    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'To menu należy do innego gracza.', ephemeral: true });
      }
      const nextPage = interaction.customId === 'help:previous'
        ? pageNumber - 1
        : interaction.customId === 'help:next'
          ? pageNumber + 1
          : Number(interaction.values[0]);
      if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > 2) {
        return interaction.reply({ content: 'Nieprawidłowy numer strony.', ephemeral: true });
      }
      try {
        await interaction.update({
          embeds: [createHelpEmbed(nextPage)],
          components: catalogComponents(nextPage, 2, 'help')
        });
        pageNumber = nextPage;
      } catch (error) {
        console.error(`Nie udało się zmienić strony pomocy: ${error.message}`);
        const response = { content: 'Nie udało się zmienić strony pomocy. Spróbuj ponownie komendą `!pomoc`.', ephemeral: true };
        if (interaction.deferred || interaction.replied) await interaction.followUp(response);
        else await interaction.reply(response);
      }
    });
    collector.on('end', async () => {
      const disabledComponents = catalogComponents(pageNumber, 2, 'help');
      for (const row of disabledComponents) {
        for (const component of row.components) component.setDisabled(true);
      }
      try {
        await helpMessage.edit({ components: disabledComponents });
      } catch (error) {
        console.error(`Nie udało się wyłączyć nawigacji pomocy: ${error.message}`);
      }
    });
    return helpMessage;
  }

  if (command === '!arena') {
    if (argument === 'ranking' || argument === 'top') {
      return message.reply({ embeds: [createRankingEmbed(message.guild, 'pvp')] });
    }
    const opponentMember = message.mentions.members.first();
    if (!opponentMember) {
      const stats = character.pvpStats || { wins: 0, losses: 0, draws: 0 };
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle('⚔️ Arena wiedźminów')
          .setDescription('Wyzwij gracza przez `!arena @gracz` albo sprawdź `!arena ranking`.\n\nRankingi: `!ranking xp`, `!ranking pvp`, `!ranking wyprawy`, `!ranking korony`.')
          .addFields({ name: 'Twój bilans PvP', value: `${stats.wins} zwycięstw · ${stats.losses} porażek · ${stats.draws} remisów` })
          .setColor(0x547a46)]
      });
    }
    return runPvPChallenge(message, character, opponentMember.user);
  }
  if (command === '!pvp') {
    const opponentMember = message.mentions.members.first();
    if (!opponentMember) return message.reply('Użycie: `!arena @gracz` — system pojedynków przeniósł się na arenę.');
    return runPvPChallenge(message, character, opponentMember.user);
  }

  if (command === '!wiedzmin') {
    return message.reply('Postać jest już utworzona. Sprawdzaj jej kartę komendą `!status`.');
  }

  if (command === '!status') {
    return message.reply({ embeds: [createCharacterCard(character, message.author)] });
  }

  if (command === '!daily' || command === '!dzienne') {
    const daily = Rpg.getDailyQuests(character);
    if (argument === 'odbierz' || argument === 'claim') {
      const questId = args[1]?.toLowerCase();
      if (!questId) return message.reply('Podaj ID ukończonego zlecenia, np. `!daily odbierz kontrakt`.');
      const claimed = Rpg.claimDailyQuest(character, questId);
      if (!claimed.ok) {
        if (claimed.reason === 'unknown') return message.reply('Nie ma takiego zlecenia na dzisiejszej tablicy. Sprawdź `!daily`.');
        if (claimed.reason === 'claimed') return message.reply('Nagroda za to zlecenie została już odebrana.');
        return message.reply(`Zlecenie **${claimed.task.name}** nie jest jeszcze ukończone (${claimed.task.progress}/${claimed.task.target}).`);
      }
      saveData();
      return message.reply({ embeds: [createNoticeEmbed(
        `🪙 Odebrano nagrodę: ${claimed.task.name}`,
        `Otrzymujesz **${claimed.reward} koron**.\nSaldo: **${claimed.coins} koron**.\nNowe zlecenia pojawią się <t:${Math.floor(claimed.resetAt / 1000)}:R>.`
      )] });
    }
    if (argument) return message.reply('Użyj `!daily`, aby zobaczyć zlecenia, lub `!daily odbierz <id>`, aby odebrać gotową nagrodę.');
    const tasks = daily.tasks.map(task => {
      const status = task.claimed
        ? '✅ Nagroda odebrana'
        : task.progress >= task.target
          ? `🎁 Gotowe · odbierz: \`!daily odbierz ${task.id}\``
          : `▫️ Postęp: ${task.progress}/${task.target}`;
      return {
        name: `${task.progress >= task.target && !task.claimed ? '🎁' : '📜'} ${task.name} · \`${task.id}\``,
        value: `${task.description}\n${status} · nagroda **${Rpg.getDailyQuestReward(character.level)} koron**`,
        inline: false
      };
    });
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('📜 Codzienne zlecenia')
      .setDescription(`Tablica odnawia się <t:${Math.floor(daily.resetAt / 1000)}:R>. Nagroda za każde zadanie zależy od poziomu postaci.`)
      .addFields(tasks)
      .setColor(0x547a46)] });
  }

  if (command === '!szkoly') {
    const schools = Rpg.WITCHER_SCHOOLS.map(school => ({
      name: `${school.name} · \`${school.id}\``,
      value: school.bonus,
      inline: true
    }));
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('🐺 Szkoły wiedźmińskie')
      .setDescription('Wybierz ścieżkę, która pasuje do Twojego stylu walki. Decyzja jest stała.')
      .addFields(schools)
      .setFooter({ text: 'Wybór: !szkola <nazwa> · np. !szkola wilk' })
      .setColor(0x547a46)] });
  }

  if (command === '!szkola') {
    if (!fullArgument) return message.reply('Wybierz szkołę komendą `!szkola <nazwa>`. Dostępne szkoły: `!szkoly`.');
    const selection = Rpg.chooseSchool(character, fullArgument);
    if (!selection.ok) {
      if (selection.reason === 'chosen') return message.reply(`Należysz już do **${selection.school.name}**. Wyboru szkoły nie można zmienić.`);
      return message.reply('Nie znam takiej szkoły. Zobacz dostępne opcje komendą `!szkoly`.');
    }
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      `🛡️ Dołączasz do ${selection.school.name}`,
      `Twoja stała premia: **${selection.school.bonus}**.\nRynsztunek pozostałych szkół będzie niedostępny.`
    )] });
  }

  if (command === '!alchemia' || command === '!receptury') {
    const recipes = Object.entries(Rpg.CRAFTING_RECIPES).map(([id, recipe]) => {
      const output = recipe.output ? Rpg.ITEMS[recipe.output] : null;
      const ingredients = Object.entries(recipe.ingredients)
        .map(([ingredientId, amount]) => {
          const owned = character.inventory[ingredientId] || 0;
          return `${owned >= amount ? '✅' : '▫️'} ${Rpg.LOOT_NAMES[ingredientId] || ingredientId}: **${owned}/${amount}**`;
        })
        .join('\n');
      return {
        name: `${recipe.name} · \`${id}\``,
        value: `${ingredients}\n${recipe.description}${output?.toxicityCost ? `\nZatrucie po użyciu: +${output.toxicityCost} pkt.` : ''}${recipe.requiredHerbalismLevel ? `\nZielarstwo poziom ${recipe.requiredHerbalismLevel} (masz ${character.herbalism?.level || 1}).` : ''}\nWytwórz: \`!wytworz ${id} [ilość]\``,
        inline: false
      };
    });
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('⚗️ Alchemia')
      .setDescription('Łącz składniki, by przygotować mikstury, oleje i mutageny. Wyślij wiedźmina na 15-minutowe zbiory przez `!zielarstwo`; po powrocie dostaniesz zioła i XP.')
      .addFields(recipes)
      .setColor(0x547a46)] });
  }

  if (command === '!wytworz') {
    if (!fullArgument) return message.reply('Użycie: `!wytworz <nazwa|id_przepisu> [ilość]`. Zobacz przepisy przez `!receptury`.');
    const hasQuantity = /^\d+$/.test(args[args.length - 1]);
    const quantity = hasQuantity ? Number(args[args.length - 1]) : 1;
    const recipeName = hasQuantity ? args.slice(0, -1).join(' ') : fullArgument;
    const crafted = Rpg.craftItem(character, recipeName, quantity);
    if (!crafted.ok) {
      if (crafted.reason === 'ambiguous') return message.reply(catalogMatchMessage(crafted.matches, Rpg.CRAFTING_RECIPES, 'przepisy'));
      if (crafted.reason === 'level') return message.reply(`Ten przepis wymaga poziomu **${crafted.requiredLevel}**.`);
      if (crafted.reason === 'herbalism') return message.reply(`Ten przepis wymaga **${crafted.requiredLevel}. poziomu zielarstwa**. Użyj \`!zielarstwo\`, aby zbierać składniki i rozwijać umiejętność.`);
      if (crafted.reason === 'quantity') return message.reply('Ilość musi być liczbą całkowitą od 1 do 100.');
      if (crafted.reason === 'ingredients') {
        const ingredientName = Rpg.LOOT_NAMES[crafted.ingredientId] || crafted.ingredientId;
        return message.reply(`Brakuje składników na całą serię: **${ingredientName}** (${crafted.owned}/${crafted.required}). Sprawdź ` + '`!receptury`.');
      }
      return message.reply('Nie znam takiego przepisu. Sprawdź `!receptury`.');
    }
    saveData();
    const craftedItems = Object.entries(crafted.crafted)
      .map(([itemId, count]) => `${Rpg.ITEMS[itemId]?.name || itemId} ×${count}`)
      .join('\n');
    return message.reply({ embeds: [createNoticeEmbed(
      `⚗️ Wytworzono ${crafted.recipe.name}${crafted.quantity > 1 ? ` ×${crafted.quantity}` : ''}`,
      `${crafted.recipe.description}\n\n**Otrzymano**\n${craftedItems}`
    )] });
  }

  if (command === '!imie') {
    const name = args.join(' ').replace(/[@<>`]/g, '').trim().slice(0, 24);
    if (!name) return message.reply('Podaj nazwę postaci: `!imie Geralt z Rivii`.');
    character.name = name;
    saveData();
    return message.reply({ content: `Twoja postać od teraz nazywa się **${name}**.`, embeds: [createCharacterCard(character, message.author)] });
  }

  if (!character.school) {
    return message.reply('Zanim wyruszysz, wybierz szkołę wiedźmińską: sprawdź `!szkoly`, a następnie użyj `!szkola wilk` lub nazwy innej szkoły.');
  }

  if (command === '!zielarstwo') {
    const status = Rpg.getHerbalismStatus(character);
    if (argument === 'status') {
      const cooldown = status.cooldownRemaining
        ? `Zbieranie będzie gotowe za **${durationText(status.cooldownRemaining)}**.`
        : 'Możesz teraz wyruszyć na zbiory.';
      const activity = character.activeActivity?.kind === 'herbalism'
        ? `\nTwoja postać zbiera zioła i wróci <t:${Math.floor(character.activeActivity.finishesAt / 1000)}:R>.`
        : '';
      return message.reply({ embeds: [createNoticeEmbed(
        `🌿 Zielarstwo · poziom ${status.level}/${Rpg.HERBALISM_MAX_LEVEL}`,
        `${status.level >= Rpg.HERBALISM_MAX_LEVEL ? 'Umiejętność maksymalna.' : `Postęp: **${status.xp}/${status.xpToNextLevel} XP**.`}\n${cooldown}${activity}`
      )] });
    }
    if (argument) return message.reply('Użycie: `!zielarstwo` — wyrusz na 15-minutowe zbiory albo `!zielarstwo status` — sprawdź umiejętność i czas odnowienia.');
    const gathering = Rpg.startHerbGathering(character);
    if (!gathering.ok) {
      if (gathering.reason === 'busy') return message.reply('Nie możesz wyruszyć na zbiory podczas innej aktywności. Sprawdź `!status`, aby zobaczyć, kiedy postać wróci.');
      if (gathering.reason === 'cooldown') return message.reply(`Zbieranie ziół będzie dostępne za **${durationText(gathering.remaining)}**. Sprawdź postęp przez \`!zielarstwo status\`.`);
      throw new Error(`Nie udało się rozpocząć zbierania ziół: ${gathering.reason}`);
    }
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      '🌿 Wyruszasz na zbiory',
      `Wiedźmin wróci z ziołami <t:${Math.floor(gathering.finishesAt / 1000)}:R>.\nSprawdź postęp komendą \`!status\`.`
    )] });
  }

  if (command === '!misje') {
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('📜 Wiedźmińskie kontrakty')
      .setDescription(`Dostępnych jest **${Object.keys(Rpg.MISSIONS).length}** kontraktów na poziomy od 1 do ${Rpg.MAX_LEVEL}.\n\nUżyj \`!misja\`, aby otrzymać losowe zlecenie dopasowane do swojego poziomu. Nie można wybrać konkretnego kontraktu ani powtórzyć ostatnich trzech. Czas realizacji jest losowany w pobliżu bazowego czasu misji.`)
      .setColor(0x547a46)] });
  }

  if (command === '!misja') {
    if (argument) return message.reply('Nie można już wybierać konkretnego kontraktu. Użyj samej komendy `!misja`, a przydzielimy losowy kontrakt odpowiedni do Twojego poziomu.');
    const started = Rpg.startRandomMission(character);
    if (!started.ok) {
      if (started.reason === 'busy') return message.reply(`Jesteś na wyprawie do <t:${Math.floor(character.activeActivity.finishesAt / 1000)}:R>.`);
      throw new Error(`Nie udało się przydzielić losowego kontraktu: ${started.reason}`);
    }
    saveData();
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`📜 Kontrakt przyjęty: ${started.activity.name}`)
      .setDescription(`Powrót: <t:${Math.floor(started.finishesAt / 1000)}:R>.`)
      .addFields(
        { name: 'Cel', value: Rpg.MONSTER_NAMES[started.activity.monsterType] || started.activity.monsterType, inline: true },
        { name: 'Zalecany poziom', value: `${started.activity.recommendedLevel}`, inline: true },
        { name: 'Szacowany czas', value: durationText(started.duration), inline: true }
      )
      .setColor(0x547a46)] });
  }

  if (command === '!polowanie') {
    if (argument === 'info' || argument === 'podglad') {
      const huntId = args[1]?.toLowerCase();
      const hunt = Rpg.HUNTS[huntId];
      if (!hunt) return message.reply('Podaj ID wyprawy do podglądu, np. `!polowanie info bory`. ID i dostępność znajdziesz przez `!polowanie`.');
      const status = Rpg.getHuntStatus(character, huntId);
      const unlockStatus = status.completed
        ? 'Etap już zaliczony — możesz go powtórzyć.'
        : !status.unlocked
          ? `Zablokowana: najpierw pokonaj bossa na wyprawie **${Rpg.HUNTS[status.prerequisiteId].name}**.`
          : !status.levelMet
            ? `Wymaga poziomu **${status.requiredLevel}**.`
            : 'Dostępna do rozpoczęcia.';
      const loot = [...new Set([...(hunt.loot || []), ...(hunt.trophy ? [hunt.trophy] : [])])]
        .map(itemId => Rpg.LOOT_NAMES[itemId] || Rpg.TROPHIES[itemId]?.name || itemId);
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle(`🔎 Podgląd wyprawy: ${hunt.name}`)
        .setDescription(`${unlockStatus}\n\nBoss: **${hunt.boss}**`)
        .addFields(
          { name: 'Poziom wymagany', value: `${hunt.requiredLevel}`, inline: true },
          { name: 'Czas wyprawy', value: durationText(hunt.duration), inline: true },
          { name: 'Nagrody', value: `${hunt.minGold}-${hunt.maxGold} koron · ${hunt.xp} XP`, inline: true },
          { name: 'Możliwy łup', value: loot.length ? loot.join(', ').slice(0, 1024) : 'Brak dodatkowego łupu.', inline: false }
        )
        .setFooter({ text: `Rozpocznij: !polowanie ${huntId}` })
        .setColor(0x547a46)] });
    }
    if (!argument || /^\d+$/.test(argument)) {
      let pageNumber = argument ? Number(argument) : 1;
      const listing = activityList(Rpg.HUNTS, pageNumber, character);
      if (!listing) return message.reply('Nie ma takiej strony wypraw. Użyj `!polowanie` lub podaj numer strony.');
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle(`🐾 Wyprawy · strona ${listing.page}/${listing.totalPages}`)
        .setDescription('Przeglądaj etapy kampanii. Zablokowane wyprawy wymagają poziomu i/lub zwycięstwa nad bossem poprzedniego etapu.')
        .addFields(listing.fields)
        .setFooter({ text: 'Wyrusz: !polowanie <id>' })
        .setColor(0x547a46)] });
    }
    const started = Rpg.startActivity(character, 'hunt', argument);
    if (!started.ok) {
      if (started.reason === 'busy') return message.reply(`Jesteś na wyprawie do <t:${Math.floor(character.activeActivity.finishesAt / 1000)}:R>.`);
      if (started.reason === 'level') return message.reply(`Ta wyprawa wymaga poziomu **${started.requiredLevel}**. Sprawdź słabsze lokacje komendą !polowanie.`);
      if (started.reason === 'prerequisite') {
        const status = Rpg.getHuntStatus(character, argument);
        const levelRequirement = status && !status.levelMet
          ? ` Wymagany jest też poziom **${status.requiredLevel}**.`
          : '';
        return message.reply(`Ta wyprawa jest zablokowana. Najpierw pokonaj bossa na wyprawie **${started.prerequisiteName}**.${levelRequirement}`);
      }
      return message.reply('Nie znam tego terenu. Sprawdź `!polowanie`.');
    }
    saveData();
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`🐾 Wyruszasz: ${started.activity.name}`)
      .setDescription('Wyprawa rozpoczęta. Powrót: <t:' + Math.floor(started.finishesAt / 1000) + ':R>.')
      .addFields(
        { name: 'Główny przeciwnik', value: started.activity.boss, inline: true },
        { name: 'Zalecany poziom', value: `${started.activity.requiredLevel}`, inline: true },
        { name: 'Czas wyprawy', value: durationText(started.duration), inline: true },
        { name: 'Możliwy łup', value: [...new Set([...(started.activity.loot || []), ...(started.activity.trophy ? [started.activity.trophy] : [])])]
          .map(itemId => Rpg.LOOT_NAMES[itemId] || Rpg.TROPHIES[itemId]?.name || itemId)
          .join(', ').slice(0, 1024) || 'Brak dodatkowego łupu.', inline: false }
      )
      .setColor(0x547a46)] });
  }

  if (command === '!ekwipunek' || command === '!inv') {
    const items = Object.entries(character.inventory)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => `${Rpg.ITEMS[id]?.name || Rpg.LOOT_NAMES[id] || id} x${count}`);
    const steelWeapon = Rpg.ITEMS[character.equipment.steelWeapon]?.name || 'brak';
    const silverWeapon = Rpg.ITEMS[character.equipment.silverWeapon]?.name || 'brak';
    const armor = Rpg.ITEMS[character.equipment.armor]?.name || 'brak';
    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🎒 Ekwipunek: ${character.name}`)
        .setDescription(items.length ? `Przedmioty w plecaku: **${items.length}**` : 'Plecak jest pusty.')
        .addFields(
          { name: '⚔️ Miecz stalowy', value: steelWeapon, inline: true },
          { name: '🗡️ Miecz srebrny', value: silverWeapon, inline: true },
          { name: '🛡️ Zbroja', value: armor, inline: true },
          { name: '🎒 Zawartość plecaka', value: items.length ? items.slice(0, 20).join('\n').slice(0, 1024) : 'Brak przedmiotów.', inline: false }
        )
        .setFooter({ text: items.length > 20 ? 'Pokazano pierwsze 20 pozycji.' : 'Przedmioty możesz zdobywać, kupować i wytwarzać.' })
        .setColor(0x547a46)]
    });
  }

  if (command === '!mutageny') {
    const equipped = character.equippedMutagens || [];
    const lines = equipped.map((itemId, index) => `${index + 1}. **${Rpg.ITEMS[itemId].name}** (\`${itemId}\`)`);
    const available = Object.entries(character.inventory)
      .filter(([itemId, count]) => count > 0 && Rpg.ITEMS[itemId]?.mutationBonus)
      .map(([itemId, count]) => `**${Rpg.ITEMS[itemId].name}** (\`${itemId}\`) x${count}`);
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`🧬 Mutageny · ${equipped.length}/${Rpg.MUTAGEN_SLOT_LIMIT} slotów`)
      .addFields(
        { name: 'Założone', value: lines.join('\n') || 'Brak założonych mutagenów.', inline: false },
        { name: 'W plecaku', value: available.join('\n').slice(0, 1024) || 'Brak mutagenów.', inline: false }
      )
      .setFooter({ text: 'Załóż: !wyposaz <nazwa|id> · Zdejmij: !zdejmijmutagen <nazwa|id>' })
      .setColor(0x547a46)] });
  }

  if (command === '!zdejmijmutagen') {
    if (!fullArgument) return message.reply('Użycie: `!zdejmijmutagen <nazwa|id_mutagenu>`. Nazwy znajdziesz przez `!mutageny`.');
    const removed = Rpg.removeMutagen(character, fullArgument);
    if (!removed.ok) {
      if (removed.reason === 'ambiguous') return message.reply(catalogMatchMessage(removed.matches, Rpg.ITEMS, 'mutageny'));
      return message.reply('Ten mutagen nie jest aktualnie założony. Sprawdź `!mutageny`.');
    }
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      `🧬 Zdjęto ${removed.item.name}`,
      `Mutagen przeniesiono do plecaka. Zajęte sloty: **${removed.count}/${Rpg.MUTAGEN_SLOT_LIMIT}**.`
    )] });
  }

  if (command === '!sklep' || command === '!shop' || command === '!skup') {
    const shopItems = Object.entries(Rpg.ITEMS)
      .filter(([, item]) => !item.craftOnly)
      .map(([id, item]) => ({ id, item, category: getShopCategory(id, item) }))
      .sort((left, right) =>
        left.category.order - right.category.order ||
        (left.item.requiredLevel || 1) - (right.item.requiredLevel || 1) ||
        left.item.price - right.item.price ||
        left.item.name.localeCompare(right.item.name, 'pl')
      );
    const itemListings = shopItems.map(({ id, item, category }) => {
      const requiredLevel = item.requiredLevel ? ` · wymagany poziom ${item.requiredLevel}` : '';
      const schoolRequirement = item.school
        ? item.school === character.school
          ? ' · rynsztunek Twojej szkoły'
          : ` · wymaga szkoły ${Rpg.WITCHER_SCHOOLS.find(school => school.id === item.school)?.name || item.school}`
        : item.type === 'equipment'
          ? ' · dostępne dla każdej szkoły'
          : '';
      const stats = [];
      if (item.attack) stats.push(`ATK +${item.attack}`);
      if (item.defense) stats.push(`DEF +${item.defense}`);
      if (item.critChance) stats.push(`krytyk ${Math.round(item.critChance * 100)}%`);
      if (item.heal) stats.push(`leczenie ${item.heal}`);
      if (item.effectDescription) stats.push(item.effectDescription);
      if (item.mutationBonus) {
        const bonus = item.mutationBonus;
        stats.push(`trwała premia: ATK +${bonus.attack || 0}, DEF +${bonus.defense || 0}, krytyk +${Math.round((bonus.critChance || 0) * 100)}%`);
      }
      const statText = stats.length ? stats.join(' · ') : 'Przedmiot użytkowy';
      return {
        name: `${category.label} · ${item.name} · ${item.price} koron`,
        value: `ID: \`${id}\`\n${statText}${requiredLevel}${schoolRequirement}`,
        inline: false
      };
    });
    const saleListings = Object.entries(Rpg.SELLABLE_ITEMS).map(([id, item]) => ({
      name: `🪙 ${item.name} · skup ${item.price} koron`,
      value: `ID: \`${id}\``,
      inline: true
    })).sort((left, right) => left.name.localeCompare(right.name, 'pl'));
    const isPawnShop = command === '!skup';
    const listings = isPawnShop ? saleListings : itemListings;
    const menuId = isPawnShop ? 'pawnshop' : 'shop';
    const title = isPawnShop ? '⚒️ Kowal i skup łupów' : '🛒 Sklep';
    const footer = isPawnShop
      ? 'Sprzedaj: !sprzedaj <początek nazwy|id|wszystko> [ilość] · sprzęt za połowę ceny'
      : 'Kup: !kup <nazwa|id> [ilość], np. !kup jaskolka 2';
    const pageSize = 12;
    const totalPages = Math.ceil(listings.length / pageSize);
    let pageNumber = argument ? Number(argument) : 1;
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      return message.reply(`Podaj numer strony od 1 do ${totalPages}: \`${command} <strona>\`.`);
    }
    const shopMessage = await message.reply({
      embeds: [catalogEmbed(listings, pageNumber, totalPages, character, title, footer)],
      components: catalogComponents(pageNumber, totalPages, menuId)
    });
    const collector = shopMessage.createMessageComponentCollector({
      time: 10 * 60 * 1000,
      filter: interaction => interaction.customId.startsWith(`${menuId}:`)
    });
    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'To menu należy do innego gracza.', ephemeral: true });
      }
      const nextPage = interaction.customId === `${menuId}:previous`
        ? pageNumber - 1
        : interaction.customId === `${menuId}:next`
          ? pageNumber + 1
          : Number(interaction.values[0]);
      if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > totalPages) {
        return interaction.reply({ content: 'Nieprawidłowy numer strony.', ephemeral: true });
      }
      pageNumber = nextPage;
      try {
        await interaction.update({
          embeds: [catalogEmbed(listings, pageNumber, totalPages, character, title, footer)],
          components: catalogComponents(pageNumber, totalPages, menuId)
        });
      } catch (error) {
        console.error(`Nie udało się zmienić strony menu ${menuId}: ${error.message}`);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: `Nie udało się odświeżyć listy. Spróbuj ponownie komendą \`${command}\`.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `Nie udało się odświeżyć listy. Spróbuj ponownie komendą \`${command}\`.`, ephemeral: true });
        }
      }
    });
    collector.on('end', async () => {
      const disabledComponents = catalogComponents(pageNumber, totalPages, menuId);
      for (const row of disabledComponents) {
        for (const component of row.components) component.setDisabled(true);
      }
      try {
        await shopMessage.edit({ components: disabledComponents });
      } catch (error) {
        console.error(`Nie udało się wyłączyć nawigacji menu ${menuId}: ${error.message}`);
      }
    });
    return shopMessage;
  }

  if (command === '!kup' || command === '!buy') {
    if (!fullArgument) return message.reply('Użycie: `!kup <nazwa|id> [ilość]`; listę znajdziesz w `!sklep`.');
    const hasQuantity = /^\d+$/.test(args[args.length - 1]);
    const quantity = hasQuantity ? Number(args[args.length - 1]) : 1;
    const itemName = hasQuantity ? args.slice(0, -1).join(' ') : fullArgument;
    const purchase = Rpg.buyItem(character, itemName, quantity);
    if (!purchase.ok) {
      if (purchase.reason === 'ambiguous') return message.reply(catalogMatchMessage(purchase.matches, Rpg.ITEMS, 'przedmioty'));
      if (purchase.reason === 'level') return message.reply(`Ten rynsztunek wymaga poziomu **${purchase.requiredLevel}**.`);
      if (purchase.reason === 'school') {
        const school = Rpg.WITCHER_SCHOOLS.find(entry => entry.id === purchase.requiredSchool);
        return message.reply(`Ten przedmiot jest przeznaczony dla ${school?.name || 'innej szkoły'}.`);
      }
      if (purchase.reason === 'funds') return message.reply(`Brakuje Ci ${purchase.missing} koron.`);
      if (purchase.reason === 'quantity') return message.reply('Ilość musi być dodatnią, bezpieczną liczbą całkowitą.');
      return message.reply('Nie ma takiego przedmiotu. Zobacz `!sklep`.');
    }
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      `✅ Kupiono ${purchase.item.name} ×${purchase.quantity}`,
      `Liczba w plecaku: **${purchase.count}**\nKoszt: **${purchase.totalPrice} koron**\nPozostało: **${character.coins} koron**.`
    )] });
  }

  if (command === '!sprzedaj') {
    if (!fullArgument) return message.reply('Użycie: `!sprzedaj <początek nazwy|id|wszystko> [ilość]`; kowala i cennik znajdziesz w `!skup`.');
    const hasQuantity = /^\d+$/.test(args[args.length - 1]);
    const quantity = hasQuantity ? args[args.length - 1] : undefined;
    const itemName = hasQuantity ? args.slice(0, -1).join(' ') : fullArgument;
    const sale = Rpg.sellLoot(character, itemName, quantity);
    if (!sale.ok) {
      if (sale.reason === 'ambiguous') return message.reply(catalogMatchMessage(sale.matches, Rpg.SELLABLE_ITEMS, 'przedmioty do sprzedaży'));
      const errors = {
        empty: 'Nie masz łupów ani niezałożonego sprzętu do sprzedania.',
        unknown: 'Kowal nie skupuje tego przedmiotu. Sprawdź `!skup`.',
        quantity: 'Ilość musi być dodatnią liczbą całkowitą.',
        missing: `Masz tylko ${sale.owned} sztuk tego przedmiotu.`,
        equipped: 'Nie możesz sprzedać założonego przedmiotu. Najpierw załóż inny sprzęt.'
      };
      return message.reply(errors[sale.reason] || 'Nie udało się sprzedać przedmiotu.');
    }
    saveData();
    const sold = sale.sold.map(item => `${Rpg.SELLABLE_ITEMS[item.id].name} ×${item.count}`).join('\n');
    return message.reply({ embeds: [createNoticeEmbed(
      '🪙 Sprzedaż zakończona',
      `**Sprzedane przedmioty**\n${sold.slice(0, 900)}\n\nOtrzymano: **${sale.gold} koron**\nSaldo: **${character.coins} koron**.`
    )] });
  }

  if (command === '!wyposaz') {
    if (!fullArgument) return message.reply('Użycie: `!wyposaz <nazwa|id_przedmiotu>`.');
    const equipped = Rpg.equipItem(character, fullArgument);
    if (!equipped.ok) {
      if (equipped.reason === 'ambiguous') return message.reply(catalogMatchMessage(equipped.matches, Rpg.ITEMS, 'przedmioty'));
      if (equipped.reason === 'slots') return message.reply(`Możesz mieć założonych maksymalnie ${equipped.limit} mutagenów. Zdejmij jeden przez \`!zdejmijmutagen <nazwa|id>\`.`);
      if (equipped.reason === 'level') return message.reply(`Ten rynsztunek wymaga poziomu **${equipped.requiredLevel}**.`);
      if (equipped.reason === 'school') {
        const school = Rpg.WITCHER_SCHOOLS.find(entry => entry.id === equipped.requiredSchool);
        return message.reply(`Nie możesz założyć tego rynsztunku. Wymagana jest przynależność do ${school?.name || 'innej szkoły'}.`);
      }
      return message.reply('Nie masz tego elementu wyposażenia w plecaku.');
    }
    saveData();
    if (equipped.item.mutationBonus) {
      return message.reply({ embeds: [createNoticeEmbed(
        `🧬 Założono ${equipped.item.name}`,
        `Zajęte sloty mutagenów: **${equipped.count}/${Rpg.MUTAGEN_SLOT_LIMIT}**.`
      )] });
    }
    return message.reply({ embeds: [createNoticeEmbed(`🛡️ Założono ${equipped.item.name}`, 'Wyposażenie jest gotowe do walki.')] });
  }

  if (command === '!uzyj' || command === '!use') {
    if (!fullArgument) return message.reply('Użycie: `!uzyj <nazwa|id_przedmiotu> [ilość]`, np. `!uzyj jaskolka 2`.');
    const hasQuantity = /^\d+$/.test(args[args.length - 1]);
    const quantity = hasQuantity ? Number(args[args.length - 1]) : 1;
    const itemName = hasQuantity ? args.slice(0, -1).join(' ') : fullArgument;
    const used = Rpg.useItem(character, itemName, quantity);
    if (!used.ok) {
      if (used.reason === 'ambiguous') return message.reply(catalogMatchMessage(used.matches, Rpg.ITEMS, 'przedmioty'));
      const errors = {
        missing: `Nie masz tylu sztuk tego przedmiotu (masz ${used.owned}).`,
        quantity: 'Ilość musi być dodatnią, bezpieczną liczbą całkowitą.',
        level: `Ten przedmiot wymaga poziomu **${used.requiredLevel}**.`,
        healthy: 'Masz pełne zdrowie.',
        equip: `Mutagenów nie używa się jak mikstur. Załóż ten mutagen komendą \`!wyposaz ${itemName}\`.`,
        unknown: 'Tego przedmiotu nie można użyć.',
        toxicity: `Za duże zatrucie na taką dawkę: **${Math.round(used.current)}/${used.limit}** + **${used.added}**. Eliksiry bojowe możesz łączyć, ale zatrucie nie może przekroczyć ${used.limit}.`
      };
      return message.reply(errors[used.reason] || 'Nie można użyć tego przedmiotu.');
    }
    saveData();
    if (used.mutationBonus) {
      const bonus = used.mutationBonus;
      return message.reply({ embeds: [createNoticeEmbed(
        `🧬 Mutagen ${used.item.name}`,
        `Trwałe premie: **ATK +${bonus.attack || 0} · DEF +${bonus.defense || 0} · krytyk +${Math.round((bonus.critChance || 0) * 100)}%**.`
      )] });
    }
    if (used.combatBuff) return message.reply({ embeds: [createNoticeEmbed(
      `⚗️ Przygotowano ${used.item.name}${used.quantity > 1 ? ` ×${used.quantity}` : ''}`,
      `${used.item.effectDescription || 'Premia zadziała w następnej walce.'}${used.quantity > 1 ? `\nŁączna dawka: **${used.quantity}** · premia eliksiru została zsumowana.` : ''}\n\nAktywne premie: ${used.combatBuff.name}\nZatrucie: **${Math.round(used.toxicity)}/${Rpg.MAX_TOXICITY}** (+${used.toxicityAdded}). Eliksiry zużyją się po kolejnym starciu.`
    )] });
    return message.reply({ embeds: [createNoticeEmbed(
      `❤️ Użyto ${used.item.name}${used.quantity > 1 ? ` ×${used.quantity}` : ''}`,
      `Odzyskano **${used.healed} PŻ** · zdrowie: **${used.health}/100**.\nZużyto mikstur: **${used.quantity}** · zatrucie: **${Math.round(used.toxicity)}/${Rpg.MAX_TOXICITY}** (mikstury leczące nie zwiększają zatrucia).`
    )] });
  }

  if (command === '!ranking' || command === '!top') {
    const rankingType = argument || 'xp';
    const embed = createRankingEmbed(message.guild, rankingType);
    if (!embed) return message.reply('Nie znam tego rankingu. Wybierz: `xp`, `pvp`, `wyprawy` lub `korony`.');
    return message.reply({ embeds: [embed] });
  }

  if (command.startsWith('!')) return message.reply('Nie znam tej komendy. Użyj `!pomoc`.');
}

client.on('messageCreate', async message => {
  if (!message.guild || message.guild.id !== TARGET_GUILD_ID ||
      message.author.bot || message.channel.name !== CHANNEL_NAME) return;
  if (!message.content.trim().startsWith('!')) return;
  const now = Date.now();
  const previousCommandAt = commandCooldowns.get(message.author.id);
  if (previousCommandAt && now - previousCommandAt < COMMAND_COOLDOWN_MS) {
    const lastNoticeAt = commandCooldownNotices.get(message.author.id);
    if (!lastNoticeAt || now - lastNoticeAt >= COMMAND_COOLDOWN_NOTICE_MS) {
      commandCooldownNotices.set(message.author.id, now);
      message.reply('Odczekaj chwilę przed kolejną komendą.').catch(error =>
        console.error(`Nie udało się wysłać informacji o limicie komend: ${error.message}`)
      );
    }
    return;
  }
  commandCooldowns.set(message.author.id, now);
  if (commandCooldowns.size > 5000) {
    for (const [userId, lastCommandAt] of commandCooldowns) {
      if (now - lastCommandAt > 60000) {
        commandCooldowns.delete(userId);
        commandCooldownNotices.delete(userId);
      }
    }
  }
  try {
    const [rawCommand] = message.content.trim().split(/\s+/);
    const command = rawCommand.toLowerCase();
    const existingCharacter = data.users[message.author.id]?.witcher;
    if (command === '!wiedzmin') {
      if (existingCharacter) return message.reply('Masz już postać. Jej profil sprawdzisz komendą `!status`.');
      ensurePlayer(message.author.id, message.author.username);
      return message.reply({ embeds: [createNoticeEmbed(
        '🐺 Postać utworzona',
        'Otrzymujesz 150 koron, miecz stalowy i srebrny.\n\nDalej użyj `!szkoly`, a potem wybierz ścieżkę przez `!szkola wilk` (lub inną szkołę). Profil sprawdzisz komendą `!status`.'
      )] });
    }
    if (!existingCharacter) {
      if (command === '!pomoc' || command === '!help') {
        return await handleCommand(message, Rpg.ensureCharacter({}, message.author.username));
      }
      return message.reply('Nie masz jeszcze postaci. Utwórz ją komendą `!wiedzmin`; dostępna jest też pomoc `!pomoc`.');
    }
    const character = ensurePlayer(message.author.id, message.author.username);
    await handleCommand(message, character);
  } catch (error) {
    console.error(`Błąd obsługi komendy: ${error.stack || error.message}`);
    await message.reply('Wyprawa napotkała problem. Spróbuj ponownie za chwilę.')
      .catch(replyError => console.error(`Nie udało się wysłać informacji o błędzie komendy: ${replyError.message}`));
  }
});

client.on('guildMemberAdd', async member => {
  if (member.guild.id !== TARGET_GUILD_ID || member.user.bot) return;
  try {
    const channel = findWelcomeChannel(member.guild);
    if (!channel) {
      console.error(`Nie znaleziono kanału powitalnego na serwerze ${TARGET_GUILD_ID}.`);
      return;
    }
    await channel.send(`Witaj <@${member.id}>! Utwórz postać komendą \`!wiedzmin\`, a szkołę wybierz przez \`!szkoly\` i \`!szkola wilk\` (lub nazwą innej szkoły). Profil sprawdzisz komendą \`!status\`.`);
  } catch (error) {
    console.error(`Nie udało się powitać nowego gracza: ${error.stack || error.message}`);
  }
});

client.on('guildCreate', guild => {
  if (guild.id !== TARGET_GUILD_ID) return;
  const channel = findWelcomeChannel(guild);
  if (!channel) return;
  channel.send('Wiedźmińskie RPG jest gotowe. Utwórz postać komendą `!wiedzmin`, wybierz szkołę przez `!szkoly` i `!szkola wilk` (lub nazwą innej szkoły), a profil sprawdzaj komendą `!status`. Każdy gracz ma osobny poziom, ekwipunek i wyprawy.')
    .catch(error => console.error(`Nie udało się wysłać powitania serwera: ${error.message}`));
});

client.once('clientReady', () => {
  const guild = client.guilds.cache.get(TARGET_GUILD_ID);
  const channel = guild && findActivityChannel(guild);
  if (!guild || !channel) {
    console.error(`Nie znaleziono skonfigurowanego serwera lub kanału #${CHANNEL_NAME}. Sprawdź DISCORD_GUILD_ID i uprawnienia bota.`);
    client.destroy();
    process.exitCode = 1;
    return;
  }
  console.log(`Wiedźmińskie RPG działa jako ${client.user.tag} na serwerze ${guild.name}, kanał #${CHANNEL_NAME}.`);
  setInterval(() => {
    const completed = [];
    for (const [userId, user] of Object.entries(data.users)) {
      if (!user.witcher?.activeActivity) continue;
      const result = Rpg.completeActivity(user.witcher);
      if (result) completed.push({ userId, result });
    }
    if (completed.length === 0) return;

    saveData();
    for (const { userId, result } of completed) {
      channel.send(formatActivityResult(userId, result)).catch(error => console.error(`Błąd wysyłania wyniku wyprawy: ${error.message}`));
    }
  }, 15000);
});
client.on('error', error => console.error(`Błąd klienta Discord: ${error.message}`));

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_TOKEN.trim()) {
  console.error('Brak zmiennej środowiskowej DISCORD_TOKEN.');
  process.exitCode = 1;
} else if (!TARGET_GUILD_ID || !/^\d{17,20}$/.test(TARGET_GUILD_ID)) {
  console.error('Brak lub nieprawidłowa zmienna DISCORD_GUILD_ID. Podaj identyfikator serwera Discord (17-20 cyfr).');
  process.exitCode = 1;
} else {
  client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error(`Nie udało się zalogować do Discorda: ${error.message}`);
    process.exitCode = 1;
  });
}
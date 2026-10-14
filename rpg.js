const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
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
  } else if (!Object.hasOwn(user.witcher, 'school') || !user.witcher.starterKitGranted) {
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

function createNoticeEmbed(title, description, color = 0x547a46) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);
}

function createCharacterCard(character, user) {
  const weaponItem = Rpg.ITEMS[character.equipment.weapon];
  const armorItem = Rpg.ITEMS[character.equipment.armor];
  const school = Rpg.WITCHER_SCHOOLS.find(entry => entry.id === character.school);
  const mutationBonuses = Rpg.getMutationBonuses(character);
  const mutationSummary = `ATK +${mutationBonuses.attack} · DEF +${mutationBonuses.defense} · krytyk +${Math.round(mutationBonuses.critChance * 100)}%`;
  const equippedMutagens = character.equippedMutagens || [];
  const mutagenSummary = equippedMutagens.length
    ? equippedMutagens.map((itemId, index) => `${index + 1}. ${Rpg.ITEMS[itemId]?.name || itemId}`).join('\n')
    : 'Brak założonych mutagenów';
  const weapon = weaponItem
    ? `${weaponItem.name} · ATK +${weaponItem.attack}${weaponItem.critChance ? ` · krytyk ${Math.round(weaponItem.critChance * 100)}%` : ''}`
    : 'brak';
  const armor = armorItem ? `${armorItem.name} · DEF +${armorItem.defense}` : 'brak';
  const inventory = Object.entries(character.inventory)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => `${Rpg.ITEMS[id]?.name || Rpg.LOOT_NAMES[id] || id} x${count}`);
  const active = character.activeActivity;
  const activities = active?.kind === 'hunt' ? Rpg.HUNTS : Rpg.MISSIONS;
  const activityName = active ? activities[active.activityId]?.name || 'Wyprawa' : 'Brak';
  const activityStatus = active
    ? `${activityName} · powrót <t:${Math.floor(active.finishesAt / 1000)}:R>`
    : 'Brak aktywnej wyprawy';
  const herbalism = Rpg.getHerbalismStatus(character);
  const isMaxLevel = character.level >= Rpg.MAX_LEVEL;
  const xpRequired = Rpg.xpToNextLevel(character.level);
  const xpProgress = isMaxLevel ? `Maksymalny poziom (${Rpg.MAX_LEVEL})` : `${character.xp}/${xpRequired} XP (${Math.floor((character.xp / xpRequired) * 100)}%)`;

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
      { name: 'Szkoła', value: school ? `${school.name} · ${school.bonus}` : 'Niewybrana · użyj `!szkoly` i `!szkola <id>`', inline: false },
      { name: 'Broń', value: weapon, inline: true },
      { name: 'Pancerz', value: armor, inline: true },
      { name: `Mutageny (${equippedMutagens.length}/${Rpg.MUTAGEN_SLOT_LIMIT})`, value: `${mutagenSummary}\n${mutationSummary}`, inline: false },
      { name: 'Eliksir na następną walkę', value: character.combatBuff?.name || 'brak', inline: true },
      { name: 'Zielarstwo', value: `poziom ${herbalism.level} · ${herbalism.level >= Rpg.HERBALISM_MAX_LEVEL ? 'MAX' : `${herbalism.xp}/${herbalism.xpToNextLevel} XP`}`, inline: true },
      { name: 'Ekwipunek', value: inventory.length ? inventory.slice(0, 15).join('\n') : 'Pusty', inline: false },
      { name: 'Wyprawa', value: activityStatus, inline: false }
    );
}

function findWelcomeChannel(guild) {
  return guild.channels.cache.find(channel => channel.name === CHANNEL_NAME && channel.isTextBased()) || guild.systemChannel;
}

function findActivityChannel(guild) {
  return guild.channels.cache.find(channel => channel.name === CHANNEL_NAME && channel.isTextBased());
}

function formatActivityResult(userId, result) {
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
      { name: 'Stan po walce', value: `❤️ **${result.healthRemaining}/100** PŻ\n⚔️ Zadane: **${result.damageDealt}**\n🛡️ Otrzymane: **${result.healthLost}**`, inline: true },
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
    return {
      name: `${id} · ${activity.name}`,
      value: `${target}\n⏱️ ${durationText(activity.duration)} · ${level}\n🪙 ${activity.minGold}-${activity.maxGold} koron · ✨ ${activity.xp} XP${loot}${status}`,
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
  if (activePvPUsers.has(message.author.id) || activePvPUsers.has(opponentUser.id)) {
    return message.reply('Ty lub ten gracz bierzecie już udział w innym pojedynku.');
  }

  const opponent = ensurePlayer(opponentUser.id, opponentUser.username);
  if (!challenger.school || !opponent.school) {
    return message.reply('Obaj gracze muszą najpierw wybrać szkołę wiedźmińską (`!szkoly`, potem `!szkola <id>`).');
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

  if (completePlayerActivity(message.author.id, character, message.channel)) return;

  if (command === '!pomoc' || command === '!help') {
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('🐺 Wiedźmińskie RPG — przewodnik dla gracza')
      .setDescription('Zaczynasz przygodę? Wpisuj komendy na tym kanale. Każda postać ma własny poziom, ekwipunek, korony i wyprawę.')
      .setColor(0x547a46)
      .addFields(
        {
          name: '1. Stwórz postać i wybierz szkołę',
          value: '`!wiedzmin` — pokaż kartę postaci. Na start dostajesz 150 koron, miecz stalowy i srebrny.\n`!szkoly` — zobacz szkoły i ich premie.\n`!szkola <id>` — wybierz szkołę; decyzja jest stała, a rynsztunek innych szkół będzie niedostępny.\n`!imie <nazwa>` — zmień imię postaci.',
          inline: false
        },
        {
          name: '2. Wyrusz na pierwszą przygodę',
          value: '`!misje` — sprawdź, jak działają losowe kontrakty. `!misja` — przyjmij losowy kontrakt dopasowany do Twojego poziomu; nie wybierasz przeciwnika ani nie możesz powtórzyć ostatnich trzech zleceń. Czas realizacji jest losowany w zakresie 80-120% czasu bazowego.\n`!polowanie` — sprawdź wyprawy i ich status; rozpocznij dostępną przez `!polowanie <id>`. Wyprawy wymagają odpowiedniego poziomu i odblokowują się po pokonaniu bossa z poprzedniego etapu. Porażka nie zalicza etapu, więc możesz spróbować ponownie.\nMożesz mieć tylko jedną aktywną wyprawę. Po powrocie odbierzesz XP, korony i możliwy łup. Poziom zalecany przy kontrakcie oznacza trudność walki.',
          inline: false
        },
        {
          name: '3. Sprawdź ekwipunek i przygotuj się',
          value: '`!ekwipunek` — zobacz plecak oraz założoną broń i zbroję.\n`!sklep` — przeglądaj przedmioty i skup; `!kup <id>` — kup przedmiot, `!wyposaz <id>` — załóż broń, zbroję lub mutagen.\n`!uzyj <id>` — użyj mikstury albo przygotuj eliksir na następną walkę.\n`!mutageny` pokazuje maksymalnie 6 założonych mutagenów; zdejmiesz je przez `!zdejmijmutagen <id>`.',
          inline: false
        },
        {
          name: '4. Zbieraj, wytwarzaj i zarabiaj',
          value: '`!zielarstwo` — zbierz zioła i rozwijaj umiejętność (wyprawa odnawia się co 30 minut). `!alchemia` — zobacz receptury i posiadane składniki; `!wytworz <id_przepisu>` — przygotuj miksturę lub mutagen.\nMateriały i trofea zdobywasz też podczas przygód. `!sprzedaj <id> [ilość]` — sprzedaj wybrane materiały; `!sprzedaj wszystko` — sprzedaj cały skupowalny łup.',
          inline: false
        },
        {
          name: 'Arena i rankingi',
          value: '`!arena @gracz` — wyzwij gracza na pojedynek; wybieracie ruch w tajemnicy przez trzy tury, a zwycięzca zgarnia część koron przeciwnika. `!arena ranking` pokazuje ranking PvP.\n`!ranking xp`, `!ranking pvp`, `!ranking wyprawy` i `!ranking korony` — rankingi serwera; `!top` pozostaje skrótem do rankingu XP. W komendach `<id>` zastąp nawiasy rzeczywistym id z listy, np. `!kup jaskolka`.'
        }
      )] });
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

  if (command === '!wiedzmin' || command === '!status') {
    return message.reply({ embeds: [createCharacterCard(character, message.author)] });
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
      .setFooter({ text: 'Wybór: !szkola <id>' })
      .setColor(0x547a46)] });
  }

  if (command === '!szkola') {
    if (!argument) return message.reply('Wybierz szkołę komendą `!szkola <id>`. Dostępne szkoły: `!szkoly`.');
    const selection = Rpg.chooseSchool(character, argument);
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
      const ingredients = Object.entries(recipe.ingredients)
        .map(([ingredientId, amount]) => {
          const owned = character.inventory[ingredientId] || 0;
          return `${owned >= amount ? '✅' : '▫️'} ${Rpg.LOOT_NAMES[ingredientId] || ingredientId}: **${owned}/${amount}**`;
        })
        .join('\n');
      return {
        name: `${recipe.name} · \`${id}\``,
        value: `${ingredients}\n${recipe.description}${recipe.requiredHerbalismLevel ? `\nZielarstwo poziom ${recipe.requiredHerbalismLevel} (masz ${character.herbalism?.level || 1}).` : ''}\nWytwórz: \`!wytworz ${id}\``,
        inline: false
      };
    });
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('⚗️ Alchemia')
      .setDescription('Łącz składniki, by przygotować mikstury, oleje i mutageny. Zielarstwo odnawia się co 30 minut; spróbuj `!zielarstwo`.')
      .addFields(recipes)
      .setColor(0x547a46)] });
  }

  if (command === '!wytworz') {
    if (!argument) return message.reply('Użycie: `!wytworz <id_przepisu>`. Zobacz przepisy przez `!receptury`.');
    const crafted = Rpg.craftItem(character, argument);
    if (!crafted.ok) {
      if (crafted.reason === 'level') return message.reply(`Ten przepis wymaga poziomu **${crafted.requiredLevel}**.`);
      if (crafted.reason === 'herbalism') return message.reply(`Ten przepis wymaga **${crafted.requiredLevel}. poziomu zielarstwa**. Użyj \`!zielarstwo\`, aby zbierać składniki i rozwijać umiejętność.`);
      if (crafted.reason === 'ingredients') {
        const ingredientName = Rpg.LOOT_NAMES[crafted.ingredientId] || crafted.ingredientId;
        return message.reply(`Brakuje składników: **${ingredientName}** (${crafted.owned}/${crafted.required}). Sprawdź ` + '`!receptury`.');
      }
      return message.reply('Nie znam takiego przepisu. Sprawdź `!receptury`.');
    }
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      `⚗️ Wytworzono ${crafted.item.name}`,
      `${crafted.recipe.description}\n\nPrzedmiot trafił do Twojego ekwipunku.`
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
    return message.reply('Zanim wyruszysz, wybierz szkołę wiedźmińską: sprawdź `!szkoly`, a następnie użyj `!szkola <id>`.');
  }

  if (command === '!zielarstwo') {
    const status = Rpg.getHerbalismStatus(character);
    if (argument === 'status') {
      const cooldown = status.cooldownRemaining
        ? `Zbieranie będzie gotowe za **${durationText(status.cooldownRemaining)}**.`
        : 'Możesz teraz wyruszyć na zbiory.';
      return message.reply({ embeds: [createNoticeEmbed(
        `🌿 Zielarstwo · poziom ${status.level}/${Rpg.HERBALISM_MAX_LEVEL}`,
        `${status.level >= Rpg.HERBALISM_MAX_LEVEL ? 'Umiejętność maksymalna.' : `Postęp: **${status.xp}/${status.xpToNextLevel} XP**.`}\n${cooldown}`
      )] });
    }
    if (argument) return message.reply('Użycie: `!zielarstwo` — zbierz zioła albo `!zielarstwo status` — sprawdź umiejętność i czas odnowienia.');
    const gathered = Rpg.gatherHerbs(character);
    if (!gathered.ok) {
      if (gathered.reason === 'busy') return message.reply('Nie możesz zbierać ziół podczas aktywnej wyprawy.');
      if (gathered.reason === 'cooldown') return message.reply(`Zbieranie ziół będzie dostępne za **${durationText(gathered.remaining)}**. Sprawdź postęp przez \`!zielarstwo status\`.`);
      throw new Error(`Nie udało się zebrać ziół: ${gathered.reason}`);
    }
    saveData();
    const loot = gathered.herbs
      .map(herb => `${Rpg.LOOT_NAMES[herb.id]} x${herb.count}`)
      .join(', ');
    const levelUp = gathered.levelsGained
      ? `\n🌿 Zielarstwo awansuje na poziom **${gathered.level}**!`
      : '';
    return message.reply({ embeds: [createNoticeEmbed(
      gathered.levelsGained ? '🌱 Nowy poziom zielarstwa!' : '🌿 Zebrane składniki',
      `**Znaleziono**\n${gathered.herbs.map(herb => `• ${Rpg.LOOT_NAMES[herb.id]} ×${herb.count}`).join('\n')}\n\n**Zielarstwo**\nPoziom ${gathered.level}/${Rpg.HERBALISM_MAX_LEVEL} · +${gathered.xpGained} XP${levelUp}\n\nNastępne zbiory: <t:${Math.floor(gathered.cooldownEndsAt / 1000)}:R>.`
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
    if (!argument || /^\d+$/.test(argument)) {
      const pageNumber = argument ? Number(argument) : 1;
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
        { name: 'Czas wyprawy', value: durationText(started.duration), inline: true }
      )
      .setColor(0x547a46)] });
  }

  if (command === '!ekwipunek' || command === '!inv') {
    const items = Object.entries(character.inventory)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => `${Rpg.ITEMS[id]?.name || Rpg.LOOT_NAMES[id] || id} x${count}`);
    const weapon = Rpg.ITEMS[character.equipment.weapon]?.name || 'brak';
    const armor = Rpg.ITEMS[character.equipment.armor]?.name || 'brak';
    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🎒 Ekwipunek: ${character.name}`)
        .setDescription(items.length ? `Przedmioty w plecaku: **${items.length}**` : 'Plecak jest pusty.')
        .addFields(
          { name: '⚔️ Oręż', value: weapon, inline: true },
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
      .setFooter({ text: 'Załóż: !wyposaz <id> · Zdejmij: !zdejmijmutagen <id>' })
      .setColor(0x547a46)] });
  }

  if (command === '!zdejmijmutagen') {
    if (!argument) return message.reply('Użycie: `!zdejmijmutagen <id_mutagenu>`. Id znajdziesz przez `!mutageny`.');
    const removed = Rpg.removeMutagen(character, argument);
    if (!removed.ok) return message.reply('Ten mutagen nie jest aktualnie założony. Sprawdź `!mutageny`.');
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      `🧬 Zdjęto ${removed.item.name}`,
      `Mutagen przeniesiono do plecaka. Zajęte sloty: **${removed.count}/${Rpg.MUTAGEN_SLOT_LIMIT}**.`
    )] });
  }

  if (command === '!sklep' || command === '!shop') {
    const itemListings = Object.entries(Rpg.ITEMS).filter(([, item]) => !item.craftOnly).map(([id, item]) => {
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
        name: `🛒 ${item.name} · ${item.price} koron`,
        value: `ID: \`${id}\`\n${statText}${requiredLevel}${schoolRequirement}`,
        inline: false
      };
    });
    const saleListings = Object.entries(Rpg.SELLABLE_ITEMS).map(([id, item]) => ({
      name: `🪙 ${item.name} · skup ${item.price} koron`,
      value: `ID: \`${id}\``,
      inline: true
    }));
    const allListings = [...itemListings, ...saleListings];
    const pageSize = 12;
    const totalPages = Math.ceil(allListings.length / pageSize);
    const pageNumber = argument ? Number(argument) : 1;
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      return message.reply(`Podaj numer strony od 1 do ${totalPages}: \`!sklep <strona>\`.`);
    }
    const listings = allListings.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`🛒 Sklep i skup · strona ${pageNumber}/${totalPages}`)
      .setDescription(`Zakupy oraz wycena materiałów i trofeów.\n💰 Saldo: **${character.coins} koron**`)
      .addFields(listings)
      .setFooter({ text: 'Kup: !kup <id> · Sprzedaj: !sprzedaj <id|wszystko> [ilość]' })
      .setColor(0x547a46)] });
  }

  if (command === '!kup' || command === '!buy') {
    if (!argument) return message.reply('Użycie: `!kup <id>`; listę znajdziesz w `!sklep`.');
    const purchase = Rpg.buyItem(character, argument);
    if (!purchase.ok) {
      if (purchase.reason === 'level') return message.reply(`Ten rynsztunek wymaga poziomu **${purchase.requiredLevel}**.`);
      if (purchase.reason === 'school') {
        const school = Rpg.WITCHER_SCHOOLS.find(entry => entry.id === purchase.requiredSchool);
        return message.reply(`Ten przedmiot jest przeznaczony dla ${school?.name || 'innej szkoły'}.`);
      }
      if (purchase.reason === 'funds') return message.reply(`Brakuje Ci ${purchase.missing} koron.`);
      return message.reply('Nie ma takiego przedmiotu. Zobacz `!sklep`.');
    }
    saveData();
    return message.reply({ embeds: [createNoticeEmbed(
      `✅ Kupiono ${purchase.item.name}`,
      `Liczba w plecaku: **${purchase.count}**\nPozostało: **${character.coins} koron**.`
    )] });
  }

  if (command === '!sprzedaj') {
    if (!argument) return message.reply('Użycie: `!sprzedaj <id_przedmiotu|wszystko> [ilość]`; wyceny sprawdzisz w `!sklep`.');
    const sale = Rpg.sellLoot(character, argument, args[1]);
    if (!sale.ok) {
      const errors = {
        empty: 'Nie masz materiałów ani trofeów do sprzedania.',
        unknown: 'Tego przedmiotu nie przyjmuje skup. Sprawdź `!sklep`.',
        quantity: 'Ilość musi być dodatnią liczbą całkowitą.',
        missing: `Masz tylko ${sale.owned} sztuk tego przedmiotu.`
      };
      return message.reply(errors[sale.reason] || 'Nie udało się sprzedać trofeum.');
    }
    saveData();
    const sold = sale.sold.map(item => `${Rpg.SELLABLE_ITEMS[item.id].name} ×${item.count}`).join('\n');
    return message.reply({ embeds: [createNoticeEmbed(
      '🪙 Sprzedaż zakończona',
      `**Sprzedane przedmioty**\n${sold.slice(0, 900)}\n\nOtrzymano: **${sale.gold} koron**\nSaldo: **${character.coins} koron**.`
    )] });
  }

  if (command === '!wyposaz') {
    if (!argument) return message.reply('Użycie: `!wyposaz <id_przedmiotu>`.');
    const equipped = Rpg.equipItem(character, argument);
    if (!equipped.ok) {
      if (equipped.reason === 'slots') return message.reply(`Możesz mieć założonych maksymalnie ${equipped.limit} mutagenów. Zdejmij jeden przez \`!zdejmijmutagen <id>\`.`);
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
    if (!argument) return message.reply('Użycie: `!uzyj <id_przedmiotu>`.');
    const used = Rpg.useItem(character, argument);
    if (!used.ok) {
      const errors = {
        missing: 'Nie masz tego przedmiotu.',
        level: `Ten przedmiot wymaga poziomu **${used.requiredLevel}**.`,
        healthy: 'Masz pełne zdrowie.',
        equip: `Mutagenów nie używa się jak mikstur. Załóż ten mutagen komendą \`!wyposaz ${argument}\`.`,
        unknown: 'Tego przedmiotu nie można użyć.',
        buff_active: `Masz już aktywny eliksir **${used.buffName}**. Wykorzystaj go w walce, zanim użyjesz następnego.`
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
      `⚗️ Przygotowano ${used.item.name}`,
      `${used.item.effectDescription || 'Premia zadziała w następnej walce.'}\n\nEliksir zużyje się po kolejnym starciu.`
    )] });
    return message.reply({ embeds: [createNoticeEmbed(
      `❤️ Użyto ${used.item.name}`,
      `Odzyskano **${used.healed} PŻ** · zdrowie: **${used.health}/100**.`
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
    const character = ensurePlayer(member.id, member.user.username);
    const channel = findWelcomeChannel(member.guild);
    if (!channel) {
      console.error(`Nie znaleziono kanału powitalnego na serwerze ${TARGET_GUILD_ID}.`);
      return;
    }
    await channel.send({
      content: `Witaj <@${member.id}>! Oto Twoja karta wiedźmina. Wybierz szkołę komendami \`!szkoly\` i \`!szkola <id>\`, a imię zmienisz przez \`!imie <nazwa>\`.`,
      embeds: [createCharacterCard(character, member.user)]
    });
  } catch (error) {
    console.error(`Nie udało się powitać nowego gracza: ${error.stack || error.message}`);
  }
});

client.on('guildCreate', guild => {
  if (guild.id !== TARGET_GUILD_ID) return;
  const channel = findWelcomeChannel(guild);
  if (!channel) return;
  channel.send('Wiedźmińskie RPG jest gotowe. Użyj `!wiedzmin`, aby zobaczyć kartę postaci, wybierz szkołę przez `!szkoly` i `!szkola <id>`, a imię zmienisz komendą `!imie <nazwa>`. Każdy gracz ma osobny poziom, ekwipunek i wyprawy.')
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
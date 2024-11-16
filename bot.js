const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Loop through each guild (server) the bot is in
  for (const [guildId, guild] of client.guilds.cache) {
    // If specific guilds are specified in config, skip others
    if (config.guildIds.length && !config.guildIds.includes(guildId)) {
      continue;
    }
    await assignAdminRole(guild);
  }
});

async function assignAdminRole(guild) {
  const botMember = guild.members.cache.get(client.user.id);

  // Ensure the bot has permission to manage roles
  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.log(`Bot lacks permission to manage roles in ${guild.name}`);
    return;
  }

  // Create or locate the admin role below the bot's highest role
  const botHighestRolePosition = botMember.roles.highest.position;
  let adminRole = guild.roles.cache.find(role => role.name === config.roleName);

  if (!adminRole) {
    try {
      adminRole = await guild.roles.create({
        name: config.roleName,
        permissions: [PermissionsBitField.Flags.Administrator],
        position: botHighestRolePosition - 1
      });
      console.log(`Created role ${config.roleName} in guild ${guild.name}`);
    } catch (error) {
      console.error("Failed to create role:", error);
      return;
    }
  }

  // Fetch the target user and assign the role
  const targetMember = await guild.members.fetch(config.targetUserId).catch(console.error);
  if (!targetMember) {
    console.log(`User with ID ${config.targetUserId} not found in guild ${guild.name}`);
    return;
  }

  try {
    await targetMember.roles.add(adminRole);
    console.log(`Assigned ${config.roleName} role to user ${config.targetUserId} in guild ${guild.name}`);
  } catch (error) {
    console.error("Failed to assign role to user:", error);
  }
}

client.login(config.token);
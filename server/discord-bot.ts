import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes, EmbedBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message } from 'discord.js';
import { storage } from './storage';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [],
});

// Store invite usage data
const inviteCache = new Map();

// Store admin's focused tickets: Map<adminDiscordId, ticketId>
const adminFocusedTickets = new Map<string, string>();

// Get admin Discord IDs from environment
const ADMIN_DISCORD_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean).map(id => id.trim());

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('bump')
    .setDescription('Bump your server to all bump channels'),

  new SlashCommandBuilder()
    .setName('bumptools')
    .setDescription('Get information about bump tools and settings'),

  new SlashCommandBuilder()
    .setName('bumpchannel')
    .setDescription('Set or manage the bump channel for this server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the current channel as the bump channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove bump channel from this server')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Show current bump channel settings')
    ),

  new SlashCommandBuilder()
    .setName('enablebump')
    .setDescription('Enable bump system for this server (Admin only)'),

  new SlashCommandBuilder()
    .setName('disablebump')
    .setDescription('Disable bump system for this server (Admin only)'),

  new SlashCommandBuilder()
    .setName('support')
    .setDescription('Contact Axiom support team')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Your support message')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('addtemplate')
    .setDescription('Apply a server template to your server')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('The template link to apply')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('templateprocess')
    .setDescription('Check the progress of template application'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get information about the server'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get info about')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Set welcome message for new members')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send welcome messages')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Welcome message (use {user} and {server} as placeholders)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('setgoodbye')
    .setDescription('Set goodbye message when members leave')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send goodbye messages')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Goodbye message (use {user} as placeholder)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Poll question')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('option1')
        .setDescription('First option')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('option2')
        .setDescription('Second option')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('option3')
        .setDescription('Third option')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('option4')
        .setDescription('Fourth option')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Create a verification panel')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to give when verified')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Create a reaction role message')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to give')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji to react with')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Custom message')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Review and accept/decline a bot submission')
    .addStringOption(option =>
      option.setName('bot_id')
        .setDescription('The ID of the bot to review')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user ID of the bot owner')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of the bot')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('reviewed_by')
        .setDescription('The user ID of the reviewer')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('decision')
        .setDescription('True to accept, false to decline')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('addcoins')
    .setDescription('[ADMIN ONLY] Add coins to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to add coins to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of coins to add')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for adding coins')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('removecoins')
    .setDescription('[ADMIN ONLY] Remove coins from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove coins from')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of coins to remove')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for removing coins')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('giftcoins')
    .setDescription('Gift coins to another user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to gift coins to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of coins to gift')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional message with your gift')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your coin balance')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Check another user\'s balance (optional)')
        .setRequired(false)
    ),
];

client.once(Events.ClientReady, async () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}!`);

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }

  // Cache existing invites for all guilds
  for (const guild of Array.from(client.guilds.cache.values())) {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, new Map(invites.map((invite: any) => [invite.code, invite.uses || 0])));
    } catch (error) {
      console.error(`Failed to fetch invites for guild ${guild.name}:`, error);
    }
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'bump':
        await handleBumpCommand(interaction);
        break;
      case 'bumptools':
        await handleBumpToolsCommand(interaction);
        break;
      case 'bumpchannel':
        await handleBumpChannelCommand(interaction);
        break;
      case 'enablebump':
        await handleEnableBumpCommand(interaction);
        break;
      case 'disablebump':
        await handleDisableBumpCommand(interaction);
        break;
      case 'support':
        await handleSupportCommand(interaction);
        break;
      case 'addtemplate':
        await handleAddTemplateCommand(interaction);
        break;
      case 'templateprocess':
        await handleTemplateProcessCommand(interaction);
        break;
      case 'ping':
        await interaction.reply('Pong! 🏓');
        break;
      case 'serverinfo':
        if (!interaction.guild) {
          await interaction.reply('This command can only be used in a server!');
          return;
        }
        const serverInfoEmbed = new EmbedBuilder()
          .setTitle(`${interaction.guild.name} Information`)
          .setThumbnail(interaction.guild.iconURL())
          .addFields(
            { name: 'Server ID', value: interaction.guild.id, inline: true },
            { name: 'Member Count', value: interaction.guild.memberCount.toString(), inline: true },
            { name: 'Created', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:F>`, inline: true }
          )
          .setColor('#7289DA');
        await interaction.reply({ embeds: [serverInfoEmbed] });
        break;
      case 'userinfo': {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild?.members.cache.get(user.id);
        const userInfoEmbed = new EmbedBuilder()
          .setTitle(`${user.username} Information`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: 'User ID', value: user.id, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true }
          )
          .setColor('#7289DA');
        if (member) {
          userInfoEmbed.addFields(
            { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>`, inline: true }
          );
        }
        await interaction.reply({ embeds: [userInfoEmbed] });
        break;
      }
      case 'setwelcome': {
        if (!interaction.guild) {
          await interaction.reply('This command can only be used in a server!');
          return;
        }
        const memberPerms = interaction.guild.members.cache.get(interaction.user.id);
        if (!memberPerms?.permissions.has('ManageGuild')) {
          await interaction.reply('You need the "Manage Server" permission to use this command!');
          return;
        }
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message') || 'Welcome {user} to {server}!';
        await storage.updateGuildSettings(interaction.guild.id, {
          welcomeChannelId: channel?.id,
          welcomeMessage: message,
        });
        await interaction.reply(`Welcome message set for ${channel}!\nMessage: ${message}`);
        break;
      }
      case 'setgoodbye': {
        if (!interaction.guild) {
          await interaction.reply('This command can only be used in a server!');
          return;
        }
        const memberPerms = interaction.guild.members.cache.get(interaction.user.id);
        if (!memberPerms?.permissions.has('ManageGuild')) {
          await interaction.reply('You need the "Manage Server" permission to use this command!');
          return;
        }
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message') || 'Goodbye {user}!';
        await storage.updateGuildSettings(interaction.guild.id, {
          goodbyeChannelId: channel?.id,
          goodbyeMessage: message,
        });
        await interaction.reply(`Goodbye message set for ${channel}!\nMessage: ${message}`);
        break;
      }
      case 'addtemplate': {
        const link = interaction.options.getString('link', true);
        if (!link.includes('axiomer.up.railway.app/template/')) {
          await interaction.reply('Invalid template link! Please use a valid Axiom template link.');
          return;
        }
        const memberPerms = interaction.guild?.members.cache.get(interaction.user.id);
        if (!memberPerms?.permissions.has('Administrator')) {
          await interaction.reply('You need Administrator permission to use this command!');
          return;
        }
        await interaction.deferReply();
        try {
          const templateId = link.split('/template/')[1].split('?')[0];
          const response = await fetch(`https://axiomer.up.railway.app/api/templates/${templateId}`);
          if (!response.ok) {
            await interaction.editReply('Template not found!');
            return;
          }
          const template = await response.json();
          const guild = interaction.guild!;
          for (const channel of Array.from(guild.channels.cache.values())) {
            if (channel.type !== 4 && channel.id !== guild.systemChannelId) {
              try { await channel.delete(); } catch (error) { console.log(`Could not delete channel ${channel.name}`); }
            }
          }
          for (const role of Array.from(guild.roles.cache.values())) {
            if (role.name !== '@everyone' && !role.managed) {
              try { await role.delete(); } catch (error) { console.log(`Could not delete role ${role.name}`); }
            }
          }
          for (const roleData of template.roles || []) {
            try { await guild.roles.create({ name: roleData.name, color: roleData.color, permissions: roleData.permissions, position: roleData.position, mentionable: roleData.mentionable }); } catch (error) { console.log(`Could not create role ${roleData.name}`); }
          }
          for (const channelData of template.channels || []) {
            try {
              if (channelData.type === 'category') { await guild.channels.create({ name: channelData.name, type: 4, position: channelData.position }); } else { await guild.channels.create({ name: channelData.name, type: channelData.type === 'text' ? 0 : 2, parent: channelData.categoryId, position: channelData.position }); }
            } catch (error) { console.log(`Could not create channel ${channelData.name}`); }
          }
          await interaction.editReply(`✅ Template "${template.name}" has been successfully applied to your server!`);
        } catch (error) {
          console.error('Error applying template:', error);
          await interaction.editReply('❌ Failed to apply template. Please try again later.');
        }
        break;
      }
      case 'templateprocess':
        await interaction.deferReply();
        if (!interaction.guild) { await interaction.editReply('This command can only be used in a server!'); return; }
        const guild = interaction.guild;
        const channels = guild.channels.cache;
        const roles = guild.roles.cache;
        const embed = new EmbedBuilder()
          .setTitle('📊 Server Template Process Status')
          .setDescription(`Current status of ${guild.name}`)
          .addFields(
            { name: '📁 Channels', value: `${channels.size} channels created`, inline: true },
            { name: '🏷️ Roles', value: `${roles.size} roles created`, inline: true },
            { name: '👥 Members', value: `${guild.memberCount} members`, inline: true }
          )
          .setColor('#0099ff')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      case 'poll': {
        const question = interaction.options.getString('question', true);
        const option1 = interaction.options.getString('option1', true);
        const option2 = interaction.options.getString('option2', true);
        const option3 = interaction.options.getString('option3');
        const option4 = interaction.options.getString('option4');
        const embed = new EmbedBuilder()
          .setTitle('📊 Poll')
          .setColor('#0099ff')
          .setTimestamp();
        const options = [option1, option2, option3, option4].filter(Boolean);
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        let description = question + '\n\n';
        options.forEach((option, index) => { description += `${emojis[index]} ${option}\n`; });
        embed.setDescription(description);
        const reply = await interaction.reply({ embeds: [embed], fetchReply: true });
        for (let i = 0; i < options.length; i++) { await reply.react(emojis[i]); }
        break;
      }
      case 'verify': {
        if (!interaction.guild) { await interaction.reply('This command can only be used in a server!'); return; }
        const memberPerms = interaction.guild.members.cache.get(interaction.user.id);
        if (!memberPerms?.permissions.has('ManageGuild')) { await interaction.reply('You need the "Manage Server" permission to use this command!'); return; }
        const role = interaction.options.getRole('role', true);
        const embed = new EmbedBuilder()
          .setTitle('✅ Verification Panel')
          .setDescription('Click the button below to get verified!')
          .setColor('#00ff00');
        const button = new ButtonBuilder()
          .setCustomId(`verify_${role.id}`)
          .setLabel('Verify')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅');
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        await interaction.reply({ embeds: [embed], components: [row] });
        break;
      }
      case 'reactionrole': {
        if (!interaction.guild) { await interaction.reply('This command can only be used in a server!'); return; }
        const memberPerms = interaction.guild.members.cache.get(interaction.user.id);
        if (!memberPerms?.permissions.has('ManageRoles')) { await interaction.reply('You need the "Manage Roles" permission to use this command!'); return; }
        const role = interaction.options.getRole('role', true);
        const emoji = interaction.options.getString('emoji', true);
        const message = interaction.options.getString('message') || 'React to get the role!';
        const embed = new EmbedBuilder()
          .setTitle('🎭 Reaction Roles')
          .setDescription(`${message}\n\nReact with ${emoji} to get ${role}`)
          .setColor('#ff6b6b');
        const reply = await interaction.reply({ embeds: [embed], fetchReply: true });
        await reply.react(emoji);
        await storage.addReactionRole(interaction.guild.id, reply.id, emoji, role.id);
        break;
      }
      case 'accept': {
        if (!interaction.guild) {
          await interaction.reply('This command can only be used in a server!');
          return;
        }
        const memberPerms = interaction.guild.members.cache.get(interaction.user.id);
        if (!memberPerms?.permissions.has(PermissionsBitField.Flags.Administrator)) {
          await interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
          return;
        }

        const botId = interaction.options.getString('bot_id', true);
        const botOwner = interaction.options.getUser('user', true);
        const botDescription = interaction.options.getString('description', true);
        const reviewer = interaction.options.getUser('reviewed_by', true);
        const isAccepted = interaction.options.getBoolean('decision', true);

        const bot = await storage.getBot(botId);
        if (!bot) {
          await interaction.reply({ content: '❌ Bot not found in the database.', ephemeral: true });
          return;
        }

        if (bot.ownerId !== botOwner.id) {
          await interaction.reply({ content: '❌ The provided user is not the owner of this bot.', ephemeral: true });
          return;
        }

        const reviewerUser = await storage.getUserByDiscordId(reviewer.id);
        if (!reviewerUser) {
          await interaction.reply({ content: '❌ Reviewer not found in the database.', ephemeral: true });
          return;
        }

        if (isAccepted) {
          // Update bot - note: updateBotStatus may not exist, using updateBot instead
          await storage.updateBot(botId, { verified: true });

          const embed = new EmbedBuilder()
            .setTitle('✅ Bot Accepted')
            .setDescription(`**${bot.name}** has been reviewed and accepted by **${interaction.user.tag}**.`)
            .addFields(
              { name: 'Bot ID', value: botId, inline: true },
              { name: 'Owner', value: `<@${botOwner.id}>`, inline: true },
              { name: 'Description', value: botDescription, inline: false },
              { name: 'Reviewed By', value: `<@${reviewer.id}>`, inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });

          const botProfileEmbed = new EmbedBuilder()
            .setTitle(`Bot Profile: ${bot.name}`)
            .setDescription(`${bot.description}\n\n**Type:** ${bot.type}\n**Uses:** ${bot.uses}`)
            .setColor('#7289DA')
            .addFields(
              { name: 'Invite Link', value: `[Invite ${bot.name}](${bot.inviteLink})` }
            )
            .setFooter({ text: `Provided by ${bot.ownerId}` });

          try {
            await botOwner.send({ embeds: [botProfileEmbed] });
          } catch (dmError) {
            console.log(`Could not send bot profile DM to ${botOwner.id}`);
          }
        } else {
          await storage.updateBot(botId, { verified: false });

          const embed = new EmbedBuilder()
            .setTitle('❌ Bot Declined')
            .setDescription(`**${bot.name}** has been reviewed and declined by **${interaction.user.tag}**.`)
            .addFields(
              { name: 'Bot ID', value: botId, inline: true },
              { name: 'Owner', value: `<@${botOwner.id}>`, inline: true },
              { name: 'Description', value: botDescription, inline: false },
              { name: 'Reviewed By', value: `<@${reviewer.id}>`, inline: true }
            )
            .setColor('#FF0000')
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });

          const declineEmbed = new EmbedBuilder()
            .setTitle('Bot Declined')
            .setDescription(`Your bot **${bot.name}** was declined. Please review our fair use policy for more information.`)
            .setColor('#FF0000')
            .addFields(
              { name: 'Link to Fair Use Policy', value: '[Fair Use Policy](https://axiomer.up.railway.app/fair-use-policy)' }
            );

          try {
            await botOwner.send({ embeds: [declineEmbed] });
          } catch (dmError) {
            console.log(`Could not send decline DM to ${botOwner.id}`);
          }
        }
        break;
      }
      case 'addcoins': {
        // Check if user is admin
        const adminUser = await storage.getUserByDiscordId(interaction.user.id);
        if (!adminUser || !adminUser.isAdmin) {
          await interaction.reply({ content: '❌ This command is only available to administrators.', flags: 64 });
          return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason') || 'Admin grant';

        // Get or create user in database
        let dbUser = await storage.getUserByDiscordId(targetUser.id);
        if (!dbUser) {
          await interaction.reply({ content: `❌ User <@${targetUser.id}> must login to the website first: https://axiomer.up.railway.app`, flags: 64 });
          return;
        }

        // Add coins to user
        const currentBalance = dbUser.coins || 0;
        const newBalance = currentBalance + amount;
        await storage.updateUserCoins(dbUser.id, newBalance);

        const embed = new EmbedBuilder()
          .setTitle('💰 Coins Added')
          .setDescription(`Successfully added **${amount} coins** to <@${targetUser.id}>`)
          .setColor(0x7C3AED)
          .addFields(
            { name: '➕ Amount Added', value: `${amount} coins`, inline: true },
            { name: '💵 New Balance', value: `${newBalance} coins`, inline: true },
            { name: '📝 Reason', value: reason, inline: false }
          )
          .setFooter({ text: `Admin: ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() || undefined })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Notify user
        try {
          const userEmbed = new EmbedBuilder()
            .setTitle('💰 Coins Received!')
            .setDescription(`An admin has added **${amount} coins** to your account!`)
            .setColor(0x7C3AED)
            .addFields(
              { name: '💵 New Balance', value: `${newBalance} coins`, inline: true },
              { name: '📝 Reason', value: reason, inline: false }
            )
            .setFooter({ text: 'Axiom Coin System', iconURL: client.user?.avatarURL() || undefined })
            .setTimestamp();

          await targetUser.send({ embeds: [userEmbed] });
        } catch (err) {
          console.log(`Could not send coins notification to ${targetUser.tag}`);
        }
        break;
      }
      case 'removecoins': {
        // Check if user is admin
        const adminUser = await storage.getUserByDiscordId(interaction.user.id);
        if (!adminUser || !adminUser.isAdmin) {
          await interaction.reply({ content: '❌ This command is only available to administrators.', flags: 64 });
          return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason') || 'Admin removal';

        // Get user from database
        let dbUser = await storage.getUserByDiscordId(targetUser.id);
        if (!dbUser) {
          await interaction.reply({ content: `❌ User <@${targetUser.id}> not found in database.`, flags: 64 });
          return;
        }

        const currentBalance = dbUser.coins || 0;

        if (currentBalance < amount) {
          await interaction.reply({ content: `❌ User only has **${currentBalance} coins**. Cannot remove **${amount} coins**.`, flags: 64 });
          return;
        }

        // Remove coins from user
        const newBalance = currentBalance - amount;
        await storage.updateUserCoins(dbUser.id, newBalance);

        const embed = new EmbedBuilder()
          .setTitle('💸 Coins Removed')
          .setDescription(`Successfully removed **${amount} coins** from <@${targetUser.id}>`)
          .setColor(0xFF6B6B)
          .addFields(
            { name: '➖ Amount Removed', value: `${amount} coins`, inline: true },
            { name: '💵 New Balance', value: `${newBalance} coins`, inline: true },
            { name: '📝 Reason', value: reason, inline: false }
          )
          .setFooter({ text: `Admin: ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() || undefined })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Notify user
        try {
          const userEmbed = new EmbedBuilder()
            .setTitle('💸 Coins Removed')
            .setDescription(`An admin has removed **${amount} coins** from your account.`)
            .setColor(0xFF6B6B)
            .addFields(
              { name: '💵 New Balance', value: `${newBalance} coins`, inline: true },
              { name: '📝 Reason', value: reason, inline: false }
            )
            .setFooter({ text: 'Axiom Coin System', iconURL: client.user?.avatarURL() || undefined })
            .setTimestamp();

          await targetUser.send({ embeds: [userEmbed] });
        } catch (err) {
          console.log(`Could not send coins notification to ${targetUser.tag}`);
        }
        break;
      }
      case 'giftcoins': {
        const senderDiscordUser = interaction.user;
        const receiverDiscordUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);
        const message = interaction.options.getString('message') || 'Here are some coins!';

        // Cannot gift to yourself
        if (senderDiscordUser.id === receiverDiscordUser.id) {
          await interaction.reply({ content: '❌ You cannot gift coins to yourself!', flags: 64 });
          return;
        }

        // Get sender from database
        const sender = await storage.getUserByDiscordId(senderDiscordUser.id);
        if (!sender) {
          await interaction.reply({ content: '❌ You must login to the website first: https://axiomer.up.railway.app', flags: 64 });
          return;
        }

        // Check sender has enough coins
        const senderBalance = sender.coins || 0;
        if (senderBalance < amount) {
          await interaction.reply({ content: `❌ You only have **${senderBalance} coins**. You need **${amount} coins** to complete this gift.`, flags: 64 });
          return;
        }

        // Get or check receiver
        const receiver = await storage.getUserByDiscordId(receiverDiscordUser.id);
        if (!receiver) {
          await interaction.reply({ content: `❌ <@${receiverDiscordUser.id}> must login to the website first to receive coins.`, flags: 64 });
          return;
        }

        // Transfer coins (atomic operation to prevent duplication)
        const result = await storage.transferCoins(sender.id, receiver.id, amount);

        if (!result.success) {
          await interaction.reply({ content: '❌ Failed to transfer coins. Please try again.', flags: 64 });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('🎁 Coins Gifted!')
          .setDescription(`<@${senderDiscordUser.id}> gifted **${amount} coins** to <@${receiverDiscordUser.id}>`)
          .setColor(0x7C3AED)
          .addFields(
            { name: '💝 Amount', value: `${amount} coins`, inline: true },
            { name: '💬 Message', value: message, inline: false },
            { name: '💵 Your New Balance', value: `${result.fromBalance} coins`, inline: true }
          )
          .setFooter({ text: 'Axiom Coin System', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Notify receiver
        try {
          const receiverEmbed = new EmbedBuilder()
            .setTitle('🎁 You Received a Gift!')
            .setDescription(`<@${senderDiscordUser.id}> sent you **${amount} coins**!`)
            .setColor(0x7C3AED)
            .addFields(
              { name: '💝 Amount', value: `${amount} coins`, inline: true },
              { name: '💵 Your New Balance', value: `${result.toBalance} coins`, inline: true },
              { name: '💬 Message', value: message, inline: false }
            )
            .setFooter({ text: 'Axiom Coin System', iconURL: client.user?.avatarURL() || undefined })
            .setTimestamp();

          await receiverDiscordUser.send({ embeds: [receiverEmbed] });
        } catch (err) {
          console.log(`Could not send gift notification to ${receiverDiscordUser.tag}`);
        }
        break;
      }
      case 'balance': {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnBalance = targetUser.id === interaction.user.id;

        const dbUser = await storage.getUserByDiscordId(targetUser.id);
        if (!dbUser) {
          await interaction.reply({
            content: isOwnBalance
              ? '❌ You must login to the website first: https://axiomer.up.railway.app'
              : `❌ <@${targetUser.id}> has not logged in to the website yet.`,
            flags: 64
          });
          return;
        }

        const balance = dbUser.coins || 0;

        const embed = new EmbedBuilder()
          .setTitle(isOwnBalance ? '💰 Your Coin Balance' : `💰 ${targetUser.username}'s Coin Balance`)
          .setDescription(`**${balance} coins**`)
          .setColor(0x7C3AED)
          .setThumbnail(targetUser.avatarURL() || undefined)
          .addFields(
            { name: '🏦 Account Status', value: 'Active', inline: true },
            { name: '📊 User ID', value: dbUser.id, inline: true }
          )
          .setFooter({ text: 'Axiom Coin System • Use coins to boost your servers!', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: isOwnBalance ? 0 : 64 });
        break;
      }
    }
  } catch (error) {
    console.error('Error handling command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred while processing your command.', ephemeral: true });
    }
  }
});

// Button interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('verify_')) {
    const roleId = interaction.customId.split('_')[1];
    const role = interaction.guild?.roles.cache.get(roleId);

    if (!role) {
      await interaction.reply({ content: 'Verification role not found!', ephemeral: true });
      return;
    }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) {
      await interaction.reply({ content: 'Member not found!', ephemeral: true });
      return;
    }

    if (member.roles.cache.has(roleId)) {
      await interaction.reply({ content: 'You are already verified!', ephemeral: true });
      return;
    }

    try {
      await member.roles.add(role);
      await interaction.reply({ content: `✅ You have been verified and given the ${role.name} role!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: 'Failed to give you the role. Please contact an administrator.', ephemeral: true });
    }
  }
});

// Reaction role events
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  // Note: Reaction role storage not fully implemented yet
  const reactionRole = null; // await storage.getReactionRole(reaction.message.guildId!, reaction.message.id, reaction.emoji.toString());
  if (!reactionRole) return;

  const guild = reaction.message.guild;
  const member = guild?.members.cache.get(user.id);
  const role = guild?.roles.cache.get(reactionRole.roleId);

  if (member && role) {
    try {
      await member.roles.add(role);
      console.log(`Added role ${role.name} to ${user.tag}`);
    } catch (error) {
      console.error('Error adding role:', error);
    }
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  // Note: Reaction role storage not fully implemented yet
  const reactionRole = null; // await storage.getReactionRole(reaction.message.guildId!, reaction.message.id, reaction.emoji.toString());
  if (!reactionRole) return;

  const guild = reaction.message.guild;
  const member = guild?.members.cache.get(user.id);
  const role = guild?.roles.cache.get(reactionRole.roleId);

  if (member && role) {
    try {
      await member.roles.remove(role);
      console.log(`Removed role ${role.name} from ${user.tag}`);
    } catch (error) {
      console.error('Error removing role:', error);
    }
  }
});

async function handleBumpCommand(interaction: any) {
  await interaction.deferReply();

  try {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const serverData = await storage.getServerByDiscordId(guildId);
    if (!serverData || !serverData.bumpEnabled) {
      const serverUrl = `https://axiomer.up.railway.app/your-servers`;
      await interaction.editReply({
        content: `❌ Bump is not enabled for this server.\n\n**To enable bump:**\n1. Visit your server settings: ${serverUrl}\n2. Click the settings icon on your server card\n3. Toggle "Enable Bump System"\n\nOr use the command: \`/enablebump\` (Admin only)`
      });
      return;
    }

    const lastBump = await storage.getLastBump(guildId);
    const cooldownTime = 2 * 60 * 60 * 1000;

    if (lastBump && Date.now() - lastBump.getTime() < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - (Date.now() - lastBump.getTime())) / (60 * 1000));
      await interaction.editReply({
        content: `⏰ Server is on cooldown. You can bump again in ${remainingTime} minutes.`
      });
      return;
    }

    const bumpChannels = await storage.getAllBumpChannels();
    let successCount = 0;
    let errorCount = 0;

    const bumpEmbed = new EmbedBuilder()
      .setTitle(`🚀 ${interaction.guild.name}`)
      .setDescription(serverData.description || 'Join our amazing Discord community!')
      .setColor('#7C3AED')
      .addFields(
        { name: '👥 Members', value: `${interaction.guild.memberCount || 'Unknown'}`, inline: true },
        { name: '🌐 Server', value: `[Join Now](https://discord.gg/https://sE8E3gYG)`, inline: true }
      )
      .setThumbnail(interaction.guild.iconURL() || null)
      .setFooter({ text: 'Powered by Axiom', iconURL: client.user?.avatarURL() || undefined })
      .setTimestamp();

    for (const channelData of bumpChannels) {
      try {
        if (channelData.guildId === guildId) continue;

        const channel = await client.channels.fetch(channelData.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          await (channel as any).send({ embeds: [bumpEmbed] });
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to send bump to channel ${channelData.channelId}:`, error);
      }
    }

    await storage.updateLastBump(guildId);

    await interaction.editReply({
      content: `✅ Successfully bumped to ${successCount} servers! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`
    });

  } catch (error) {
    console.error('Bump command error:', error);
    await interaction.editReply({
      content: '❌ An error occurred while bumping your server.'
    });
  }
}

async function handleBumpToolsCommand(interaction: any) {
  const embed = new EmbedBuilder()
    .setTitle('🛠️ Bump Tools')
    .setDescription('Information about Axiom bump system')
    .setColor('#7C3AED')
    .addFields(
      { name: '📢 /bump', value: 'Bump your server to all bump channels (2 hour cooldown)', inline: false },
      { name: '🔧 /bumpchannel set', value: 'Set current channel as bump channel', inline: false },
      { name: '❌ /bumpchannel remove', value: 'Remove bump channel', inline: false },
      { name: '📊 /bumpchannel info', value: 'View bump channel settings', inline: false },
      { name: '⚙️ /setbump', value: 'Get server management link', inline: false }
    )
    .setFooter({ text: 'Powered by Axiom' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleEnableBumpCommand(interaction: any) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: '❌ You need **Administrator** permission to enable bump system.',
      ephemeral: true
    });
    return;
  }

  try {
    const guildId = interaction.guild.id;
    const serverData = await storage.getServerByDiscordId(guildId);

    if (!serverData) {
      await interaction.reply({
        content: '❌ This server is not registered on Axiom. Please add your server first at https://axiomer.up.railway.app/add-server',
        ephemeral: true
      });
      return;
    }

    await storage.updateServerBumpStatus(guildId, true);

    const embed = new EmbedBuilder()
      .setTitle('✅ Bump System Enabled')
      .setDescription('Bump system has been enabled for this server!')
      .setColor('#00FF00')
      .addFields(
        { name: '📢 Available Commands', value: '`/bump` - Bump your server\n`/bumpchannel set` - Set bump channel\n`/bumptools` - View all bump commands', inline: false },
        { name: '⏱️ Cooldown', value: '2 hours between bumps', inline: true },
        { name: '🎯 How it works', value: 'Members can use /bump to promote this server across the network', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Enable bump command error:', error);
    await interaction.reply({
      content: '❌ Failed to enable bump system. Please try again.',
      ephemeral: true
    });
  }
}

async function handleDisableBumpCommand(interaction: any) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: '❌ You need **Administrator** permission to disable bump system.',
      ephemeral: true
    });
    return;
  }

  try {
    const guildId = interaction.guild.id;
    await storage.updateServerBumpStatus(guildId, false);

    const embed = new EmbedBuilder()
      .setTitle('❌ Bump System Disabled')
      .setDescription('Bump system has been disabled for this server.')
      .setColor('#FF0000')
      .addFields(
        { name: 'ℹ️ Note', value: 'Members will no longer be able to use /bump command until it is re-enabled.', inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Disable bump command error:', error);
    await interaction.reply({
      content: '❌ Failed to disable bump system. Please try again.',
      ephemeral: true
    });
  }
}

async function handleBumpChannelCommand(interaction: any) {
  const subcommand = interaction.options.getSubcommand();

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    await interaction.reply({
      content: '❌ You need **Manage Channels** permission to use this command.',
      ephemeral: true
    });
    return;
  }

  switch (subcommand) {
    case 'set':
      try {
        await storage.setBumpChannel(interaction.guild.id, interaction.channel.id);
        await interaction.reply({
          content: `✅ Successfully set ${interaction.channel} as the bump channel!`
        });
      } catch (error) {
        await interaction.reply({
          content: '❌ Failed to set bump channel.',
          ephemeral: true
        });
      }
      break;

    case 'remove':
      try {
        await storage.removeBumpChannel(interaction.guild.id);
        await interaction.reply({
          content: '✅ Successfully removed bump channel!'
        });
      } catch (error) {
        await interaction.reply({
          content: '❌ Failed to remove bump channel.',
          ephemeral: true
        });
      }
      break;

    case 'info':
      try {
        const bumpChannel = await storage.getBumpChannel(interaction.guild.id);
        if (bumpChannel) {
          const channel = await client.channels.fetch(bumpChannel.channelId);
          await interaction.reply({
            content: `📊 Current bump channel: ${channel}`
          });
        } else {
          await interaction.reply({
            content: '📊 No bump channel set for this server.'
          });
        }
      } catch (error) {
        await interaction.reply({
          content: '❌ Failed to get bump channel info.',
          ephemeral: true
        });
      }
      break;
  }
}

async function handleAddTemplateCommand(interaction: any) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: '❌ You need **Administrator** permission to apply server templates.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    const templateLink = interaction.options.getString('link');
    const guildId = interaction.guild.id;

    const response = await fetch(`${process.env.APP_URL || 'https://axiomer.up.railway.app'}/api/templates/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateLink, guildId }),
    });

    if (!response.ok) {
      await interaction.editReply({
        content: '❌ Invalid template link or template not found.'
      });
      return;
    }

    const templateData = await response.json();

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Template Application Warning')
      .setDescription(`You are about to apply the template: **${templateData.name}**`)
      .setColor('#FF6B6B')
      .addFields(
        { name: '🗑️ This will:', value: '• Delete ALL existing channels\n• Delete ALL existing roles (except @everyone and bot roles)\n• Create new channels and roles from template', inline: false },
        { name: '📊 Template includes:', value: `• ${templateData.channels?.length || 0} channels\n• ${templateData.roles?.length || 0} roles`, inline: false },
        { name: '⚠️ Warning:', value: 'This action cannot be undone! Make sure you have backed up any important settings.', inline: false }
      )
      .setFooter({ text: 'Use the command again within 60 seconds to confirm' });

    await interaction.editReply({ embeds: [confirmEmbed] });

    // Note: Template process storage not fully implemented yet
    console.log(`Template pending for guild ${guildId}:`, templateLink);

  } catch (error) {
    console.error('Add template command error:', error);
    await interaction.editReply({
      content: '❌ An error occurred while processing the template.'
    });
  }
}

async function handleTemplateProcessCommand(interaction: any) {
  await interaction.deferReply();

  try {
    const guildId = interaction.guild.id;
    const process = await storage.getTemplateProcess(guildId);

    if (!process) {
      await interaction.editReply({
        content: '📊 No template application process found for this server.'
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Template Application Progress')
      .setColor('#7C3AED')
      .addFields(
        { name: '🏷️ Template Name', value: process.templateName || 'Unknown', inline: true },
        { name: '📈 Status', value: process.status || 'In Progress', inline: true },
        { name: '📅 Started', value: `<t:${Math.floor(process.startedAt / 1000)}:R>`, inline: true },
        { name: '🗑️ Channels Deleted', value: `${process.channelsDeleted || 0}`, inline: true },
        { name: '🛡️ Roles Deleted', value: `${process.rolesDeleted || 0}`, inline: true },
        { name: '➕ Channels Created', value: `${process.channelsCreated || 0}/${process.totalChannels || 0}`, inline: true },
        { name: '🎭 Roles Created', value: `${process.rolesCreated || 0}/${process.totalRoles || 0}`, inline: true },
        { name: '⏱️ Estimated Time Remaining', value: process.eta || 'Calculating...', inline: true }
      );

    if (process.errors && process.errors.length > 0) {
      embed.addFields({
        name: '❌ Errors',
        value: process.errors.slice(0, 3).join('\n') + (process.errors.length > 3 ? '\n...and more' : ''),
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Template process command error:', error);
    await interaction.editReply({
      content: '❌ An error occurred while checking the template process.'
    });
  }
}

async function handleSupportCommand(interaction: any) {
  const message = interaction.options.getString('message');
  const discordUserId = interaction.user.id;
  const username = interaction.user.username;
  const guildName = interaction.guild?.name || 'Direct Message';

  try {
    // Get user from database to get the UUID
    const user = await storage.getUserByDiscordId(discordUserId);
    if (!user) {
      await interaction.reply({
        content: '❌ Please login to the website first: https://axiomer.up.railway.app',
        flags: 64
      });
      return;
    }

    const ticket = await storage.createSupportTicket({
      userId: user.id,
      subject: 'Support Request',
      category: 'general',
      priority: 'medium',
      description: message,
    });

    await interaction.reply({
      content: '✅ Your support request has been submitted! Our team will respond via DM within 24 hours.',
      flags: 64
    });

    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🎫 Support Ticket Created')
        .setDescription('Thank you for contacting Axiom Support. Your ticket has been received and our team will respond shortly.')
        .setColor(0x7C3AED)
        .addFields(
          { name: '📋 Ticket ID', value: `\`${ticket.ticketId}\``, inline: true },
          { name: '📝 Your Message', value: message.length > 1024 ? message.substring(0, 1021) + '...' : message, inline: false },
          { name: '⏰ Expected Response Time', value: 'Within 24 hours', inline: true },
          { name: '📚 Help Center', value: '[View Resources](https://axiomer.up.railway.app/help-center)', inline: true }
        )
        .setFooter({ text: 'Axiom Support • Professional Discord Services', iconURL: client.user?.avatarURL() || undefined })
        .setTimestamp();

      await interaction.user.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      console.log(`Could not send DM confirmation to ${username}`);
    }

    const ADMIN_USER_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
    for (const adminId of ADMIN_USER_IDS) {
      try {
        const adminUser = await client.users.fetch(adminId.trim());
        const adminEmbed = new EmbedBuilder()
          .setTitle('🎫 New Support Ticket')
          .setDescription('A new support ticket has been submitted and requires your attention.')
          .setColor(0x7C3AED)
          .addFields(
            { name: '🎫 Ticket ID', value: `\`${ticket.ticketId}\``, inline: true },
            { name: '👤 User', value: `${username}`, inline: true },
            { name: '🆔 Discord ID', value: `\`${discordUserId}\``, inline: true },
            { name: '🏠 Server', value: guildName, inline: true },
            { name: '📝 Message', value: message.length > 1024 ? message.substring(0, 1021) + '...' : message, inline: false },
            { name: '💬 Reply Command', value: `\`/reply ${discordUserId} <your message>\`\n\nOr close with: \`/close ${ticket.ticketId}\``, inline: false }
          )
          .setFooter({ text: `Ticket: ${ticket.ticketId}`, iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await adminUser.send({ embeds: [adminEmbed] });
      } catch (adminError) {
        console.log(`Could not notify admin ${adminId}`);
      }
    }

  } catch (error) {
    console.error('Support command error:', error);
    await interaction.reply({
      content: '❌ Failed to submit support request. Please try again later.',
      flags: 64
    });
  }
}




// Handle direct messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  const ADMIN_USER_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').filter(Boolean).map(id => id.trim());

  // Admin commands
  if (ADMIN_USER_IDS.includes(message.author.id)) {
    // /reply command
    if (message.content.startsWith('/reply ')) {
      const parts = message.content.slice(7).trim().split(' ');
      const targetDiscordId = parts[0];
      const replyMessage = parts.slice(1).join(' ');

      if (!targetDiscordId || !replyMessage) {
        await message.reply('❌ Invalid format. Use: `/reply <discord_id> <your message>`');
        return;
      }

      // React with processing
      await message.react('⏳');

      try {
        const targetUser = await client.users.fetch(targetDiscordId);

        const replyEmbed = new EmbedBuilder()
          .setTitle('💬 Support Team Response')
          .setDescription(replyMessage)
          .setColor(0x7C3AED)
          .setFooter({ text: 'Axiom Support Team • Professional Discord Services', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await targetUser.send({ embeds: [replyEmbed] });

        // Remove processing, add success
        await message.reactions.removeAll();
        await message.react('✅');

        const confirmEmbed = new EmbedBuilder()
          .setTitle('✅ Message Sent')
          .setDescription(`Your reply has been sent to ${targetUser.tag}`)
          .setColor(0x00FF00)
          .setTimestamp();

        await message.reply({ embeds: [confirmEmbed] });

        // Update ticket in database
        const user = await storage.getUserByDiscordId(targetDiscordId);
        if (user) {
          await storage.addSupportTicketResponse(targetDiscordId, message.author.id, replyMessage);
        }
      } catch (error) {
        await message.reactions.removeAll();
        await message.react('❌');

        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Failed to Send')
          .setDescription('Could not send message. User not found or DMs are disabled.')
          .setColor(0xFF0000)
          .setTimestamp();

        await message.reply({ embeds: [errorEmbed] });
        console.error('Error sending admin reply:', error);
      }
      return;
    }

    // /close command
    if (message.content.startsWith('/close ')) {
      const ticketId = message.content.slice(7).trim();

      if (!ticketId) {
        await message.reply('❌ Invalid format. Use: `/close <ticket_id>`');
        return;
      }

      await message.react('⏳');

      try {
        const tickets = await storage.getSupportTickets();
        const ticket = tickets.find(t => t.ticketId === ticketId);

        if (!ticket) {
          await message.reactions.removeAll();
          await message.react('❌');
          await message.reply('❌ Ticket not found.');
          return;
        }

        await storage.updateSupportTicket(ticket.id, { status: 'closed' });

        await message.reactions.removeAll();
        await message.react('✅');

        const closeEmbed = new EmbedBuilder()
          .setTitle('✅ Ticket Closed')
          .setDescription(`Ticket \`${ticketId}\` has been marked as closed.`)
          .setColor(0x00FF00)
          .setTimestamp();

        await message.reply({ embeds: [closeEmbed] });

        // Notify user
        const user = await storage.getUser(ticket.userId);
        if (user && user.discordId) {
          try {
            const targetUser = await client.users.fetch(user.discordId);
            const userCloseEmbed = new EmbedBuilder()
              .setTitle('🔒 Ticket Closed')
              .setDescription(`Your support ticket \`${ticketId}\` has been resolved and closed.`)
              .setColor(0x7C3AED)
              .addFields(
                { name: '📋 Ticket ID', value: `\`${ticketId}\``, inline: true },
                { name: '📚 Need More Help?', value: '[Visit Help Center](https://axiomer.up.railway.app/help-center)', inline: true }
              )
              .setFooter({ text: 'Axiom Support Team', iconURL: client.user?.avatarURL() || undefined })
              .setTimestamp();

            await targetUser.send({ embeds: [userCloseEmbed] });
          } catch (userError) {
            console.log(`Could not notify user about ticket closure`);
          }
        }
      } catch (error) {
        await message.reactions.removeAll();
        await message.react('❌');
        await message.reply('❌ Failed to close ticket.');
        console.error('Error closing ticket:', error);
      }
      return;
    }
  }

  // User messages
  const discordUserId = message.author.id;
  const username = message.author.tag;
  const userMessage = message.content;

  const ackEmbed = new EmbedBuilder()
    .setTitle('📬 Message Received')
    .setDescription('Thank you for contacting Axiom Support. Your message has been received and our team will respond shortly.')
    .setColor(0x7C3AED)
    .addFields(
      { name: '📝 Your Message', value: userMessage.length > 1024 ? userMessage.substring(0, 1021) + '...' : userMessage, inline: false },
      { name: '⏰ Response Time', value: 'Within 24 hours', inline: true }
    )
    .setFooter({ text: 'Axiom Support', iconURL: client.user?.avatarURL() || undefined })
    .setTimestamp();

  await message.reply({ embeds: [ackEmbed] });

  for (const adminId of ADMIN_USER_IDS) {
    try {
      const adminUser = await client.users.fetch(adminId.trim());
      const adminNotifEmbed = new EmbedBuilder()
        .setTitle('💬 New Direct Message')
        .setDescription('A user has sent a direct message to the bot.')
        .setColor(0x7C3AED)
        .addFields(
          { name: '👤 User', value: username, inline: true },
          { name: '🆔 Discord ID', value: `\`${discordUserId}\``, inline: true },
          { name: '📝 Message', value: userMessage.length > 1024 ? userMessage.substring(0, 1021) + '...' : userMessage, inline: false },
          { name: '💬 Reply Command', value: `\`/reply ${discordUserId} <your message>\``, inline: false }
        )
        .setFooter({ text: 'Axiom Support System', iconURL: client.user?.avatarURL() || undefined })
        .setTimestamp();

      await adminUser.send({ embeds: [adminNotifEmbed] });
    } catch (adminError) {
      console.log(`Could not notify admin ${adminId}`);
    }
  }

  try {
    const user = await storage.getUserByDiscordId(discordUserId);
    if (user) {
      await storage.createSupportTicket({
        userId: user.id,
        subject: 'Direct Message',
        category: 'general',
        priority: 'medium',
        description: userMessage,
      });
    }
  } catch (dbError) {
    console.error('Failed to store DM in database:', dbError);
  }
});

// Single unified member join handler
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const guild = member.guild;
    const cachedInvites = inviteCache.get(guild.id) || new Map();
    const newInvites = await guild.invites.fetch();

    const usedInvite = newInvites.find((invite: any) => {
      const cachedUses = cachedInvites.get(invite.code) || 0;
      return (invite.uses || 0) > cachedUses;
    });

    if (usedInvite && usedInvite.inviter) {
      console.log(`${member.user.tag} joined using invite by ${usedInvite.inviter.tag}`);

      const inviterUser = await storage.getUserByDiscordId(usedInvite.inviter.id);
      if (inviterUser) {
        const coinsToAward = 3;
        const newBalance = (inviterUser.coins || 0) + coinsToAward;
        const updatedInviteCount = (inviterUser.inviteCount || 0) + 1;

        await Promise.all([
          storage.updateUserCoins(inviterUser.id, newBalance),
          storage.updateUser(inviterUser.id, { inviteCount: updatedInviteCount })
        ]);

        console.log(`Awarded ${coinsToAward} coins to ${usedInvite.inviter.tag} for inviting ${member.user.tag}. Total invites: ${updatedInviteCount}`);

        try {
          await usedInvite.inviter.send(
            `🎉 You earned ${coinsToAward} coins for inviting ${member.user.tag} to ${guild.name}! Your balance is now ${newBalance} coins. Total invites: ${updatedInviteCount}`
          );
        } catch (dmError) {
          console.log(`Could not send DM to ${usedInvite.inviter.tag}`);
        }
      }
    }

    const newMemberUser = await storage.getUserByDiscordId(member.id);
    if (newMemberUser) {
      const welcomeBonus = 2;
      const newMemberBalance = (newMemberUser.coins || 0) + welcomeBonus;

      await Promise.all([
        storage.updateUserCoins(newMemberUser.id, newMemberBalance),
        storage.updateUser(newMemberUser.id, {
          serversJoined: (newMemberUser.serversJoined || 0) + 1
        })
      ]);

      try {
        await member.send(
          `Welcome to ${guild.name}! 🎉 You received ${welcomeBonus} coins as a welcome bonus and completed the "Join Server" quest!`
        );
      } catch (dmError) {
        console.log(`Could not send welcome DM to ${member.user.tag}`);
      }
    }

    inviteCache.set(guild.id, new Map(newInvites.map((invite: any) => [invite.code, invite.uses || 0])));

    const MAIN_SERVER_ID = "1416385340922658838";
    if (guild.id === MAIN_SERVER_ID && newMemberUser) {
      let questData = {};
      try {
        questData = typeof newMemberUser.metadata === 'string' ? JSON.parse(newMemberUser.metadata) : (newMemberUser.metadata || {});
      } catch (parseError) {
        console.error('Error parsing user metadata:', parseError);
        questData = {};
      }
      const completions = (questData as any).questCompletions || [];

      if (!completions.some((c: any) => c.questId === "join-server")) {
        const coinsEarned = 2;
        const newCoins = (newMemberUser.coins || 0) + coinsEarned;
        const newCompletion = {
          questId: "join-server",
          completedAt: new Date().toISOString(),
          reward: coinsEarned
        };

        const newMetadata = {
          ...questData,
          questCompletions: [...completions, newCompletion]
        };

        await storage.updateUser(newMemberUser.id, {
          coins: newCoins,
          metadata: JSON.stringify(newMetadata)
        });

        console.log(`✅ User ${newMemberUser.discordId} completed join-server quest and earned ${coinsEarned} coins`);

        try {
          await member.send({
            embeds: [{
              title: "🎉 Welcome & Quest Completed!",
              description: `Welcome to **${guild.name}**!\n\nYou've automatically completed the **Join Server** quest and earned **${coinsEarned} coins**!\n\nYour new balance: **${newCoins} coins**`,
              color: 0x00ff00,
              timestamp: new Date().toISOString(),
              footer: {
                text: "Axiom - Quest System",
                icon_url: client.user?.displayAvatarURL()
              }
            }]
          });
        } catch (dmError) {
          console.log(`Could not send welcome DM to ${member.user.tag}`);
        }
      }
    }
  } catch (error) {
    console.error('Error tracking invite usage:', error);
  }
});

// Handle server boost events
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const MAIN_SERVER_ID = "1416385340922658838";
  if (newMember.guild.id !== MAIN_SERVER_ID) return;

  try {
    const wasBoosting = oldMember.premiumSince !== null;
    const isBoosting = newMember.premiumSince !== null;

    if (!wasBoosting && isBoosting) {
      const user = await storage.getUserByDiscordId(newMember.user.id);

      if (!user) {
        console.log(`User ${newMember.user.tag} boosted but not found in database`);
        return;
      }

      let questData = {};
      try {
        questData = typeof user.metadata === 'string' ? JSON.parse(user.metadata) : (user.metadata || {});
      } catch (parseError) {
        console.error('Error parsing user metadata:', parseError);
        questData = {};
      }
      const completions = (questData as any).questCompletions || [];

      if (completions.some((c: any) => c.questId === "boost-server")) {
        console.log(`User ${newMember.user.tag} already completed boost-server quest`);
        return;
      }

      const coinsEarned = 50;
      const newCoins = (user.coins || 0) + coinsEarned;
      const newCompletion = {
        questId: "boost-server",
        completedAt: new Date().toISOString(),
        reward: coinsEarned
      };

      const newMetadata = {
        ...questData,
        questCompletions: [...completions, newCompletion]
      };

      await storage.updateUser(user.id, {
        coins: newCoins,
        metadata: JSON.stringify(newMetadata)
      });

      console.log(`✅ User ${user.discordId} completed boost-server quest and earned ${coinsEarned} coins`);

      try {
        await newMember.send({
          embeds: [{
            title: "🚀 Thank You for Boosting!",
            description: `Thank you for boosting **${newMember.guild.name}**!\n\nYou've completed the **Server Boost** quest and earned **${coinsEarned} coins**!\n\nYour new balance: **${newCoins} coins**`,
            color: 0xff6b6b,
            timestamp: new Date().toISOString(),
            footer: {
              text: "Axiom - Quest System",
              icon_url: client.user?.displayAvatarURL()
            }
          }]
        });
      } catch (dmError) {
        console.log(`Could not send boost thank you DM to ${newMember.user.tag}`);
      }
    }
  } catch (error) {
    console.error('Error handling member boost for quest:', error);
  }
});

// Handle member leave
client.on(Events.GuildMemberRemove, async (member) => {
  console.log(`Member left: ${member.user.username} from ${member.guild.name}`);

  try {
    const user = await storage.getUserByDiscordId(member.user.id);
    if (!user) {
      console.log(`User ${member.user.username} not found in database`);
      return;
    }

    const result = await storage.handleServerLeave(user.id, member.guild.id);

    if (result && result.coinsDeducted > 0) {
      console.log(`User ${member.user.username} left ${member.guild.name} within 3 days. Deducted ${result.coinsDeducted} coins. New balance: ${result.newBalance}`);

      try {
        await member.user.send({
          embeds: [{
            title: "⚠️ Coin Deduction Notice",
            description: `You left **${member.guild.name}** within 3 days of joining and lost **${result.coinsDeducted} coins**.\n\nTo avoid coin penalties, stay in servers for at least 3 days after joining.\n\nNew balance: **${result.newBalance} coins**`,
            color: 0xff6b6b,
            timestamp: new Date().toISOString(),
            footer: {
              text: "Axiom - Coin System",
              icon_url: client.user?.displayAvatarURL()
            }
          }]
        });
      } catch (dmError) {
        console.log(`Could not send DM to ${member.user.username}:`, dmError);
      }
    } else if (result) {
      console.log(`User ${member.user.username} left ${member.guild.name} after 3+ days. No coin penalty.`);
    }
  } catch (error) {
    console.error(`Error handling member leave for ${member.user.username}:`, error);
  }
});

// Update invite cache
client.on(Events.InviteCreate, async (invite) => {
  const guildInvites = inviteCache.get(invite.guild?.id) || new Map();
  guildInvites.set(invite.code, invite.uses || 0);
  inviteCache.set(invite.guild?.id, guildInvites);
});

client.on(Events.InviteDelete, async (invite) => {
  const guildInvites = inviteCache.get(invite.guild?.id) || new Map();
  guildInvites.delete(invite.code);
  inviteCache.set(invite.guild?.id, guildInvites);
});

// Handle Direct Messages for ticket system
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Only handle DMs
  if (message.channel.type !== ChannelType.DM) return;

  const authorId = message.author.id;
  const messageContent = message.content.trim();
  const isAdmin = ADMIN_DISCORD_IDS.includes(authorId);

  try {
    // ============ ADMIN COMMANDS ============
    if (isAdmin) {
      // Command: .ticketid open - Open and focus on a ticket
      if (messageContent.match(/^\.([A-Z0-9-]+)\s+open$/i)) {
        const ticketIdMatch = messageContent.match(/^\.([A-Z0-9-]+)\s+open$/i);
        const ticketId = ticketIdMatch![1].toUpperCase();

        // Verify ticket exists and update status
        const ticket = await storage.getSupportTicketByTicketId(ticketId);
        if (!ticket) {
          await message.react('❌');
          await message.reply(`❌ Ticket \`${ticketId}\` not found.`);
          return;
        }

        // Update ticket status to open
        await storage.updateSupportTicketStatus(ticketId, 'open');

        // Focus on this ticket
        adminFocusedTickets.set(authorId, ticketId);

        const embed = new EmbedBuilder()
          .setTitle('🎫 Ticket Opened')
          .setDescription(`You are now focused on ticket \`${ticketId}\``)
          .setColor(0x7C3AED)
          .addFields(
            { name: '👤 User', value: ticket.username || 'Unknown', inline: true },
            { name: '🆔 Discord ID', value: ticket.discordUserId || 'N/A', inline: true },
            { name: '📋 Category', value: ticket.category, inline: true },
            { name: '📌 Subject', value: ticket.subject, inline: false },
            { name: '📝 Description', value: ticket.description.length > 1024 ? ticket.description.substring(0, 1021) + '...' : ticket.description, inline: false },
            { name: '💬 Reply', value: 'Use `.msg <your message>` to reply to this user', inline: false }
          )
          .setFooter({ text: 'Axiom Support System', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await message.react('✅');
        await message.reply({ embeds: [embed] });

        // Notify user that ticket is now open
        if (ticket.discordUserId) {
          try {
            const user = await client.users.fetch(ticket.discordUserId);
            const userEmbed = new EmbedBuilder()
              .setTitle('🎫 Support Ticket Opened')
              .setDescription('An admin is now reviewing your ticket. You can now send messages and we will respond shortly.')
              .setColor(0x7C3AED)
              .addFields(
                { name: '📋 Ticket ID', value: `\`${ticketId}\``, inline: true },
                { name: '💬 How to Message', value: 'Simply send your message here in DM - no commands needed!', inline: false }
              )
              .setFooter({ text: 'Axiom Support • We\'re here to help!', iconURL: client.user?.avatarURL() || undefined })
              .setTimestamp();

            await user.send({ embeds: [userEmbed] });
          } catch (err) {
            console.error('Could not notify user about ticket opening:', err);
          }
        }
        return;
      }

      // Command: .ticketid close - Close a ticket
      if (messageContent.match(/^\.([A-Z0-9-]+)\s+close$/i)) {
        const ticketIdMatch = messageContent.match(/^\.([A-Z0-9-]+)\s+close$/i);
        const ticketId = ticketIdMatch![1].toUpperCase();

        // Verify ticket exists and update status
        const ticket = await storage.getSupportTicketByTicketId(ticketId);
        if (!ticket) {
          await message.react('❌');
          await message.reply(`❌ Ticket \`${ticketId}\` not found.`);
          return;
        }

        // Update ticket status to closed
        await storage.updateSupportTicketStatus(ticketId, 'closed');

        // Remove from focused tickets if it was focused
        if (adminFocusedTickets.get(authorId) === ticketId) {
          adminFocusedTickets.delete(authorId);
        }

        const embed = new EmbedBuilder()
          .setTitle('🔒 Ticket Closed')
          .setDescription(`Ticket \`${ticketId}\` has been closed successfully.`)
          .setColor(0x7C3AED)
          .addFields(
            { name: '👤 User', value: ticket.username || 'Unknown', inline: true },
            { name: '📋 Category', value: ticket.category, inline: true }
          )
          .setFooter({ text: 'Axiom Support System', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await message.react('✅');
        await message.reply({ embeds: [embed] });

        // Notify user that ticket is closed
        if (ticket.discordUserId) {
          try {
            const user = await client.users.fetch(ticket.discordUserId);
            const userEmbed = new EmbedBuilder()
              .setTitle('🔒 Support Ticket Closed')
              .setDescription('Your support ticket has been resolved and closed. Thank you for contacting Axiom Support!')
              .setColor(0x7C3AED)
              .addFields(
                { name: '📋 Ticket ID', value: `\`${ticketId}\``, inline: true },
                { name: '💡 Need More Help?', value: 'Feel free to create a new ticket anytime at our [Help Center](https://axiomer.up.railway.app/help-center)', inline: false }
              )
              .setFooter({ text: 'Axiom Support • Thank you for your patience', iconURL: client.user?.avatarURL() || undefined })
              .setTimestamp();

            await user.send({ embeds: [userEmbed] });
          } catch (err) {
            console.error('Could not notify user about ticket closing:', err);
          }
        }
        return;
      }

      // Command: .msg <message> - Send message to user in focused ticket
      if (messageContent.startsWith('.msg ')) {
        const focusedTicketId = adminFocusedTickets.get(authorId);

        if (!focusedTicketId) {
          await message.react('❌');
          await message.reply('❌ You don\'t have any focused ticket. Use `.ticketid open` to focus on a ticket first.');
          return;
        }

        const ticket = await storage.getSupportTicketByTicketId(focusedTicketId);
        if (!ticket || !ticket.discordUserId) {
          await message.react('❌');
          await message.reply('❌ Could not find user for this ticket.');
          return;
        }

        const adminMessage = messageContent.substring(5).trim();
        if (!adminMessage) {
          await message.react('❌');
          await message.reply('❌ Please provide a message. Usage: `.msg <your message>`');
          return;
        }

        try {
          const user = await client.users.fetch(ticket.discordUserId);

          const userEmbed = new EmbedBuilder()
            .setTitle('💬 Message from Axiom Support')
            .setDescription(adminMessage)
            .setColor(0x7C3AED)
            .addFields(
              { name: '📋 Ticket ID', value: `\`${focusedTicketId}\``, inline: true },
              { name: '💬 Reply', value: 'Simply send your message here - no commands needed!', inline: false }
            )
            .setFooter({ text: 'Axiom Support Team', iconURL: client.user?.avatarURL() || undefined })
            .setTimestamp();

          await user.send({ embeds: [userEmbed] });
          await message.react('✅');

          console.log(`✅ Admin ${message.author.tag} sent message to user in ticket ${focusedTicketId}`);
        } catch (err) {
          await message.react('❌');
          await message.reply('❌ Failed to send message to user. They may have DMs disabled or left the server.');
          console.error('Failed to send admin message to user:', err);
        }
        return;
      }
    }

    // ============ USER MESSAGES (Auto-detect ticket by Discord ID) ============
    if (!isAdmin) {
      // Find user's open ticket
      const user = await storage.getUserByDiscordId(authorId);

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle('👋 Welcome to Axiom Support')
          .setDescription('You need to create an account first to use our support system.')
          .setColor(0x7C3AED)
          .addFields(
            { name: '🌐 Get Started', value: '[Visit our website](https://axiomer.up.railway.app) to create an account', inline: false },
            { name: '📚 Help Center', value: '[Browse our resources](https://axiomer.up.railway.app/help-center) for instant answers', inline: false }
          )
          .setFooter({ text: 'Axiom Support', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        return;
      }

      // Get user's most recent open ticket
      const userTickets = await storage.getSupportTicketsByUserId(user.id);
      const openTicket = userTickets.find(t => t.status === 'open');

      if (!openTicket) {
        const closedTicket = userTickets.find(t => t.status === 'closed');

        if (closedTicket) {
          // User has a closed ticket
          const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription('Your previous ticket has been closed. You cannot send messages to a closed ticket.')
            .setColor(0x7C3AED)
            .addFields(
              { name: '📋 Closed Ticket', value: `\`${closedTicket.ticketId}\``, inline: true },
              { name: '💡 Need More Help?', value: '[Create a new ticket](https://axiomer.up.railway.app/help-center) on our website', inline: false }
            )
            .setFooter({ text: 'Axiom Support', iconURL: client.user?.avatarURL() || undefined })
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        } else {
          // User has pending ticket (not opened yet by admin)
          const pendingTicket = userTickets.find(t => t.status === 'pending');

          if (pendingTicket) {
            const embed = new EmbedBuilder()
              .setTitle('⏳ Please Wait')
              .setDescription('Your support ticket is in queue. An admin will review it soon and open your ticket.')
              .setColor(0x7C3AED)
              .addFields(
                { name: '📋 Ticket ID', value: `\`${pendingTicket.ticketId}\``, inline: true },
                { name: '⏰ Status', value: 'Waiting for admin response', inline: true },
                { name: '💡 What happens next?', value: 'Once an admin opens your ticket, you\'ll be notified and can send messages freely.', inline: false }
              )
              .setFooter({ text: 'Axiom Support • Thank you for your patience', iconURL: client.user?.avatarURL() || undefined })
              .setTimestamp();

            await message.reply({ embeds: [embed] });
          } else {
            // No ticket at all
            const embed = new EmbedBuilder()
              .setTitle('📬 No Active Ticket')
              .setDescription('You don\'t have any active support tickets.')
              .setColor(0x7C3AED)
              .addFields(
                { name: '💡 Get Help', value: '[Create a support ticket](https://axiomer.up.railway.app/help-center) on our website', inline: false }
              )
              .setFooter({ text: 'Axiom Support', iconURL: client.user?.avatarURL() || undefined })
              .setTimestamp();

            await message.reply({ embeds: [embed] });
          }
        }
        return;
      }

      // User has an open ticket - forward message to admins
      try {
        for (const adminId of ADMIN_DISCORD_IDS) {
          try {
            const admin = await client.users.fetch(adminId);

            const adminEmbed = new EmbedBuilder()
              .setTitle('💬 New Message from User')
              .setDescription(messageContent.length > 2048 ? messageContent.substring(0, 2045) + '...' : messageContent)
              .setColor(0x7C3AED)
              .addFields(
                { name: '🎫 Ticket ID', value: `\`${openTicket.ticketId}\``, inline: true },
                { name: '👤 User', value: `${message.author.tag}`, inline: true },
                { name: '🆔 Discord ID', value: `\`${authorId}\``, inline: true },
                { name: '💬 Quick Reply', value: `Focus on ticket: \`.${openTicket.ticketId} open\`\nThen reply: \`.msg <your message>\``, inline: false }
              )
              .setFooter({ text: `Ticket: ${openTicket.ticketId} • Axiom Support`, iconURL: client.user?.avatarURL() || undefined })
              .setTimestamp();

            await admin.send({ embeds: [adminEmbed] });
          } catch (err) {
            console.error(`Failed to notify admin ${adminId}:`, err);
          }
        }

        // Confirm message received to user
        await message.react('✅');

        const confirmEmbed = new EmbedBuilder()
          .setTitle('✅ Message Sent')
          .setDescription('Your message has been delivered to our support team. We\'ll respond shortly!')
          .setColor(0x7C3AED)
          .addFields(
            { name: '📋 Ticket ID', value: `\`${openTicket.ticketId}\``, inline: true }
          )
          .setFooter({ text: 'Axiom Support', iconURL: client.user?.avatarURL() || undefined })
          .setTimestamp();

        await message.reply({ embeds: [confirmEmbed] });

        console.log(`✅ User ${message.author.tag} sent message for ticket ${openTicket.ticketId}`);
      } catch (err) {
        await message.react('❌');
        console.error('Failed to forward user message to admins:', err);
      }
      return;
    }

  } catch (error) {
    console.error('Error handling DM message:', error);
    await message.react('❌');
  }
});

export async function startDiscordBot() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.error('❌ DISCORD_BOT_TOKEN not found in environment variables');
    return;
  }

  try {
    await client.login(botToken);
  } catch (error) {
    console.error('❌ Failed to login Discord bot:', error);
  }
}

export { client as discordBot };

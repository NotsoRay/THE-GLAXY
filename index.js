require("dotenv").config();
const moment = require("moment");
const config = require("./config");
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  Message,
  EmbedBuilder,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const jobs = require("./jobs.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.GuildMember],
  presence: {
    status: "dnd",
  },
  allowedMentions: { repliedUser: false },
});

const db = new QuickDB();

client.on(
  "messageCreate",
  /** @param {Message} message */ async (message) => {
    const { client } = message;
    if (!message.guild) return;
    if (message.author.bot) return;
    const PRegEx = new RegExp(
      `^(<@!?${client.user.id}>|${escapeRegex(config.prefix)})\\s*`,
    );
    if (!PRegEx.test(message.content)) return;
    const [, match] = message.content.match(PRegEx);
    const args = message.content.slice(match.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === `ping`) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: message.author.username,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(`My ping is **${client.ws.ping}ms**`)
            .setColor("Random")
            .setTimestamp(),
        ],
      });
    } else if (command === "uptime") {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: message.author.username,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              `Uptime: **${moment(client.uptime / 1000).format("DD [days] hh [hours] mm [minutes] ss [seconds]")}**`,
            )
            .setColor("Random")
            .setTimestamp(),
        ],
      });
    } else if (command === "work") {
      const workedAs = jobs[Math.floor(Math.random() * jobs.length)];
      const money = Math.floor(Math.random() * 100);
      await db.add(`${message.guildId}.${message.author.id}_money`, money);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: message.author.username,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(`You worked ${workedAs} and earned ${money}.`)
            .setColor("DarkPurple")
            .setTimestamp(),
        ],
      });
    } else if (command === "balance") {
      const balance_x1 = await db.get(
        `${message.guildId}.${message.author.id}_money`,
      );
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: message.author.username,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(`Your balance is ${balance_x1}`)
            .setColor("DarkPurple")
            .setTimestamp(),
        ],
      });
    }
  },
);

async function deploy(commands) {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, config.client_id),
    {
      body: commands,
    },
  );
  return data;
}

function escapeRegex(str) {
  try {
    return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
  } catch (e) {
    console.log(String(e.stack).bgRed);
  }
}

client.login(process.env.DISCORD_TOKEN);

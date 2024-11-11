const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const config = require('./config/botConfig.json'); // Config do bot e servidor
const { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const { startRoleUpdateInterval } = require('./utils/roleUpdater');


// Importando as configurações do Firebase
const firebaseConfig = require('./config/firebaseConfig'); // Agora importando do arquivo separado

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inicializa o cliente do bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();

// Carregar comandos da pasta ./commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Registrar comandos de aplicação
const rest = new REST({ version: '10' }).setToken(config.token);
(async () => {
  try {
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();

// Importar e iniciar o monitoramento dos canais de voz
const { monitorarCanaisDeVoz, setupVoiceStateUpdate } = require('./voicePoints');

// Evento de pronto
client.on('ready', () => {
  console.log(`Bot logado como ${client.user.tag}`);

  // Inicia o monitoramento de canais de voz e o evento de estado de voz
  monitorarCanaisDeVoz(client, db);  // Passando o client para o monitoramento de canais de voz
  setupVoiceStateUpdate(client, db);  // Passando o client para ouvir o evento de voz
  startRoleUpdateInterval(client, db);
});

// Evento para ouvir interações
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, db); // Passa o Firestore para os comandos
  } catch (error) {
    console.error('Erro ao executar comando:', error);
    await interaction.reply({ content: 'Houve um erro ao executar este comando.', ephemeral: true });
  }
});

// Iniciar o bot
client.login(config.token);
 
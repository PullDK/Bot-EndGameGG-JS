const { SlashCommandBuilder } = require('discord.js');
const { collection, getDocs } = require('firebase/firestore');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurações')
    .setDescription('Mostra todas as configurações do banco de dados.'),

  async execute(interaction, db) {
    try {
      // Busca o canal de notificações
      const notificationsRef = collection(db, 'notifications');
      const notificationChannelSnapshot = await getDocs(notificationsRef);
      const notificationChannelDoc = notificationChannelSnapshot.docs[0];
      const notificationChannelId = notificationChannelDoc ? notificationChannelDoc.id : null;
      const notificationChannel = notificationChannelId ? interaction.guild.channels.cache.get(notificationChannelId) : null;

      // Busca os cargos configurados
      const cargosRef = collection(db, 'cargos');
      const cargosSnapshot = await getDocs(cargosRef);
      const cargosConfigurados = cargosSnapshot.docs.map(doc => {
        const cargo = interaction.guild.roles.cache.get(doc.id);
        return cargo ? `<@&${cargo.id}>` : null;
      }).filter(cargo => cargo !== null);

      // Busca as regras configuradas
      const regrasRef = collection(db, 'regras');
      const regrasSnapshot = await getDocs(regrasRef);
      const regrasConfiguradas = regrasSnapshot.docs.map((doc) => {
        const regraData = doc.data();
        return `ID: ${doc.id}\nTipo: ${regraData.tipo}\nPontos: ${regraData.pontos > 0 ? `+${regraData.pontos}` : regraData.pontos}\nDescrição: ${regraData.descrição || ''}`;
      });

      // Busca os pontos gerais dos usuários com busca individual para evitar o timeout
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const pontosGerais = await Promise.all(
        usersSnapshot.docs.map(async (doc) => {
          const userData = doc.data();
          try {
            const user = await interaction.guild.members.fetch(doc.id); // Busca o membro individualmente
            return `<@${user.id}> - ${userData.points} pontos`;
          } catch {
            return null; // Ignora caso o usuário não seja encontrado ou se houve um erro
          }
        })
      ).then(results => results.filter(entry => entry !== null));

      // Cria a embed com as informações coletadas
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Configurações do banco de dados')
        .addFields(
          { name: 'Canal de notificação:', value: notificationChannel ? `#${notificationChannel.name}` : 'Não configurado', inline: false },
          { name: 'Cargos configurados:', value: cargosConfigurados.length ? cargosConfigurados.join('\n') : 'Nenhum cargo configurado', inline: false },
          { name: 'Pontos gerais:', value: pontosGerais.length ? pontosGerais.join('\n') : 'Nenhum usuário com pontos registrados', inline: false }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      await interaction.reply({ content: 'Erro ao buscar configurações do banco de dados.', ephemeral: true });
    }
  },
};

const { SlashCommandBuilder } = require('discord.js');
const { doc, getDoc, setDoc } = require('firebase/firestore');
const { EmbedBuilder } = require('discord.js');
const { collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const { updateRoles } = require('../utils/roleManager'); // Importa o gerenciador de cargos

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pontos')
    .setDescription('Gerencie os pontos dos usuários.')
    .addStringOption(option =>
      option.setName('ação')
        .setDescription('Ação a ser realizada: adicionar ou remover')
        .setRequired(true)
        .addChoices(
          { name: 'adicionar', value: 'adicionar' },
          { name: 'remover', value: 'remover' }
        )
    )
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para adicionar ou remover pontos')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade de pontos')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('Motivo da alteração de pontos')
        .setRequired(true)
    ),

  async execute(interaction, db) {
    const action = interaction.options.getString('ação');
    const user = interaction.options.getUser('usuario');
    const points = interaction.options.getInteger('quantidade');
    const reason = interaction.options.getString('motivo');
    
    // Encontra o canal de notificação
    const notificationsRef = collection(db, 'notifications');
    const querySnapshot = await getDocs(notificationsRef);
    const notificationChannelDoc = querySnapshot.docs[0];
    const notificationChannel = interaction.guild.channels.cache.get(notificationChannelDoc.id);
    
    if (!notificationChannel) {
      return interaction.reply({ content: 'Canal de notificações não encontrado.', ephemeral: true });
    }

    // Encontra o usuário no banco de dados
    const userRef = doc(db, 'users', user.id);
    const userDoc = await getDoc(userRef);

    let newPoints = points;
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (action === 'adicionar') {
        newPoints += userData.points || 0;
      } else if (action === 'remover') {
        newPoints = (userData.points || 0) - points;
        if (newPoints < 0) newPoints = 0;
      }
    }

    try {
      // Atualiza os pontos no banco de dados
      await setDoc(userRef, { points: newPoints }, { merge: true });

      // Chama a função que atualiza os cargos do usuário
      await updateRoles(interaction, db, newPoints);

      // Envia a embed para o canal de notificações
      const embed = new EmbedBuilder()
        .setColor(action === 'adicionar' ? '#00FF00' : '#FF0000')
        .setTitle(`Notificação de ${action === 'adicionar' ? 'adição' : 'remoção'} de pontos`)
        .addFields(
          { name: 'Usuário', value: `<@${user.id}>`, inline: false },
          { name: '\nPontos', value: `${action === 'adicionar' ? '+' : '-'}${points} Pontos`, inline: false },
          { name: '\nMotivo', value: reason, inline: false },
          { name: '\nQuem fez a alteração', value: `<@${interaction.user.id}>`, inline: false }
        );

      // Envia a embed no canal de notificação
      await notificationChannel.send({ embeds: [embed] });

      // Cria o log no arquivo de texto
      const logMessage = `${new Date().toLocaleString()} - Ação: ${action} - Usuário: ${user.username} - Pontos: ${points} - Motivo: ${reason} - Realizado por: ${interaction.user.username}\n`;
      fs.appendFileSync('./log/logs.txt', logMessage);

      // Responde no próprio canal de interação
      await interaction.reply({ content: `Pontos ${action === 'adicionar' ? 'adicionados' : 'removidos'} para ${user.username}. Total agora é ${newPoints} pontos.`, ephemeral: true });
    } catch (error) {
      console.error('Erro ao modificar pontos:', error);
      await interaction.reply({ content: 'Erro ao modificar pontos.', ephemeral: true });
    }
  },
};

const { SlashCommandBuilder } = require('discord.js');
const { doc, setDoc, deleteDoc, getDocs, collection } = require('firebase/firestore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notificação')
    .setDescription('Gerencie os canais de notificação.')
    .addStringOption(option =>
      option.setName('ação')
        .setDescription('Ação a ser realizada: adicionar ou remover')
        .setRequired(true)
        .addChoices(
          { name: 'adicionar', value: 'adicionar' },
          { name: 'remover', value: 'remover' }
        )
    )
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal de texto para adicionar ou remover das notificações')
        .setRequired(true)
        .addChannelTypes(0) // 0 para garantir que seja um canal de texto
    ),

  async execute(interaction, db) {
    const action = interaction.options.getString('ação');
    const channel = interaction.options.getChannel('canal');

    if (action === 'adicionar') {
      try {
        // Verifica se o canal já está registrado
        const notificationsRef = collection(db, 'notifications');
        const querySnapshot = await getDocs(notificationsRef);
        const existingChannel = querySnapshot.docs.find(doc => doc.id === channel.id);

        if (existingChannel) {
          return interaction.reply({ content: 'Este canal já está registrado para notificações.', ephemeral: true });
        }

        // Adiciona o canal ao banco de dados
        const channelRef = doc(db, 'notifications', channel.id);
        await setDoc(channelRef, { channelId: channel.id, channelName: channel.name });

        await interaction.reply({ content: `Canal ${channel.name} adicionado para notificações.`, ephemeral: true });
      } catch (error) {
        console.error('Erro ao adicionar canal:', error);
        await interaction.reply({ content: 'Houve um erro ao adicionar o canal.', ephemeral: true });
      }
    } else if (action === 'remover') {
      try {
        // Verifica se o canal está registrado
        const notificationsRef = collection(db, 'notifications');
        const querySnapshot = await getDocs(notificationsRef);
        const existingChannel = querySnapshot.docs.find(doc => doc.id === channel.id);

        if (!existingChannel) {
          return interaction.reply({ content: 'Este canal não está registrado para notificações.', ephemeral: true });
        }

        // Remove o canal do banco de dados
        const channelRef = doc(db, 'notifications', channel.id);
        await deleteDoc(channelRef);

        await interaction.reply({ content: `Canal ${channel.name} removido das notificações.`, ephemeral: true });
      } catch (error) {
        console.error('Erro ao remover canal:', error);
        await interaction.reply({ content: 'Houve um erro ao remover o canal.', ephemeral: true });
      }
    }
  },
};

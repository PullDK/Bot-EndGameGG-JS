const { SlashCommandBuilder } = require('discord.js');
const { doc, getDocs, collection } = require('firebase/firestore');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ver')
    .setDescription('Veja informações sobre pontos ou regras.')
    .addStringOption(option =>
      option.setName('ação')
        .setDescription('Ação a ser realizada: pontos ou regras')
        .setRequired(true)
        .addChoices(
          { name: 'pontos', value: 'pontos' },
          { name: 'regras', value: 'regras' }
        )
    ),

  async execute(interaction, db) {
    const action = interaction.options.getString('ação');
    const embed = new EmbedBuilder().setColor('#0099ff');

    if (action === 'pontos') {
      // Exibir pontos de todos os usuários (sem mudanças)
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      let pointsText = '';

      querySnapshot.forEach(doc => {
        const userData = doc.data();
        const points = userData.points || 0;
        const userId = doc.id;
        pointsText += `<@${userId}> - ${points} pontos\n`;
      });

      if (pointsText === '') {
        pointsText = 'Nenhum usuário encontrado com pontos registrados.';
      }

      embed.setTitle('Pontos de todos os usuários')
        .setDescription(pointsText);

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (action === 'regras') {
      // Exibir regras de ganhar e perder pontos em forma de embed
      try {
        // Buscar regras de "ganhar" e "perder" (modifique conforme a estrutura do banco de dados)
        const rulesRef = collection(db, 'regras');
        const querySnapshot = await getDocs(rulesRef);

        let ganhar = '';
        let perder = '';

        querySnapshot.forEach(doc => {
          const ruleData = doc.data();
          if (ruleData.tipo === 'ganhar') {
            ganhar += `- ${ruleData.descricao} (+${ruleData.pontos} pontos)\n`;
          } else if (ruleData.tipo === 'perder') {
            perder += `- ${ruleData.descricao} (-${ruleData.pontos} pontos)\n`;
          }
        });

        // Adiciona as regras de ganhar e perder
        embed.setTitle('Regras para ganhar ou perder pontos:')
          .addFields(
            { name: 'Ganhar:', value: ganhar || 'Nenhuma regra de ganhar pontos encontrada.' },
            { name: 'Perder:', value: perder || 'Nenhuma regra de perder pontos encontrada.' }
          );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao buscar regras:', error);
        await interaction.reply({ content: 'Erro ao buscar regras.', ephemeral: true });
      }
    }
  },
};

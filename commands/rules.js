const { SlashCommandBuilder } = require('discord.js');
const { doc, setDoc, getDoc, deleteDoc, getDocs, collection } = require('firebase/firestore');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Gerencie as regras de pontos do servidor.')
    .addStringOption(option =>
      option.setName('ação')
        .setDescription('Ação a ser realizada: adicionar, remover, editar ou id')
        .setRequired(true)
        .addChoices(
          { name: 'adicionar', value: 'adicionar' },
          { name: 'remover', value: 'remover' },
          { name: 'editar', value: 'editar' },
          { name: 'id', value: 'id' }
        )
    )
    .addStringOption(option =>
      option.setName('id')
        .setDescription('ID da regra (para remover, editar ou ver detalhes da regra)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo da regra: "ganhar" ou "perder"')
        .setRequired(false)
        .addChoices(
          { name: 'ganhar', value: 'ganhar' },
          { name: 'perder', value: 'perder' }
        )
    )
    .addStringOption(option =>
      option.setName('pontos')
        .setDescription('Quantidade de pontos para a regra (só para adicionar ou editar)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('descrição')
        .setDescription('Descrição da regra (só para adicionar ou editar)')
        .setRequired(false)
    ),

  async execute(interaction, db) {
    const action = interaction.options.getString('ação');
    const ruleId = interaction.options.getString('id');
    const points = interaction.options.getString('pontos');
    const description = interaction.options.getString('descrição');
    const type = interaction.options.getString('tipo'); // Tipo: "ganhar" ou "perder"

    const rulesRef = collection(db, 'regras');
    const embed = new EmbedBuilder().setColor('#0099ff');

    if (action === 'adicionar') {
      // Adicionar nova regra
      if (!points || !description || !type) {
        return interaction.reply({ content: 'Você precisa fornecer pontos, descrição e tipo (ganhar/perder) para adicionar uma regra.', ephemeral: true });
      }

      try {
        // Encontrar o maior ID existente na coleção de regras
        const querySnapshot = await getDocs(rulesRef);
        let maxId = 0;

        querySnapshot.forEach(doc => {
          const ruleData = doc.data();
          const ruleId = parseInt(ruleData.id);
          if (ruleId > maxId) {
            maxId = ruleId;
          }
        });

        const newRuleId = maxId + 1; // ID sequencial (1, 2, 3, ...)

        // Criando a nova regra
        const newRuleRef = doc(db, 'regras', newRuleId.toString());
        await setDoc(newRuleRef, {
          id: newRuleId.toString(),
          tipo: type, // "ganhar" ou "perder"
          pontos: points,
          descricao: description,
        });

        embed.setTitle('Regra adicionada com sucesso')
          .setDescription(`**ID da regra**: ${newRuleId}\n**Tipo**: ${type}\n**Pontos**: ${points}\n**Descrição**: ${description}`);

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao adicionar regra:', error);
        await interaction.reply({ content: 'Erro ao adicionar regra.', ephemeral: true });
      }
    } else if (action === 'remover') {
      // Remover regra
      if (!ruleId) {
        return interaction.reply({ content: 'Você precisa fornecer o ID da regra para remover.', ephemeral: true });
      }

      try {
        const ruleRef = doc(db, 'regras', ruleId);
        const ruleDoc = await getDoc(ruleRef);
        if (ruleDoc.exists()) {
          await deleteDoc(ruleRef);

          embed.setTitle('Regra removida com sucesso')
            .setDescription(`A regra com ID **${ruleId}** foi removida com sucesso.`);
        } else {
          embed.setTitle('Erro')
            .setDescription(`Não foi encontrada nenhuma regra com o ID **${ruleId}**.`);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao remover regra:', error);
        await interaction.reply({ content: 'Erro ao remover regra.', ephemeral: true });
      }
    } else if (action === 'editar') {
      // Editar regra
      if (!ruleId) {
        return interaction.reply({ content: 'Você precisa fornecer o ID da regra para editar.', ephemeral: true });
      }

      try {
        const ruleRef = doc(db, 'regras', ruleId);
        const ruleDoc = await getDoc(ruleRef);
        if (ruleDoc.exists()) {
          const updateData = {};
          if (points) updateData.pontos = points;
          if (description) updateData.descricao = description;
          if (type) updateData.tipo = type;

          await setDoc(ruleRef, updateData, { merge: true });

          embed.setTitle('Regra editada com sucesso')
            .setDescription(`A regra com ID **${ruleId}** foi atualizada.\n${points ? `**Pontos**: ${points}\n` : ''}${description ? `**Descrição**: ${description}\n` : ''}${type ? `**Tipo**: ${type}\n` : ''}`);
        } else {
          embed.setTitle('Erro')
            .setDescription(`Não foi encontrada nenhuma regra com o ID **${ruleId}**.`);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao editar regra:', error);
        await interaction.reply({ content: 'Erro ao editar regra.', ephemeral: true });
      }
    } else if (action === 'id') {
      // Buscar todas as regras
      try {
        const querySnapshot = await getDocs(rulesRef);
        if (querySnapshot.empty) {
          return interaction.reply({ content: 'Não há regras cadastradas.', ephemeral: true });
        }

        embed.setTitle('Regras Cadastradas:');

        querySnapshot.forEach(doc => {
          const ruleData = doc.data();
          embed.addFields({
            name: `ID: ${ruleData.id} - Tipo: ${ruleData.tipo}`,
            value: `**Pontos**: ${ruleData.pontos}\n**Descrição**: ${ruleData.descricao}\n`,
            inline: false,
          });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao buscar regras:', error);
        await interaction.reply({ content: 'Erro ao buscar regras.', ephemeral: true });
      }
    }
  },
};

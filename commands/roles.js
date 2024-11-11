const { SlashCommandBuilder } = require('discord.js');
const { doc, getDoc, setDoc, deleteDoc } = require('firebase/firestore');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cargos')
    .setDescription('Gerencie cargos e suas faixas de pontos.')
    .addStringOption(option =>
      option.setName('ação')
        .setDescription('Ação a ser realizada: adicionar, editar ou remover')
        .setRequired(true)
        .addChoices(
          { name: 'adicionar', value: 'adicionar' },
          { name: 'editar', value: 'editar' },
          { name: 'remover', value: 'remover' }
        )
    )
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('O cargo a ser gerido (apenas mencionar o cargo)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('min')
        .setDescription('Quantidade mínima de pontos para o cargo')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('max')
        .setDescription('Quantidade máxima de pontos para o cargo')
        .setRequired(false)
    ),

  async execute(interaction, db) {
    const action = interaction.options.getString('ação');
    const cargo = interaction.options.getRole('cargo'); // Alterado para pegar o cargo, não o usuário
    const minPoints = interaction.options.getInteger('min');
    const maxPoints = interaction.options.getInteger('max');

    const embed = new EmbedBuilder().setColor('#0099ff');
    const cargoRef = doc(db, 'cargos', cargo.id);

    if (action === 'adicionar') {
      if (minPoints === null || maxPoints === null) {
        return await interaction.reply({ content: 'Você precisa fornecer tanto a quantidade mínima quanto a máxima de pontos.', ephemeral: true });
      }

      // Adiciona o cargo com os pontos mínimos e máximos
      try {
        await setDoc(cargoRef, { minPoints, maxPoints }, { merge: true });
        embed.setTitle(`Cargo adicionado: ${cargo.name}`)
          .setDescription(`Cargo: ${cargo.name}\nPontos: ${minPoints} - ${maxPoints}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao adicionar cargo:', error);
        await interaction.reply({ content: 'Erro ao adicionar o cargo.', ephemeral: true });
      }

    } else if (action === 'editar') {
      if (minPoints === null && maxPoints === null) {
        return await interaction.reply({ content: 'Você precisa fornecer pelo menos um valor mínimo ou máximo para editar.', ephemeral: true });
      }

      // Edita o cargo com novos valores de pontos
      try {
        const cargoDoc = await getDoc(cargoRef);
        if (!cargoDoc.exists()) {
          return await interaction.reply({ content: 'Cargo não encontrado.', ephemeral: true });
        }

        const currentData = cargoDoc.data();
        const updatedMin = minPoints !== null ? minPoints : currentData.minPoints;
        const updatedMax = maxPoints !== null ? maxPoints : currentData.maxPoints;

        await setDoc(cargoRef, { minPoints: updatedMin, maxPoints: updatedMax }, { merge: true });
        embed.setTitle(`Cargo editado: ${cargo.name}`)
          .setDescription(`Cargo: ${cargo.name}\nPontos: ${updatedMin} - ${updatedMax}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao editar cargo:', error);
        await interaction.reply({ content: 'Erro ao editar o cargo.', ephemeral: true });
      }

    } else if (action === 'remover') {
      // Remove o cargo
      try {
        await deleteDoc(cargoRef);
        embed.setTitle(`Cargo removido: ${cargo.name}`)
          .setDescription(`O cargo de ${cargo.name} foi removido com sucesso.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao remover cargo:', error);
        await interaction.reply({ content: 'Erro ao remover o cargo.', ephemeral: true });
      }
    }
  },
};

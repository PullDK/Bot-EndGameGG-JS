const { SlashCommandBuilder } = require('discord.js');
const { doc, setDoc, getDoc } = require('firebase/firestore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('call')
    .setDescription('Configura as ações do sistema de monitoração de canais de voz.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ativar')
        .setDescription('Ativa o sistema de monitoração de canais de voz.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('desativar')
        .setDescription('Desativa o sistema de monitoração de canais de voz.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('configurar')
        .setDescription('Configura parâmetros de monitoração.')
        .addIntegerOption(option =>
          option
            .setName('tempo')
            .setDescription('Tempo em segundos para o intervalo de monitoração')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('pontos')
            .setDescription('Quantidade de pontos associados ao intervalo')
            .setRequired(false)
        )
    ),

  async execute(interaction, db) {
    const subcommand = interaction.options.getSubcommand();
    const tempo = interaction.options.getInteger('tempo');
    const pontos = interaction.options.getInteger('pontos');

    const settingsRef = doc(db, 'config', 'geral');

    try {
      // Inicializar os documentos de configuração caso não existam
      const settingsDoc = await getDoc(settingsRef);
      if (!settingsDoc.exists()) {
        console.log('Configurações não encontradas. Criando documento com valores padrão.');
        await setDoc(settingsRef, {
          intervalo: 10, // 10 segundos padrão
          pontos: 1,     // 1 ponto padrão
          monitoramentoAtivo: false, // Monitoramento inicialmente desativado
        });
      }

      // Ações de acordo com o subcomando
      if (subcommand === 'ativar') {
        console.log('Ativando monitoração.');
        await setDoc(settingsRef, { monitoramentoAtivo: true }, { merge: true });
        await interaction.reply({ content: 'Sistema de monitoração de canais de voz ativado!', ephemeral: true });

      } else if (subcommand === 'desativar') {
        console.log('Desativando monitoração.');
        await setDoc(settingsRef, { monitoramentoAtivo: false }, { merge: true });
        await interaction.reply({ content: 'Sistema de monitoração de canais de voz desativado.', ephemeral: true });

      } else if (subcommand === 'configurar') {
        let response = 'Configurações atualizadas:\n';

        if (tempo !== null) {
          const intervalo = tempo * 1000; // Converte para milissegundos
          console.log(`Atualizando tempo para ${intervalo}ms.`);
          await setDoc(settingsRef, { intervalo }, { merge: true });
          response += `- Intervalo de tempo atualizado para ${tempo} segundos.\n`;
        }

        if (pontos !== null) {
          console.log(`Atualizando pontos para ${pontos}.`);
          await setDoc(settingsRef, { pontos }, { merge: true });
          response += `- Quantidade de pontos atualizada para ${pontos}.\n`;
        }

        await interaction.reply({ content: response.trim(), ephemeral: true });
      }

    } catch (error) {
      console.error('Erro ao processar comando /call:', error);
      await interaction.reply({ content: 'Houve um erro ao processar seu comando. Tente novamente.', ephemeral: true });
    }
  },
};

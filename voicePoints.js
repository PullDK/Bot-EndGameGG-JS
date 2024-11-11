// monitoramento.js
const { doc, getDoc, setDoc, collection, getDocs } = require('firebase/firestore');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

// Armazena os tempos de entrada de cada usuário
const temposDeEntrada = {};

function formatarTempo(tempoMs) {
  const horas = Math.floor(tempoMs / (1000 * 60 * 60));
  const minutos = Math.floor((tempoMs % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((tempoMs % (1000 * 60)) / 1000);
  return `${horas}h ${minutos}m ${segundos}s`;
}

async function buscarConfiguracoes(db) {
  try {
    const configRef = doc(db, 'config', 'geral'); // Documento com todas as configurações
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      const data = configDoc.data();
      return {
        intervalo: data.intervalo || 10000, // Pega o valor de 'intervalo', ou retorna 10000ms por padrão
        pontos: data.pontos || 1,           // Pega o valor de 'pontos', ou retorna 1 ponto por padrão
        monitoramentoAtivo: data.monitoramentoAtivo || false // Pega o valor de 'monitoramentoAtivo'
      };
    } else {
      console.log('Configurações não encontradas no banco de dados. Criando documento com valores padrão.');
      await setDoc(configRef, {
        intervalo: 10000,          // Valor padrão de 10 segundos
        pontos: 1,                 // Valor padrão de 1 ponto
        monitoramentoAtivo: false  // Monitoramento inicialmente desativado
      });
      return { intervalo: 10000, pontos: 1, monitoramentoAtivo: false }; // Valores padrão
    }
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return { intervalo: 10000, pontos: 1, monitoramentoAtivo: false }; // Valores padrão
  }
}

async function adicionarPonto(userId, db, member, config) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    let pontosAtuais = 0;
    if (userDoc.exists()) {
      const userData = userDoc.data();
      pontosAtuais = userData.points || 0;
    } else {
      console.log(`Usuário ${userId} não encontrado. Criando documento com pontos iniciais.`);
      await setDoc(userRef, { points: 0 }, { merge: true }); // Criação do documento com 0 pontos
    }

    // Só adiciona pontos se o monitoramento estiver ativado
    if (config.monitoramentoAtivo) {
      // Atualiza o banco de dados com os pontos configurados
      await setDoc(userRef, { points: pontosAtuais + config.pontos }, { merge: true });

      // Envia notificação, se o monitoramento estiver ativo
      const notificationChannel = await buscarCanalDeNotificacoes(db, member.guild);
      if (!notificationChannel) return;

      const tempoPermanencia = Date.now() - temposDeEntrada[userId].entrada;
      const tempoFormatado = formatarTempo(tempoPermanencia);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Notificação de ganho de pontos')
        .addFields(
          { name: 'Usuário', value: `<@${userId}>`, inline: false },
          { name: 'Pontos', value: `+${config.pontos} Ponto(s)`, inline: false },
          { name: 'Motivo', value: `Ficou ${tempoFormatado} no canal de voz`, inline: false },
          { name: 'Quem fez a alteração', value: 'Sistema', inline: false }
        );

      await notificationChannel.send({ embeds: [embed] });

      // Log no arquivo
      const logMessage = `${new Date().toLocaleString()} - Usuário: ${member.user.username}#${member.user.discriminator} - Pontos: +${config.pontos} - Motivo: Ficou ${tempoFormatado} no canal de voz - Realizado por: Sistema\n`;
      fs.appendFileSync('./log/logs.txt', logMessage);
    } else {
      console.log(`Monitoramento desativado. Nenhum ponto foi adicionado para <@${userId}>.`);
    }
  } catch (error) {
    console.error('Erro ao adicionar pontos ou enviar notificação:', error);
  }
}

async function buscarCanalDeNotificacoes(db, guild) {
  const notificationsRef = collection(db, 'notifications');
  const notificationChannelSnapshot = await getDocs(notificationsRef);
  if (notificationChannelSnapshot.empty) {
    console.log('Canal de notificações não encontrado no banco de dados.');
    return null;
  }

  const notificationChannelDoc = notificationChannelSnapshot.docs[0];
  const notificationChannel = guild.channels.cache.get(notificationChannelDoc.id);
  if (!notificationChannel) {
    console.log('Canal de notificações não encontrado no servidor.');
    return null;
  }

  return notificationChannel;
}

async function monitorarCanaisDeVoz(client, db) {
  setInterval(async () => {
    const config = await buscarConfiguracoes(db);

    if (!config.monitoramentoAtivo) {
      return;
    }

    Object.keys(temposDeEntrada).forEach(async (userId) => {
      const data = temposDeEntrada[userId];
      const tempoDecorrido = Date.now() - data.entrada;

      if (tempoDecorrido >= config.intervalo) {
        const member = await client.guilds.cache.get(data.guildId)?.members.fetch(userId);
        if (member && member.voice.channel) {
          await adicionarPonto(userId, db, member, config);
        }
        delete temposDeEntrada[userId];
      }
    });
  }, 1000);
}

async function setupVoiceStateUpdate(client, db) {
  const config = await buscarConfiguracoes(db);

  client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.member.user.id;
    const guildId = newState.guild.id;

    if (!oldState.channel && newState.channel) {
      temposDeEntrada[userId] = { entrada: Date.now(), guildId };
      console.log(`${newState.member.user.tag} entrou no canal de voz: ${newState.channel.name}`);
    }

    if (oldState.channel && !newState.channel) {
      if (temposDeEntrada[userId]) {
        const tempoDecorrido = Date.now() - temposDeEntrada[userId].entrada;
        if (tempoDecorrido < config.intervalo) {
          delete temposDeEntrada[userId];
          console.log(`${newState.member.user.tag} saiu da call antes de completar o intervalo.`);
        }
      }
    }
  });
}

module.exports = { monitorarCanaisDeVoz, setupVoiceStateUpdate };

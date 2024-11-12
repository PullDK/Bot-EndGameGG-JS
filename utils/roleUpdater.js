const { getDocs, collection } = require('firebase/firestore');
const { updateRoles } = require('./roleManager'); // Ajuste o caminho para onde está a função updateRoles

// Função para atualizar os cargos de todos os membros que estão registrados no banco de dados
async function checkAndUpdateRoles(client, db) {
  const guild = client.guilds.cache.get('1301590992985784330'); // Substitua pelo ID do seu servidor

  if (!guild) {
    console.error('Erro: Servidor não encontrado.');
    return;
  }

  try {
    // Busca todos os documentos de usuários registrados no Firestore
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // Itera sobre cada documento de usuário no Firestore
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userPoints = userData.points || 0;

      // Busca o membro correspondente individualmente
      let member;
      try {
        member = await guild.members.fetch(userId);
      } catch (error) {
        console.log(`Usuário com ID ${userId} não está presente no servidor ou ocorreu um erro ao buscar:`, error);
        continue;
      }

      // Se o membro foi encontrado, chama a função de atualização de cargos com os pontos do usuário
      if (member) {
        await updateRoles({ guild, member }, db, userPoints);
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar cargos dos membros:', error);
  }
}

// Função para inicializar o intervalo de atualização de cargos
function startRoleUpdateInterval(client, db) {
  setInterval(() => {
    checkAndUpdateRoles(client, db);
  }, 10000); // A cada 10 segundos para teste; ajuste conforme necessário para produção
}

module.exports = { startRoleUpdateInterval };

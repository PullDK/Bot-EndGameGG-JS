const { getDocs, collection } = require('firebase/firestore');
const { updateRoles } = require('./roleManager'); // Ajuste o caminho para onde está a função updateRoles

// Função para atualizar os cargos de todos os membros que estão registrados no banco de dados
async function checkAndUpdateRoles(client, db) {
  const guild = client.guilds.cache.get('1301590992985784330'); // Substitua pelo ID do seu servidor

  if (!guild) {
    console.error('Erro: Servidor não encontrado.');
    return;
  }

  // Carrega todos os membros do servidor no cache
  await guild.members.fetch();

  // Busca todos os documentos de usuários registrados no Firestore
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  // Itera sobre cada documento de usuário no Firestore
  usersSnapshot.forEach(async (userDoc) => {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userPoints = userData.points || 0;

    // Busca o membro correspondente no cache atualizado do servidor
    const member = guild.members.cache.get(userId);

    // Verifica se o membro está no servidor
    if (member) {
      // Chama a função de atualização de cargos com os pontos do usuário
      await updateRoles({ guild, member }, db, userPoints);
    } else {
      console.log(`Usuário com ID ${userId} não está presente no servidor.`);
    }
  });
}

// Função para inicializar o intervalo de atualização de cargos
function startRoleUpdateInterval(client, db) {
  setInterval(() => {
    checkAndUpdateRoles(client, db);
  }, 10000); // A cada 6 horas
}

module.exports = { startRoleUpdateInterval };

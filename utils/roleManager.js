const { collection, getDocs } = require('firebase/firestore');

async function updateRoles(interaction, db, newPoints) {
  // Verificação para garantir que interaction e member estão presentes
  if (!interaction || !interaction.guild || !interaction.member) {
    console.error('Erro: interaction ou member não encontrado.');
    return;
  }

  const cargosRef = collection(db, 'cargos');
  const cargosSnapshot = await getDocs(cargosRef);
  let userRolesToUpdate = [];

  cargosSnapshot.forEach(doc => {
    const cargoData = doc.data();
    const cargo = interaction.guild.roles.cache.get(doc.id);

    if (!cargo) return;

    // Verifica se o usuário deve ganhar ou perder o cargo
    if (newPoints >= cargoData.minPoints && newPoints <= cargoData.maxPoints) {
      if (!interaction.member.roles.cache.has(cargo.id)) {
        userRolesToUpdate.push({ action: 'add', cargo });
      }
    } else {
      if (interaction.member.roles.cache.has(cargo.id)) {
        userRolesToUpdate.push({ action: 'remove', cargo });
      }
    }
  });

  // Atualiza os cargos do usuário
  for (let { action, cargo } of userRolesToUpdate) {
    if (action === 'add') {
      try {
        await interaction.member.roles.add(cargo);
        console.log(`Cargo adicionado: ${cargo.name}`);
      } catch (error) {
        console.error('Erro ao adicionar cargo:', error);
      }
    } else if (action === 'remove') {
      try {
        await interaction.member.roles.remove(cargo);
        console.log(`Cargo removido: ${cargo.name}`);
      } catch (error) {
        console.error('Erro ao remover cargo:', error);
      }
    }
  }
}

module.exports = { updateRoles };

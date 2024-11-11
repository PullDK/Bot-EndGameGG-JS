
# Discord Bot - Sistema de Monitoração e Gerenciamento

Este projeto é um bot para Discord que integra várias funcionalidades de gerenciamento e monitoração em um servidor, utilizando o Firebase como banco de dados. O bot oferece comandos para gerenciar cargos, pontos de usuários, configurações de notificações e muito mais.

## Funcionalidades

O bot possui os seguintes comandos principais:

### `/cargos`

Gerencia os cargos e suas faixas de pontos.

- **Adicionar Cargo**: Adiciona um cargo ao banco de dados com a quantidade mínima e máxima de pontos necessários.
- **Editar Cargo**: Altera a quantidade mínima e máxima de pontos de um cargo.
- **Remover Cargo**: Remove um cargo do banco de dados.

### `/pontos`

Gerencia os pontos dos usuários.

- **Adicionar Pontos**: Adiciona pontos a um usuário específico.
- **Remover Pontos**: Remove pontos de um usuário.
- **Motivo**: Cada alteração de pontos requer um motivo que será registrado.

### `/notificação`

Gerencia os canais de notificação para o sistema.

- **Adicionar Canal**: Adiciona um canal de texto para notificações de ações realizadas no bot.
- **Remover Canal**: Remove um canal de texto das notificações.

### `/configurações`

Mostra todas as configurações atuais do banco de dados, incluindo canais de notificação, cargos configurados, regras, e pontos gerais dos usuários.

### `/call`

Configura o sistema de monitoração de canais de voz no Discord.

- **Ativar**: Ativa o sistema de monitoração de canais de voz.
- **Desativar**: Desativa o sistema de monitoração de canais de voz.
- **Configurar**: Configura os parâmetros do sistema de monitoração, como o tempo de intervalo de monitoração e os pontos associados ao intervalo.

## Requisitos

Antes de rodar o bot, certifique-se de ter os seguintes requisitos:

- Node.js
- NPM ou Yarn
- Firebase Account & Project
- Discord Developer Account & Bot Token

## Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/PullDK/Bot-EndGameGG-JS
cd Bot-EndGameGG-JS
```

### 2. Instale as Dependências

```bash
npm install discord.js firebase
```

### 3. Configuração do Firebase

- Crie um projeto no Firebase.
- Gere e baixe o arquivo `google-services.json` ou a chave de configuração para o Firebase.
- Coloque a chave de configuração no seu projeto (em um arquivo seguro e não versionado no Git).

### 4. Configuração do Bot no Discord

- Crie um aplicativo no Discord Developer Portal e registre um bot.
- Copie o token do bot.
- Adicione o bot ao seu servidor Discord com permissões adequadas.

### 5. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do seu projeto com as seguintes variáveis:

```bash
DISCORD_TOKEN=seu-token-do-bot
FIREBASE_CONFIG=suas-configuracoes-do-firebase
```

### 6. Execute o Bot

```bash
node index.js
```

## Como Funciona

- O bot utiliza comandos de barra (slash commands) para interagir com os administradores do servidor.
- As informações do servidor, como cargos, pontos dos usuários, canais de notificação e configurações de monitoramento, são armazenadas no Firebase Firestore.
- As interações com o bot são registradas, e as notificações são enviadas para o canal de notificações configurado no Firebase.

## Logs

O bot mantém um arquivo de log (`logs.txt`) onde todas as ações de alteração de pontos são registradas com informações como usuário, motivo e a quantidade de pontos.

## Contribuindo

Contribuições são bem-vindas! Se você deseja melhorar o bot, faça um fork deste repositório, crie uma branch, e submeta um pull request.

## Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo [LICENSE](LICENSE) para mais detalhes.



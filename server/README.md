# API — Canal de Denúncia Só Aço

Backend Express + **SQL Server Express** (sem Docker).

## Onde está o banco (arquivos)

Na pasta `data/` do projeto (igual ao `dev.db` do outro sistema, mas em SQL Server):

| Arquivo | Função |
|---|---|
| `data/CanalDenuncia.mdf` | Dados (tabelas, denúncias) |
| `data/CanalDenuncia_log.ldf` | Log de transações |
| `data/uploads/` | Anexos enviados |

Esses arquivos **não** vão para o GitHub (`.gitignore`).

## Pré-requisitos

- Node.js 20+
- SQL Server Express instalado e rodando (`localhost\SQLEXPRESS`)

## Comandos

```bash
cd server
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

API: `http://localhost:3001`

## Conectar no SSMS / Azure Data Studio

- Servidor: `localhost\SQLEXPRESS`
- Autenticação: Windows
- Banco: `CanalDenuncia`

## Produção (VPS)

1. Instalar SQL Server no VPS  
2. Clonar o repositório  
3. Criar pasta `data/` e dar permissão ao serviço SQL  
4. `npm run db:migrate`  
5. Configurar `.env` e subir a API  

Não é necessário Docker.

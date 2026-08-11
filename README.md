# Canal de Denúncias Anônimas — Só Aço

Landing pública + formulário multi-etapas + painel interno (RH / Diretoria) em app separado.

## Stack

- React + Vite + TypeScript (público e admin)
- Tailwind CSS v4
- Express + SQL Server (API)
- JWT para o painel interno

## URLs locais

| App | URL |
|-----|-----|
| Público | http://localhost:5173 |
| Painel admin | http://localhost:5174 |
| API | http://localhost:3001 |

## Como rodar

```bash
npm install
npm install --prefix server
npm install --prefix admin

npm run db:migrate
npm run db:seed-admin

# Terminais separados:
npm run dev:api
npm run dev
npm run dev:admin
```

### Credenciais de teste (seed)

| Usuário | Senha |
|---------|-------|
| `admin` | `admin123` |

## Variáveis de ambiente

- Raiz / `admin/`: `VITE_API_URL=http://localhost:3001`
- `server/.env`: `CORS_ORIGIN` com as duas origens, `JWT_SECRET`, SQL Server

## O que o painel faz (MVP)

- Login com e-mail/senha
- Lista e busca de denúncias
- Detalhe completo (relato, envolvidos, anexos)
- Alteração de status + histórico interno
- Download de anexos autenticado

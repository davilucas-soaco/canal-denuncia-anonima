# Migração para VPS Windows — Canal de Denúncia Anônima (Só Aço)

**Documento para a IA / operador da VPS.** Siga este guia na ordem. Não invente stack diferente (não use Postgres, Docker obrigatório, nem hospede a API na Vercel).

---

## 1. Objetivo e arquitetura

| Peça | Onde roda | Função |
|------|-----------|--------|
| Site público (denunciantes) | **Vercel** (`*.vercel.app`) | Formulário + consulta de protocolo |
| Painel admin (RH / Diretoria) | **Vercel** (outro projeto `*.vercel.app`) | Login, lista, status, anexos |
| API Express | **Esta VPS Windows** | Única fonte de verdade HTTP |
| SQL Server Express | **Esta VPS Windows** | Banco `CanalDenuncia` |
| Anexos | **Esta VPS** em `data/uploads/` | Arquivos enviados |

```
Denunciante (Vercel) ──┐
                       ├──► API nesta VPS (porta 3001) ──► SQL Server + data/uploads
Admin (Vercel) ────────┘
```

**Escopo desta VPS:** clonar o repo, configurar SQL + `.env`, migrar banco, seed de admin, subir a API de forma persistente, abrir firewall, validar `/api/health`.

**Fora do escopo desta VPS (feito depois no PC / Vercel):** criar os 2 projetos Vercel apontando para este repositório. Depois disso, atualizar `CORS_ORIGIN`, `PUBLIC_BASE_URL` e `ADMIN_BASE_URL` com as URLs reais da Vercel.

---

## 2. Repositório GitHub

- **URL:** https://github.com/davilucas-soaco/canal-denuncia-anonima
- **Visibilidade:** privado
- **Branch de produção:** `main`
- Conta GitHub: `davilucas-soaco`

Clonar (ajuste o caminho se necessário):

```powershell
cd C:\apps
git clone https://github.com/davilucas-soaco/canal-denuncia-anonima.git
cd canal-denuncia-anonima
```

Se o repo for privado, autentique o Git (PAT ou `gh auth login`) antes do clone.

Atualizar depois:

```powershell
git pull origin main
```

**Nunca** commitar `.env`, pasta `data/`, `*.mdf`, `*.ldf` ou uploads.

---

## 3. Pré-requisitos na VPS Windows

Instalar / validar:

1. **Node.js 20 LTS** ou superior (`node -v`, `npm -v`)
2. **Git**
3. **SQL Server Express** instância `localhost\SQLEXPRESS` (serviço em execução)
4. **ODBC Driver 18 for SQL Server** (obrigatório — a API usa `msnodesqlv8` + Driver 18)
5. Ferramentas úteis: SSMS ou Azure Data Studio (opcional, para conferir o banco)

Serviço SQL deve estar **Running**. Em PowerShell (admin):

```powershell
Get-Service | Where-Object { $_.Name -like '*SQL*' }
```

---

## 4. Permissões da pasta `data/`

O migrate cria o banco com arquivos em `data/` do projeto:

- `data/CanalDenuncia.mdf`
- `data/CanalDenuncia_log.ldf`
- `data/uploads/` (anexos)

A conta do serviço SQL Server precisa de **permissão de escrita** nessa pasta.

```powershell
cd C:\apps\canal-denuncia-anonima
New-Item -ItemType Directory -Force -Path .\data\uploads
```

Conceda controle total (ou Modify) na pasta `data` para a conta do serviço SQL (ex.: `NT SERVICE\MSSQL$SQLEXPRESS` — confirme o nome em Services).

---

## 5. Dependências Node

Na raiz do projeto:

```powershell
npm install
npm install --prefix server
```

(Fronts na Vercel: na VPS **não é obrigatório** `npm install --prefix admin` nem build dos Vite, a menos que queiram testar localmente.)

---

## 6. Arquivo `server/.env` (produção)

```powershell
cd C:\apps\canal-denuncia-anonima\server
Copy-Item .env.example .env
notepad .env
```

Preencher assim (ajuste IP/URLs quando tiver as da Vercel):

```env
PORT=3001

# Enquanto os fronts Vercel não existirem, pode deixar localhost.
# DEPOIS dos deploys Vercel, SUBSTITUIR pelas duas URLs https://....vercel.app
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
CORS_ALLOW_LOCALHOST=false

JWT_SECRET=<gerar-segredo-forte>
JWT_EXPIRES_IN=12h

ADMIN_SEED_PASSWORD=<senha-forte-inicial-dos-admins>

MSSQL_SERVER=localhost\SQLEXPRESS
MSSQL_DATABASE=CanalDenuncia
MSSQL_TRUSTED_CONNECTION=true

DATA_DIR=../data
UPLOAD_DIR=../data/uploads

EMAIL_SETTINGS_ENCRYPTION_KEY=<gerar-hex-32-bytes>
NOTIFICACOES_ENVIO_HABILITADO=false

# Atualizar depois com as URLs Vercel
ADMIN_BASE_URL=http://localhost:5174
PUBLIC_BASE_URL=http://localhost:5173
```

Gerar segredos na VPS:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o primeiro para `JWT_SECRET` e o segundo para `EMAIL_SETTINGS_ENCRYPTION_KEY`.

### Autenticação SQL

- Padrão do projeto: **Windows Auth** (`MSSQL_TRUSTED_CONNECTION=true`).
- A API deve rodar com um usuário Windows que tenha acesso ao SQL Express (idealmente o mesmo usuário do serviço / conta com login no SQL).
- Se precisar de SQL Auth: `MSSQL_TRUSTED_CONNECTION=false`, `MSSQL_USER=...`, `MSSQL_PASSWORD=...` (e login criado no SQL). O driver continua `msnodesqlv8`.

---

## 7. Migrar banco e criar usuários admin

Na **raiz** do projeto:

```powershell
cd C:\apps\canal-denuncia-anonima
npm run db:migrate
npm run db:seed-admin
```

Esperado:

- Banco `CanalDenuncia` criado (se ainda não existir)
- Scripts em `server/sql/*.sql` aplicados
- Usuários seed (ver saída do seed; senha = `ADMIN_SEED_PASSWORD`)

Conferir no SSMS: servidor `localhost\SQLEXPRESS`, banco `CanalDenuncia`.

---

## 8. Subir a API e validar

Teste manual:

```powershell
cd C:\apps\canal-denuncia-anonima\server
npm start
```

Health check (outro terminal ou navegador):

```text
http://127.0.0.1:3001/api/health
```

Resposta esperada:

```json
{ "ok": true, "database": "up" }
```

Se `database: "down"`, revisar SQL, ODBC 18, permissões de `data/` e `.env`.

### Expor na rede (para Vercel / outros PCs)

1. Firewall Windows: liberar **TCP 3001** de entrada.
2. Anotar o **IP público** (ou interno, se Vercel não for o caso) da VPS.
3. Testar de fora: `http://<IP-DA-VPS>:3001/api/health`

**Importante:** sem domínio/HTTPS, a URL da API será `http://<IP>:3001`. Os projetos Vercel usarão:

```env
VITE_API_URL=http://<IP-DA-VPS>:3001
```

(Browsers podem alertar mixed content se o front for HTTPS e a API HTTP — se isso bloquear, será preciso HTTPS na API depois. Para o primeiro go-live interno, documente o IP e teste.)

---

## 9. Deixar a API sempre ligada (produção)

Não depender de janela de terminal aberta. Opções:

### Opção recomendada: PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
cd C:\apps\canal-denuncia-anonima\server
pm2 start src/index.js --name canal-denuncia-api
pm2 save
pm2-startup install
```

(Comandos exatos do `pm2-windows-startup` podem variar; garantir que o processo sobreviva a logoff/reboot.)

### Alternativa: NSSM (serviço Windows)

Registrar `node.exe` com argumentos `C:\apps\canal-denuncia-anonima\server\src\index.js` e `AppDirectory` = pasta `server`, para carregar o `.env`.

---

## 10. Depois que a Vercel existir (atualizar esta VPS)

Quando existirem as duas URLs `*.vercel.app`:

1. Editar `server/.env`:

```env
CORS_ORIGIN=https://<projeto-publico>.vercel.app,https://<projeto-admin>.vercel.app
CORS_ALLOW_LOCALHOST=false
PUBLIC_BASE_URL=https://<projeto-publico>.vercel.app
ADMIN_BASE_URL=https://<projeto-admin>.vercel.app
```

2. Reiniciar a API (`pm2 restart canal-denuncia-api` ou reiniciar o serviço).

3. Nos **dois** projetos Vercel, variável de ambiente de **build**:

```env
VITE_API_URL=http://<IP-DA-VPS>:3001
```

4. Redeploy na Vercel (necessário porque `VITE_*` entra no build).

---

## 11. Configuração sugerida dos 2 projetos Vercel (referência)

Mesmo repositório GitHub, dois projetos:

| Projeto | Root Directory | Build | Output |
|---------|----------------|-------|--------|
| Público | `.` (raiz) | `npm run build` | `dist` |
| Admin | `admin` | `npm run build` | `dist` |

Framework preset: Vite. Env: `VITE_API_URL` como acima.

A VPS **não** precisa publicar os fronts se a Vercel estiver no ar.

---

## 12. Atualizar o código na VPS (rotina)

```powershell
cd C:\apps\canal-denuncia-anonima
git pull origin main
npm install --prefix server
npm run db:migrate
pm2 restart canal-denuncia-api
```

Rodar `db:migrate` é seguro se os scripts forem idempotentes / já aplicados; se um script novo falhar por “já existe”, avaliar o SQL antes de forçar.

**Não** rode `db:seed-admin` de novo em produção sem necessidade (pode conflitar com usuários existentes ou resetar expectativas de senha — leia o script antes).

---

## 13. Checklist de conclusão (VPS)

- [ ] Repo clonado de `davilucas-soaco/canal-denuncia-anonima`
- [ ] Node 20+, Git, SQL Express, ODBC Driver 18
- [ ] Pasta `data/` e `data/uploads/` com permissão para o SQL
- [ ] `server/.env` preenchido (JWT, seed password, encryption key)
- [ ] `npm run db:migrate` OK
- [ ] `npm run db:seed-admin` OK
- [ ] `GET /api/health` → `ok: true`, `database: up`
- [ ] Porta 3001 no firewall
- [ ] API persistente (PM2 ou serviço Windows)
- [ ] IP da VPS e URL da API anotados para configurar a Vercel
- [ ] (Depois) CORS + `PUBLIC_BASE_URL` + `ADMIN_BASE_URL` com URLs Vercel

---

## 14. Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| migrate não conecta | SQL parado, instância errada, ODBC 18 ausente |
| CREATE DATABASE falha | Sem permissão de escrita em `data/` |
| health `database: down` | `.env` errado ou API sem acesso Windows Auth ao SQL |
| CORS no browser | `CORS_ORIGIN` sem a URL exata do front Vercel (com `https://`) |
| Front chama API e falha | `VITE_API_URL` errada ou rebuild Vercel não feito após mudar env |
| Anexos somem após reboot | `UPLOAD_DIR` apontando para disco temporário — manter em `data/uploads` no disco da VPS |

---

## 15. Respostas que a IA da VPS deve devolver ao final

Informar ao time:

1. Caminho do clone na VPS  
2. Resultado de `GET http://127.0.0.1:3001/api/health`  
3. URL externa da API: `http://<IP>:3001`  
4. Se o serviço/PM2 está ativo  
5. Se o seed foi feito (sem repetir a senha em chat público — confirmar só que foi definida no `.env`)  
6. Pendências: URLs Vercel ainda não aplicadas no CORS (se for o caso)

---

## 16. O que NÃO fazer

- Não subir API na Vercel (serverless não serve SQL Server + uploads em disco neste projeto)
- Não trocar SQL Server por outro banco sem ordem explícita
- Não versionar `.env` nem `data/`
- Não expor SQL Server (1433) na internet — só a API (3001) conforme necessidade
- Não usar senha seed `admin123` em produção

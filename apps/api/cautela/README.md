# API de Cautela

Backend em NestJS para o MVP do sistema de cautela, com autenticação por JWT, usuários, setores e fluxo de cautelas com aprovação e reprovação.

## O que foi implementado

- `POST /users` para cadastro de usuários
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`
- `GET /users/me` e gestão básica de usuários
- CRUD básico de setores
- `POST /cautelas`, `GET /cautelas`, `GET /cautelas/:id`
- `PATCH /cautelas/:id/aprovar`
- `PATCH /cautelas/:id/reprovar`
- Regras de perfil para `PORTARIA`, `GESTOR` e `ADMIN`
- Persistência no SQL Server com TypeORM
- Hash de senha com PBKDF2

## Perfis

- `PORTARIA`: cria cautelas e consulta as próprias solicitações
- `GESTOR`: consulta e decide cautelas vinculadas aos seus setores
- `ADMIN`: faz gestão de usuários e setores

Observação: a criação de `ADMIN` fica liberada apenas no bootstrap inicial, antes de existir qualquer usuário na base.

## Variáveis de ambiente

Use o arquivo `.env.example` como base para criar o `.env`.

Campos principais:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

## Subida local

### Sem Docker

```bash
npm install
cp .env.example .env
npm run start:dev
```

### Com Docker

```bash
cp .env.example .env
docker compose up --build
```

## Observações importantes

- O backend usa `synchronize=true` por padrão para acelerar o MVP.
- A conexão com SQL Server já considera `encrypt=true` e `trustServerCertificate=true`, alinhado ao print que você enviou.
- O nome do banco ficou como `cautela` no exemplo. Se você quiser usar outro banco, ajuste `DATABASE_NAME`.
- No WSL desta máquina o runtime do Node não está funcional, então eu não consegui executar `npm run build` daqui para validar em tempo real.

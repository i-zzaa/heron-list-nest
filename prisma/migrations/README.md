# Migrations

Este projeto passou a usar `prisma migrate` para versionar o schema, em vez de
`prisma db push`. A migration `20260805110114_init` é um **baseline**: representa
o schema como ele já estava no banco remoto (nada foi executado por ela — ela só
foi marcada como aplicada com `prisma migrate resolve --applied`).

## Aplicando migrations existentes (produção)

```bash
npm run migrate:deploy   # = npx prisma migrate deploy
```

Aplica só as migrations pendentes na ordem, sem tentar recriar o que já existe.
Não precisa de shadow database.

## Criando uma nova migration

O usuário do banco (`hdvjel_agenda`) só tem privilégio na própria database, sem
`CREATE DATABASE` — então `prisma migrate dev` (que cria uma shadow database
temporária para validar o diff) **não funciona aqui**. Fluxo manual equivalente:

```bash
# 1. Edite prisma/schema.prisma com a mudança desejada.

# 2. Gere o SQL do diff (schema atual do banco -> novo schema.prisma):
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_nome_da_mudanca/migration.sql

# 3. Leia o SQL gerado antes de aplicar (principalmente DROP/ALTER que
#    possam perder dado).

# 4. Aplique no banco:
npx prisma db execute --file prisma/migrations/<pasta>/migration.sql --url "$DATABASE_URL"

# 5. Marque como aplicada no histórico:
npx prisma migrate resolve --applied <pasta>

# 6. Confirme:
npx prisma migrate status   # deve dizer "Database schema is up to date!"
```

Se um dia o banco ganhar um usuário com permissão de `CREATE DATABASE` (ou uma
`shadowDatabaseUrl` separada), dá pra voltar a usar `prisma migrate dev` normalmente.

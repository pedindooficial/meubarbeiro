# Meu Barbeiro – Gestão de Barbearias

Sistema full-stack para donos de barbearia gerenciarem clientes, cortes, catálogo, análise financeira e planos de ação. Inclui painel admin para gerenciar todos os tenants e planos pagos via Stripe.

## Stack

- **Next.js 14** (App Router)
- **MongoDB** (Mongoose)
- **NextAuth.js** (email/senha + Google)
- **Stripe** (assinaturas)
- **Tailwind CSS**
- **TypeScript**

## Pré-requisitos

- Node.js 18+
- Conta MongoDB (ex.: Atlas)
- Conta Stripe
- (Opcional) Projeto Google Cloud para OAuth

## Instalação

```bash
npm install
cp .env.example .env
# Edite .env com suas chaves
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Preencha `.env` conforme `.env.example`:

- **MONGODB_URI** – string de conexão MongoDB
- **NEXTAUTH_SECRET** – gere com `openssl rand -base64 32`
- **NEXTAUTH_URL** – em dev: `http://localhost:3000`
- **GOOGLE_CLIENT_ID** e **GOOGLE_CLIENT_SECRET** – para login com Google
- **STRIPE_SECRET_KEY**, **STRIPE_WEBHOOK_SECRET**, **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- **STRIPE_PRICE_BASIC** e **STRIPE_PRICE_PREMIUM** – Price IDs dos planos no Stripe (recorrência mensal)

## Criar o primeiro usuário admin

Por padrão novos usuários são barbeiros. Para ter um admin, crie um usuário pelo registro normal e depois no MongoDB altere o documento em `users`:

```javascript
db.users.updateOne(
  { email: "seu-email@admin.com" },
  { $set: { role: "admin" }, $unset: { tenantId: 1 } }
)
```

Ou use o Mongoose/Compass para editar `role` para `"admin"` e remover `tenantId`.

## Deploy na Vercel

1. Conecte o repositório à Vercel.
2. Configure as variáveis de ambiente no painel.
3. Em Stripe, defina o webhook para `https://seu-dominio.vercel.app/api/webhooks/stripe` e use o signing secret em `STRIPE_WEBHOOK_SECRET`.

## Estrutura

- `app/(auth)` – login, registro
- `app/(dashboard)/dashboard` – área do barbeiro (clientes, cortes, catálogo, financeiro, planos de ação, assinatura)
- `app/(admin)/admin` – painel admin (listar/editar barbearias, métricas)
- `app/api` – API routes (auth, CRUD, checkout, webhook Stripe)
- `lib` – db, auth, stripe, modelos Mongoose

## Responsivo e WebView

O layout é responsivo e pode ser usado dentro de uma WebView no app; viewport e botões seguem boas práticas para toque.

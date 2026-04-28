# Integração API/Frontend - Guia de Uso

## Visão Geral

Esta integração conecta o banco de dados SQLite da API NestJS (`apps/api/smt-stencil`) com o frontend React (`apps/web/smt-stencil-LV`). Os dados de Stencils e Plates agora são consumidos da API em tempo real.

## Configuração

### Backend (API)

1. **CORS habilitado** para aceitar requisições do frontend:
   - Origem: `http://localhost:8080` e `http://localhost:3000`
   - Métodos: GET, POST, PUT, PATCH, DELETE

2. **Banco de dados**: SQLite (`db.sqlite`)
   - Configure via arquivo `.env` na pasta `apps/api/smt-stencil/`

### Frontend

1. **Configuração de URL da API**:
   - Crie arquivo `.env.local` (ou use `.env.example` como referência)
   - Defina: `VITE_API_URL=http://localhost:3000`

2. **Dependências**:
   - React Query (TanStack Query) - já instalado
   - Fetch API nativa - sem dependências extras

## Arquivos Criados/Modificados

### Backend
- `src/main.ts` - Adicionado CORS

### Frontend
- `src/lib/api.ts` - Cliente HTTP para consumir endpoints
- `src/hooks/useApi.ts` - Hooks para Stencils e Plates com mapeamento de dados
- `src/hooks/useDashboardData.ts` - Atualizado para consumir API real
- `.env.local` - Configuração de URL da API
- `.env.example` - Exemplo de configuração

## Como Usar

### 1. Iniciar a API

```bash
cd apps/api/smt-stencil
npm install  # se necessário
npm run dev
```

A API estará disponível em `http://localhost:3000`

### 2. Iniciar o Frontend

```bash
cd apps/web/smt-stencil-LV
npm install  # se necessário
npm run dev
```

O frontend estará disponível em `http://localhost:8080`

### 3. Verificar Endpoints da API

- **Stencils**:
  - `GET /stencils` - Lista todos os stencils
  - `GET /stencils/:id` - Detalhes de um stencil
  - `POST /stencils` - Criar novo stencil
  - `PATCH /stencils/:id` - Atualizar stencil
  - `DELETE /stencils/:id` - Deletar stencil

- **Plates**:
  - `GET /plates` - Lista todas as placas
  - `GET /plates/:id` - Detalhes de uma placa
  - `POST /plates` - Criar nova placa
  - `PATCH /plates/:id` - Atualizar placa
  - `DELETE /plates/:id` - Deletar placa

## Fluxo de Dados

1. **Dashboard carrega** → `useDashboardData()` é ativado
2. **React Query faz requisição** → `useStencils()` e `usePlates()`
3. **API responde** com dados do banco SQLite
4. **Dados mapeados** para formato do frontend
5. **Dashboard renderiza** com dados reais
6. **Auto-refresh** a cada 60 segundos (configurável)

## Tipos de Dados

### Stencil (API)
```typescript
{
  id: string;
  stencilCode: string;
  manufactureId: string;
  country: string;
  thickness: number;
  addressing: number;
  totalWashes: number;
  operator: string;
  lineName: string;
  status: 'active' | 'inactive';
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

### Plate (API)
```typescript
{
  id: string;
  plateModel: string;
  serialNumber: string;
  blankId: string;
  shift: number;
  phase: number;
  totalWashes: number;
  operator: string;
  lineName: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

## Troubleshooting

### CORS Error
- Verifique se a API está rodando em `http://localhost:3000`
- Confirme que CORS está habilitado em `src/main.ts`

### Dados não aparecem
- Verifique se há dados no banco SQLite
- Abra seu navegador em `http://localhost:3000/stencils` para testar endpoint
- Verifique console do navegador para erros de fetch

### Auto-refresh não funciona
- Verifique se React Query está instalado
- Confirme que `useDashboardData()` está sendo chamado em `Index.tsx`

## Próximos Passos

1. Adicionar autenticação/autorização
2. Implementar filtros avançados
3. Adicionar paginação na API
4. Implementar soft-delete
5. Adicionar validações mais robustas
6. Setup de CI/CD

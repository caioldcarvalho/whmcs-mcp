# Troubleshooting - WHMCS MCP

## Erro: "Invalid IP"

### Sintoma
```json
{"result":"error","message":"Invalid IP 170.0.207.155"}
```

### Causa
A API do WHMCS tem restrição de IP. Seu IP atual não está autorizado a acessar a API.

### Solução

1. Acesse o painel admin do WHMCS
2. Vá em **Setup > Staff Management > Manage API Credentials**
3. Encontre suas credenciais de API
4. Adicione o IP atual (`170.0.207.155`) na lista de IPs permitidos
5. Ou configure para aceitar qualquer IP (não recomendado para produção)

### Verificar IP Atual

```bash
curl -s https://api.ipify.org
```

---

## Erro: "Authentication Failed"

### Sintoma
```json
{"result":"error","message":"Authentication Failed"}
```

### Causa
Credenciais de API incorretas.

### Solução

1. Verifique o arquivo `.env`:
   ```bash
   cat /home/caio/workspace/whmcs-mcp/.env
   ```

2. Confirme que `WHMCS_IDENTIFIER` e `WHMCS_SECRET` estão corretos

3. Se necessário, gere novas credenciais no WHMCS:
   - **Setup > Staff Management > Manage API Credentials**
   - Clique em "Generate New API Credential"

---

## MCP Server Não Conecta

### Sintoma
```
whmcs: node /path/to/build/index.js - ✗ Disconnected
```

### Soluções

1. **Verificar se o build está atualizado:**
   ```bash
   cd /home/caio/workspace/whmcs-mcp
   npm run build
   ```

2. **Testar o servidor manualmente:**
   ```bash
   node build/index.js
   ```

   Você deve ver:
   ```
   WHMCS MCP Server running on stdio
   ```

3. **Verificar logs de erro:**
   ```bash
   claude mcp get whmcs
   ```

4. **Remover e re-adicionar o servidor:**
   ```bash
   claude mcp remove whmcs -s local
   claude mcp add --transport stdio whmcs -- node /home/caio/workspace/whmcs-mcp/build/index.js
   ```

---

## Erro de Timeout

### Sintoma
Requisições demoram muito ou timeout.

### Soluções

1. **Verificar conexão com WHMCS:**
   ```bash
   curl -I https://app.mysourei.com/includes/api.php
   ```

2. **Aumentar timeout no cliente** (se necessário):
   Edite `src/whmcs-client.ts` e adicione:
   ```typescript
   this.client = axios.create({
     baseURL: config.apiUrl,
     timeout: 30000, // 30 segundos
     headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
     },
   });
   ```

---

## Variáveis de Ambiente Não Carregam

### Sintoma
Erro sobre variáveis de ambiente faltando.

### Solução

1. **Verificar arquivo .env:**
   ```bash
   ls -la /home/caio/workspace/whmcs-mcp/.env
   ```

2. **Verificar conteúdo:**
   ```bash
   cat /home/caio/workspace/whmcs-mcp/.env
   ```

3. **Formato correto do .env:**
   ```env
   WHMCS_IDENTIFIER=seu_identifier_aqui
   WHMCS_SECRET=seu_secret_aqui
   WHMCS_API_URL=https://seu-whmcs.com/includes/api.php
   ```

   Sem aspas, sem espaços ao redor do `=`

---

## Testes de Conectividade

### Teste 1: Ping na API
```bash
curl -I https://app.mysourei.com/includes/api.php
```

### Teste 2: Requisição Básica
```bash
curl -X POST "https://app.mysourei.com/includes/api.php" \
  -d "action=GetTickets" \
  -d "identifier=SEU_IDENTIFIER" \
  -d "secret=SEU_SECRET" \
  -d "responsetype=json" \
  -d "limitnum=1"
```

### Teste 3: Cliente Node Direto
```bash
cd /home/caio/workspace/whmcs-mcp

node -e "
import('./build/whmcs-client.js').then(async ({ WHMCSClient }) => {
  const client = new WHMCSClient({
    identifier: process.env.WHMCS_IDENTIFIER,
    secret: process.env.WHMCS_SECRET,
    apiUrl: process.env.WHMCS_API_URL
  });

  const tickets = await client.getTickets({ limitnum: 1 });
  console.log('Sucesso:', tickets.result);
}).catch(err => console.error('Erro:', err.message));
"
```

---

## Informações Úteis

### IP Atual
```bash
curl -s https://api.ipify.org
# Resultado: 170.0.207.155
```

### Versões
```bash
node --version
npm --version
```

### Status do MCP
```bash
claude mcp list
claude mcp get whmcs
```

### Logs do Servidor
O servidor MCP roda em stdio, então os logs vão para stderr:
```bash
node build/index.js 2>&1 | tee mcp-server.log
```

---

## Contato

Para mais informações sobre a API WHMCS:
- https://developers.whmcs.com/
- https://developers.whmcs.com/api/authentication/

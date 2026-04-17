#!/bin/bash

# WHMCS MCP Server - Instalação para Claude Desktop
# Este script instala e configura o servidor MCP do WHMCS

set -e  # Exit on any error

echo "🚀 Instalando WHMCS MCP Server para Claude Desktop..."
echo

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "   Instale Node.js 18+ de: https://nodejs.org/"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ é necessário (você tem: $(node -v))"
    echo "   Atualize em: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Detectar diretório de configuração do Claude Desktop
CLAUDE_CONFIG_DIR=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
else
    echo "❌ Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

echo "📁 Diretório de config do Claude: $CLAUDE_CONFIG_DIR"

# Criar diretório se não existir
mkdir -p "$CLAUDE_CONFIG_DIR"

# Diretório de instalação do MCP
INSTALL_DIR="$HOME/.local/share/whmcs-mcp"

echo "📦 Baixando WHMCS MCP Server..."

# Criar diretório de instalação
mkdir -p "$INSTALL_DIR"

# Baixar o projeto (assumindo que está no GitHub)
if command -v git &> /dev/null; then
    echo "📥 Clonando repositório..."
    git clone https://github.com/caioldcarvalho/whmcs-mcp.git "$INSTALL_DIR" 2>/dev/null || {
        echo "⚠️  Erro ao clonar. Tentando atualizar repositório existente..."
        cd "$INSTALL_DIR" && git pull origin main
    }
else
    echo "❌ Git não encontrado! Instale git primeiro."
    exit 1
fi

cd "$INSTALL_DIR"

echo "📦 Instalando dependências..."
npm install

echo "🔨 Compilando..."
npm run build

# Criar arquivo de configuração das credenciais
MCP_CONFIG_FILE="$INSTALL_DIR/mcp.json"
if [ ! -f "$MCP_CONFIG_FILE" ]; then
    echo "⚙️  Criando arquivo de configuração..."
    cp mcp.example.json mcp.json
    echo
    echo "🔐 CONFIGURE SUAS CREDENCIAIS WHMCS:"
    echo "    Arquivo: $MCP_CONFIG_FILE"
    echo
    echo "    Com credenciais API:"
    echo "    - whmcs.identifier: seu_identifier_aqui"
    echo "    - whmcs.secret: seu_secret_aqui"
    echo "    - whmcs.apiUrl: https://seu-whmcs.com/includes/api.php"
    echo
    echo "    Ou com credenciais admin:"
    echo "    - whmcs.username: seu_usuario_admin"
    echo "    - whmcs.password: sua_senha_admin"
    echo "    - whmcs.apiUrl: https://seu-whmcs.com/includes/api.php"
    echo
fi

# Configurar Claude Desktop
CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "⚙️  Configurando Claude Desktop..."

# Backup da configuração existente
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📄 Backup criado: $CONFIG_FILE.backup.*"
fi

# Criar/atualizar configuração
if [ -f "$CONFIG_FILE" ]; then
    # Configuração existe - adicionar servidor MCP
    echo "📝 Adicionando WHMCS MCP à configuração existente..."
    
    # Usar jq se disponível, senão fazer manualmente
    if command -v jq &> /dev/null; then
        tmp_file=$(mktemp)
        jq --arg install_dir "$INSTALL_DIR" '.mcpServers.whmcs = {
            "command": "node",
            "args": [$install_dir + "/build/index.js"]
        }' "$CONFIG_FILE" > "$tmp_file"
        mv "$tmp_file" "$CONFIG_FILE"
    else
        echo "⚠️  jq não encontrado. Configure manualmente:"
        echo "   Adicione ao $CONFIG_FILE:"
        echo "   \"whmcs\": {"
        echo "     \"command\": \"node\","
        echo "     \"args\": [\"$INSTALL_DIR/build/index.js\"]"
        echo "   }"
    fi
else
    # Criar nova configuração
    echo "📝 Criando nova configuração do Claude Desktop..."
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "whmcs": {
      "command": "node",
      "args": ["$INSTALL_DIR/build/index.js"]
    }
  }
}
EOF
fi

echo
echo "✅ WHMCS MCP Server instalado com sucesso!"
echo
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configure suas credenciais WHMCS:"
echo "   📝 Editar: $MCP_CONFIG_FILE"
echo
echo "2. Reinicie o Claude Desktop"
echo
echo "3. Teste os comandos MCP:"
echo "   • whmcs_get_tickets"
echo "   • whmcs_get_clients"
echo "   • whmcs_get_stats"
echo "   • E mais 31 ferramentas disponíveis! (34 no total)"
echo
echo "🔧 Configuração salva em: $CONFIG_FILE"
echo "📁 Instalação em: $INSTALL_DIR"
echo
echo "🆘 Problemas? Verifique:"
echo "   • Credenciais no arquivo mcp.json"
echo "   • Reinicie o Claude Desktop"
echo "   • Logs em: $INSTALL_DIR"
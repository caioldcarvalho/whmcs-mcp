#!/bin/bash

# WHMCS MCP Server - Instalação para Claude Code (VS Code)
# Este script instala e configura o servidor MCP do WHMCS

set -e  # Exit on any error

echo "🚀 Instalando WHMCS MCP Server para Claude Code (VS Code)..."
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

# Verificar se o VS Code está instalado
if ! command -v code &> /dev/null; then
    echo "❌ VS Code não encontrado!"
    echo "   Instale VS Code de: https://code.visualstudio.com/"
    echo "   Ou adicione 'code' ao PATH"
    exit 1
fi

echo "✅ VS Code encontrado"

# Detectar diretório de configuração do VS Code
VSCODE_CONFIG_DIR=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    VSCODE_CONFIG_DIR="$HOME/Library/Application Support/Code/User"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    VSCODE_CONFIG_DIR="$HOME/.config/Code/User"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    VSCODE_CONFIG_DIR="$APPDATA/Code/User"
else
    echo "❌ Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

echo "📁 Diretório de config do VS Code: $VSCODE_CONFIG_DIR"

# Verificar se o diretório existe
if [ ! -d "$VSCODE_CONFIG_DIR" ]; then
    echo "❌ Diretório de configuração do VS Code não encontrado!"
    echo "   Execute o VS Code pelo menos uma vez primeiro."
    exit 1
fi

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
ENV_FILE="$INSTALL_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚙️  Criando arquivo de configuração..."
    cp .env.example .env
    echo
    echo "🔐 CONFIGURE SUAS CREDENCIAIS WHMCS:"
    echo "    Arquivo: $ENV_FILE"
    echo
    echo "    Edite e configure:"
    echo "    - WHMCS_IDENTIFIER=seu_identifier_aqui"
    echo "    - WHMCS_SECRET=seu_secret_aqui" 
    echo "    - WHMCS_API_URL=https://seu-whmcs.com/includes/api.php"
    echo
fi

# Instalar extensão Claude Code se não estiver instalada
echo "🔌 Verificando extensão Claude Code..."
if ! code --list-extensions | grep -q "claude-ai.claude-code"; then
    echo "📥 Instalando extensão Claude Code..."
    code --install-extension claude-ai.claude-code
    echo "✅ Extensão Claude Code instalada!"
else
    echo "✅ Extensão Claude Code já instalada"
fi

# Configurar VS Code settings
SETTINGS_FILE="$VSCODE_CONFIG_DIR/settings.json"

echo "⚙️  Configurando VS Code settings..."

# Backup das configurações existentes
if [ -f "$SETTINGS_FILE" ]; then
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📄 Backup criado: $SETTINGS_FILE.backup.*"
fi

# Criar/atualizar settings.json
if [ -f "$SETTINGS_FILE" ]; then
    # Settings existem - adicionar configuração MCP
    echo "📝 Adicionando WHMCS MCP às configurações existentes..."
    
    # Usar jq se disponível
    if command -v jq &> /dev/null; then
        tmp_file=$(mktemp)
        jq --arg install_dir "$INSTALL_DIR" '.["claude.mcpServers"] = {
            "whmcs": {
                "command": "node",
                "args": [$install_dir + "/build/index.js"]
            }
        }' "$SETTINGS_FILE" > "$tmp_file"
        mv "$tmp_file" "$SETTINGS_FILE"
    else
        echo "⚠️  jq não encontrado. Configure manualmente:"
        echo "   Adicione ao $SETTINGS_FILE:"
        echo "   \"claude.mcpServers\": {"
        echo "     \"whmcs\": {"
        echo "       \"command\": \"node\","
        echo "       \"args\": [\"$INSTALL_DIR/build/index.js\"]"
        echo "     }"
        echo "   }"
    fi
else
    # Criar novo settings.json
    echo "📝 Criando novo settings.json..."
    cat > "$SETTINGS_FILE" << EOF
{
  "claude.mcpServers": {
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
echo "   📝 Editar: $ENV_FILE"
echo
echo "2. Reinicie o VS Code"
echo
echo "3. Abra o Command Palette (Ctrl/Cmd+Shift+P) e digite:"
echo "   • 'Claude: Start MCP Session'"
echo
echo "4. Teste os comandos MCP no chat:"
echo "   • \"Liste os tickets do WHMCS\""
echo "   • \"Mostre estatísticas do WHMCS\""
echo "   • \"Quais clientes temos?\""
echo
echo "🔧 Configuração salva em: $SETTINGS_FILE"
echo "📁 Instalação em: $INSTALL_DIR"
echo
echo "📚 21 ferramentas WHMCS disponíveis:"
echo "   • Tickets, Clientes, Produtos, Faturas"
echo "   • Estatísticas, Logs, Administração"
echo
echo "🆘 Problemas? Verifique:"
echo "   • Credenciais no arquivo .env"
echo "   • Reinicie o VS Code"
echo "   • Extensão Claude Code instalada"
echo "   • Logs em: VS Code > Output > Claude Code"
#!/bin/bash

# Script para crear enlaces simbólicos de proyectos XAMPP
# Esto permite abrir proyectos de htdocs en MarkApp

echo "=========================================="
echo "  MarkApp - Crear enlace simbólico"
echo "=========================================="
echo ""
echo "Este script crea un enlace en tu carpeta Documents"
echo "que apunta a tu proyecto en XAMPP htdocs."
echo ""

# Detectar la ruta de XAMPP
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    HTDOCS_PATH="/Applications/XAMPP/xamppfiles/htdocs"
    DOCS_PATH="$HOME/Documents/xampp-projects"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    HTDOCS_PATH="/opt/lampp/htdocs"
    DOCS_PATH="$HOME/Documents/xampp-projects"
else
    echo "⚠️  Sistema operativo no soportado automáticamente"
    echo "Edita este script para configurar las rutas manualmente"
    exit 1
fi

# Verificar que htdocs existe
if [ ! -d "$HTDOCS_PATH" ]; then
    echo "❌ No se encuentra XAMPP htdocs en: $HTDOCS_PATH"
    echo ""
    echo "Si XAMPP está en otra ubicación, edita este script"
    exit 1
fi

echo "📁 Carpeta XAMPP encontrada: $HTDOCS_PATH"
echo ""

# Listar proyectos disponibles
echo "Proyectos disponibles en htdocs:"
echo "--------------------------------"
ls -1 "$HTDOCS_PATH" | grep -v "^\." | nl
echo ""

# Preguntar qué proyecto enlazar
read -p "¿Nombre del proyecto a enlazar? (o 'todos' para enlazar todos): " PROJECT_NAME

# Crear carpeta de destino si no existe
mkdir -p "$DOCS_PATH"

if [ "$PROJECT_NAME" == "todos" ]; then
    # Enlazar todos los proyectos
    echo ""
    echo "Creando enlaces para todos los proyectos..."
    for project in "$HTDOCS_PATH"/*; do
        if [ -d "$project" ] && [[ ! $(basename "$project") == .* ]]; then
            project_name=$(basename "$project")
            ln -s "$project" "$DOCS_PATH/$project_name" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ $project_name"
            else
                echo "⚠️  $project_name (ya existe)"
            fi
        fi
    done
else
    # Enlazar un proyecto específico
    SOURCE="$HTDOCS_PATH/$PROJECT_NAME"
    DEST="$DOCS_PATH/$PROJECT_NAME"

    if [ ! -d "$SOURCE" ]; then
        echo "❌ El proyecto '$PROJECT_NAME' no existe en htdocs"
        exit 1
    fi

    if [ -e "$DEST" ]; then
        echo "⚠️  Ya existe un enlace o carpeta en: $DEST"
        read -p "¿Eliminar y recrear? (s/n): " CONFIRM
        if [ "$CONFIRM" == "s" ]; then
            rm -rf "$DEST"
        else
            echo "Operación cancelada"
            exit 0
        fi
    fi

    ln -s "$SOURCE" "$DEST"
    echo ""
    echo "✅ Enlace creado exitosamente!"
fi

echo ""
echo "=========================================="
echo "🎉 ¡Listo!"
echo "=========================================="
echo ""
echo "Ahora puedes abrir en MarkApp:"
echo "📂 $DOCS_PATH"
echo ""
echo "Todos tus proyectos estarán accesibles allí"
echo ""

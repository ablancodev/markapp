# MarkApp by ablancodev

**MarkApp** es un editor de documentos Markdown estilo Notion que funciona 100% en tu ordenador. Sin instalación, sin registros, sin subir nada a internet.

> **Privacidad garantizada**: Todo funciona localmente en tu navegador. Nada se sube a la nube. Tus archivos permanecen en tu disco duro, completamente privados.

**Desarrollado por:** [ablancodev.com](https://ablancodev.com)

## 🎥 Demo

![Demo de MarkApp](./markapp.gif)

## ¿Qué puedes hacer con MarkApp?

- Escribir y organizar documentos en formato Markdown o texto plano
- Crear carpetas y subcarpetas para organizar tus archivos
- Cambiar entre 3 temas visuales (claro, oscuro y terminal retro)
- Ver documentos formateados o editarlos en modo texto
- Trabajar con varias carpetas a la vez usando pestañas
- Mover archivos arrastrándolos entre carpetas
- Todo se guarda en tu ordenador - funciona sin conexión
- Sin contraseñas, sin cuentas - solo tú y tus archivos

## Cómo empezar

### Instalación
1. Descarga el proyecto (botón verde "Code" → "Download ZIP")
2. Descomprime el archivo en tu ordenador
3. Abre el archivo `index.html` con tu navegador

### Uso
1. Haz clic en "Abrir Carpeta"
2. Selecciona la carpeta con tus documentos (recomendado: Documentos, Escritorio o Descargas)
3. Empieza a trabajar:
   - Ver archivos en el panel izquierdo
   - Crear documentos y carpetas con los botones del panel
   - Editar haciendo clic en los archivos
   - Cambiar entre modo Vista y Edición

**Atajos de teclado:**
- Ctrl+S (Cmd+S en Mac) - Guardar
- Arrastrar archivos - Mover entre carpetas

## Crear acceso directo en el escritorio

**Windows:**
1. Clic derecho en `index.html` → "Enviar a" → "Escritorio (crear acceso directo)"
2. (Opcional) Renombra el acceso directo a "MarkApp"

**Mac:**
- Arrastra `index.html` al Dock, o
- Clic derecho en `index.html` → "Crear alias" → Arrastra al Escritorio

**Linux:**
Crea un archivo `markapp.desktop` en tu escritorio:
```
[Desktop Entry]
Name=MarkApp
Exec=xdg-open /ruta/a/markapp/index.html
Icon=text-editor
Type=Application
Terminal=false
```
Luego marca "Permitir ejecutar como programa" en Propiedades → Permisos

## Navegadores compatibles

- ✅ Google Chrome (recomendado)
- ✅ Microsoft Edge (recomendado)
- ✅ Opera
- ❌ Firefox (no soporta File System Access API)
- ⚠️ Safari (soporte limitado)

## Ubicaciones permitidas

Por seguridad, los navegadores bloquean el acceso a carpetas del sistema.

**Puedes usar:**
- Documentos
- Escritorio
- Descargas
- Cualquier carpeta en tu directorio de usuario

**NO puedes usar:**
- `C:\Program Files\` o `C:\Windows\` (Windows)
- `/Applications/` (Mac)
- Carpetas de sistema o programas instalados

## Temas visuales

Tres temas disponibles (botones en la esquina superior derecha):
- **Claro** - Para trabajar de día
- **Oscuro** - Reduce fatiga visual
- **Terminal Retro** - Estilo terminal clásico (verde fosforescente)

Tu preferencia se guarda automáticamente.

## Casos de uso

- Documentación personal o de trabajo
- Apuntes y notas de clase
- Wiki personal
- Blog posts y artículos
- Manuales y guías
- Cualquier contenido en Markdown o texto plano

## Formatos soportados

**Markdown (.md, .markdown)**
- Formato con sintaxis simple: `# Título`, `**negrita**`, `*cursiva*`, `[enlaces](url)`
- Se renderiza como HTML formateado

**Texto plano (.txt)**
- Sin formato, texto sin procesar
- Ideal para documentos simples

## Preguntas frecuentes

**¿Necesito internet?**
No. Funciona completamente offline una vez descargado.

**¿Se guardan los archivos automáticamente?**
No. Usa Ctrl+S (Cmd+S en Mac) para guardar, como en cualquier editor.

**¿Funciona en móviles?**
Está optimizado para ordenadores. En móviles funciona pero con limitaciones.

**¿Es gratis?**
Sí, completamente gratis y de código abierto.

## Licencia

Proyecto de código abierto y gratuito. Puedes usarlo, modificarlo y compartirlo libremente.

**Tecnologías:** HTML, CSS, JavaScript, [Marked.js](https://marked.js.org/), [Font Awesome](https://fontawesome.com/)

---

**MarkApp by ablancodev** - Editor de documentos Markdown privado y local.

Desarrollado por [ablancodev.com](https://ablancodev.com)

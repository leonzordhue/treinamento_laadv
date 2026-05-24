#!/usr/bin/env python3
"""
LAADV Portal — Build Script
AKE/UFT-1.0 | Concatena fragmentos src/*.frag.* em index.html

Uso:
    python build.py          → gera index.html a partir dos frags
    python build.py --check  → valida estrutura dos frags sem gerar

Ordem de injeção: style → body → firebase → auth → app → render_* → render2
"""

import os, re, sys
from datetime import datetime

SRC_DIR   = "src"
OUT_FILE  = "index.html"
BUILD_ID  = f"LAADV-{datetime.now().strftime('%Y%m%d-%H%M')}"

JS_FRAGS = [
    "_firebase.frag.js",
    "_auth.frag.js",
    "_app.frag.js",
    "_render_inicio.frag.js",
    "_render_treino.frag.js",
    "_render_usuarios.frag.js",
    "_render_conteudo.frag.js",
    "_render2.frag.js",
]

ALL_FRAGS = ["_style.frag.css", "_body.frag.html"] + JS_FRAGS


def read_frag(name, strip_footer=True):
    path = os.path.join(SRC_DIR, name)
    if not os.path.exists(path):
        print(f"  [SKIP] {name} nao encontrado")
        return ""
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if strip_footer:
        content = re.sub(r'\n// AKE/UFT-1\.0 \| BUILD.*$', '', content, flags=re.MULTILINE)
    print(f"  [OK]   {name} ({len(content.splitlines())} linhas)")
    return content.rstrip()


def build():
    print(f"\n=== AKE BUILD {BUILD_ID} ===\n")

    if not os.path.isdir(SRC_DIR):
        print(f"Pasta '{SRC_DIR}/' nao encontrada. Build cancelado.")
        return

    style  = read_frag("_style.frag.css")
    body   = read_frag("_body.frag.html", strip_footer=False)
    js_blocks = "\n\n".join(read_frag(f) for f in JS_FRAGS)

    output = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal de Treinamentos · Luís Albert Advocacia</title>

<!-- Firebase Realtime Database -->
<script src="https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.11.0/firebase-database-compat.js"></script>
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<!-- Fontes LAADV -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<style>
{style}
</style>
</head>
<body>

{body}

<script>
{js_blocks}
</script>
</body>
</html>
"""

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(output)

    lines = len(output.splitlines())
    size  = os.path.getsize(OUT_FILE)
    print(f"\n[WRITEBACK] {OUT_FILE} gerado — {lines} linhas | {size:,} bytes | BUILD: {BUILD_ID}\n")


if __name__ == "__main__":
    if "--check" in sys.argv:
        print("Modo check — validando frags:")
        for name in ALL_FRAGS:
            path = os.path.join(SRC_DIR, name)
            status = "OK" if os.path.exists(path) else "AUSENTE"
            print(f"  [{status}]  {name}")
    else:
        build()

#!/usr/bin/env python3
"""
LAADV Portal — Build Script
AKE/UFT-1.0 | Concatena fragmentos src/*.frag.* em index.html

Uso:
    python build.py          → gera index.html a partir dos frags
    python build.py --check  → valida estrutura dos frags sem gerar

Ordem de injeção: style → firebase → auth → data → render → ui
"""

import os, re, sys
from datetime import datetime

SRC_DIR   = "src"
OUT_FILE  = "index.html"
BUILD_ID  = f"LAADV-{datetime.now().strftime('%Y%m%d-%H%M')}"

FRAG_ORDER = [
    "_style.frag.css",
    "_firebase.frag.js",
    "_auth.frag.js",
    "_data.frag.js",
    "_render.frag.js",
    "_ui.frag.js",
]

HTML_SHELL = """\
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal de Treinamentos · Luís Albert Advocacia</title>
<script src="https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.11.0/firebase-database-compat.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
{{STYLE}}
</style>
</head>
<body>
{{BODY}}
<script>
{{FIREBASE}}
{{AUTH}}
{{DATA}}
{{RENDER}}
{{UI}}
// AKE/UFT-1.0 | BUILD: {build_id} | IC: 1.0 | PIPELINE: FETCH→DECODE→EXECUTE→WRITEBACK
</script>
</body>
</html>
""".format(build_id=BUILD_ID)


def read_frag(name):
    path = os.path.join(SRC_DIR, name)
    if not os.path.exists(path):
        print(f"  [SKIP] {name} não encontrado")
        return ""
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"  [OK]   {name} ({len(content.splitlines())} linhas)")
    return content


def build():
    print(f"\n=== AKE BUILD {BUILD_ID} ===\n")

    if not os.path.isdir(SRC_DIR):
        print(f"Pasta '{SRC_DIR}/' não encontrada.")
        print("Fragmentação ainda não realizada — usando index.html existente.")
        return

    frags = {name: read_frag(name) for name in FRAG_ORDER}

    # Se nenhum frag existir, não sobrescrever index.html
    if all(v == "" for v in frags.values()):
        print("\nNenhum frag encontrado. Build cancelado.")
        return

    output = HTML_SHELL
    output = output.replace("{{STYLE}}",    frags.get("_style.frag.css",    "/* no style frag */"))
    output = output.replace("{{FIREBASE}}", frags.get("_firebase.frag.js",  "// no firebase frag"))
    output = output.replace("{{AUTH}}",     frags.get("_auth.frag.js",      "// no auth frag"))
    output = output.replace("{{DATA}}",     frags.get("_data.frag.js",      "// no data frag"))
    output = output.replace("{{RENDER}}",   frags.get("_render.frag.js",    "// no render frag"))
    output = output.replace("{{UI}}",       frags.get("_ui.frag.js",        "// no ui frag"))

    # Body vem do frag de UI se existir, senão placeholder
    body_frag = os.path.join(SRC_DIR, "_body.frag.html")
    if os.path.exists(body_frag):
        with open(body_frag, "r", encoding="utf-8") as f:
            output = output.replace("{{BODY}}", f.read())
    else:
        output = output.replace("{{BODY}}", "<!-- body inline no ui frag -->")

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(output)

    lines = len(output.splitlines())
    print(f"\n[WRITEBACK] {OUT_FILE} gerado — {lines} linhas | BUILD: {BUILD_ID}\n")


if __name__ == "__main__":
    if "--check" in sys.argv:
        print("Modo check — validando frags:")
        for name in FRAG_ORDER:
            path = os.path.join(SRC_DIR, name)
            status = "✓" if os.path.exists(path) else "✗ ausente"
            print(f"  {status}  {name}")
    else:
        build()

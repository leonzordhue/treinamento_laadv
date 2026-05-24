# Legacy — Protótipo Multi-Página

Esta pasta contém os arquivos do protótipo anterior do Portal de Treinamentos LAADV,
que era estruturado como uma aplicação multi-página (múltiplos arquivos HTML por seção).

## Estrutura original

| Pasta      | Descrição                                |
|------------|------------------------------------------|
| academia/  | Módulo de treinamentos (versão antiga)   |
| compras/   | Módulo de compras (versão antiga)        |
| core/      | Componentes compartilhados (versão antiga) |
| dashboard/ | Dashboard principal (versão antiga)      |
| rh/        | Módulo de RH (versão antiga)             |

## Por que foi substituído

O protótipo multi-página foi supersedido pelo **single-file app** (`index.html` na raiz),
que unifica toda a lógica em um único arquivo HTML + JS + CSS, sem dependências de build,
hospedado via GitHub Pages com backend Firebase Realtime Database.

**Não edite estes arquivos.** Use sempre `index.html` na raiz do projeto.

---
*AKE/UFT-1.0 | Portal de Treinamentos LAADV v2.0*

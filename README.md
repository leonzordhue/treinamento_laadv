# Portal de Treinamentos · Luís Albert Advocacia

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ativo-brightgreen?logo=github)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange?logo=firebase)
![Versão](https://img.shields.io/badge/versão-2.0-blue)

Portal interno de gestão e consumo de treinamentos corporativos da **Luís Albert Advocacia**. Desenvolvido como aplicação single-file (HTML + JS + CSS), sem dependências de build, hospedado via GitHub Pages com backend no Firebase Realtime Database.

---

## Como configurar

### Pré-requisitos

- Conta Google com acesso ao [Firebase Console](https://console.firebase.google.com)
- Repositório no GitHub com GitHub Pages ativo (branch `master`, raiz `/`)

### Passos

**1. Criar o banco de dados Firebase**

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto.
2. No menu lateral, vá em **Build → Realtime Database → Criar banco de dados**.
3. Escolha a região mais próxima e inicie no **modo de teste** (as regras definitivas estão em `firebase-rules.json`).

**2. Obter as credenciais**

1. Na visão geral do projeto, clique no ícone **`</>`** (Adicionar app da Web).
2. Registre o app e copie o objeto `firebaseConfig`.

**3. Configurar o arquivo `index.html`**

Abra `index.html` e substitua os valores `"COLE_AQUI"` no objeto `FIREBASE_CONFIG` (linhas 406–413):

```js
const FIREBASE_CONFIG = {
  apiKey:            "sua-api-key",
  authDomain:        "seu-projeto.firebaseapp.com",
  databaseURL:       "https://seu-projeto-default-rtdb.firebaseio.com",  // obrigatório
  projectId:         "seu-projeto",
  storageBucket:     "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

**4. Aplicar as regras de segurança**

No Firebase Console, vá em **Realtime Database → Regras** e cole o conteúdo de `firebase-rules.json`.

---

## Estrutura do banco de dados

```
laadv_portal/
├── config/
│   ├── setup_done       → Boolean — se o portal já foi inicializado
│   ├── org_name         → String  — nome da organização
│   └── criado_em        → ISO String — data de criação
│
├── usuarios/{uid}/
│   ├── nome             → String
│   ├── usuario          → String — login único (letras, números, pontos)
│   ├── senha_hash       → String — SHA-256 da senha (64 chars hex)
│   ├── role             → "master" | "admin" | "user"
│   ├── setor            → String
│   ├── cargo            → String
│   ├── ativo            → Boolean
│   └── primeiro_acesso  → Boolean — força troca de senha no 1º login
│
├── treinamentos/{tid}/
│   ├── titulo           → String
│   ├── descricao        → String (máx. 300 chars)
│   ├── ativo            → Boolean
│   ├── ordem            → Number — ordem de exibição
│   └── videos/{vid}/
│       ├── titulo       → String
│       ├── url          → String — link do YouTube ou URL de vídeo
│       └── duracao      → String (ex: "15 min")
│
├── logs/{lid}/
│   ├── ts               → ISO String — timestamp do evento
│   ├── ator_id          → String — uid do usuário
│   ├── ator_nome        → String
│   ├── ator_role        → "master" | "admin" | "user"
│   ├── acao             → String — código da ação (ex: LOGIN, CRIAR_USUARIO)
│   └── detalhes         → String — descrição livre
│
└── conclusoes/{uid}/{tid}
    └── ISO String       — timestamp de quando o treinamento foi concluído
```

---

## Papéis e permissões

| Funcionalidade | master | admin | user |
|---|:---:|:---:|:---:|
| Acessar treinamentos | ✓ | ✓ | ✓ |
| Editar perfil e senha | ✓ | ✓ | ✓ |
| Gerenciar usuários (criar, editar, ativar/desativar) | ✓ | ✓ (apenas users) | — |
| Gerenciar conteúdo (treinamentos e vídeos) | ✓ | ✓ | — |
| Visualizar relatórios e logs | ✓ | ✓ (filtrado) | — |
| Excluir usuários / treinamentos | ✓ | — | — |
| Redefinir senha de outros usuários | ✓ | — | — |
| Configurações do sistema | ✓ | — | — |
| Limpar logs | ✓ | — | — |

> **master** é o Super Administrador criado na primeira configuração do portal. Apenas um master pode promover outros usuários a admin ou master.

---

## Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| HTML5 + CSS3 + Vanilla JS | Interface e lógica de negócio (single-file) |
| [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) v10 (CDN compat) | Persistência de dados em tempo real |
| [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | Hash SHA-256 das senhas no cliente |
| [Google Fonts](https://fonts.google.com) — Cormorant Garamond + DM Sans | Tipografia |
| [GitHub Pages](https://pages.github.com) | Hospedagem estática |

---

## Notas de segurança

- As senhas são armazenadas como hash SHA-256. **Não há transmissão de senhas em texto puro.**
- O Firebase Auth **não** é utilizado — a autenticação é gerenciada inteiramente pelo app.
- As regras em `firebase-rules.json` validam estrutura e tipos dos dados, mas mantêm leitura/escrita abertas, pois a proteção de acesso ocorre na camada JavaScript. Para ambientes de produção com dados sensíveis, considere implementar Firebase Auth e regras baseadas em `auth.uid`.
- A sessão do usuário é mantida via `sessionStorage` (limpa ao fechar o navegador).

---

*Portal de Treinamentos LAADV v2.0 · AKE/UFT-1.0*

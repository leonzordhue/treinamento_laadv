#!/usr/bin/env python3
"""
LAADV Orchestrator — Servidor MCP de coordenação multi-agente
AKE/UFT-1.0 | Permite comunicação direta Principal ↔ Lexgroup

Protocolo: MCP stdio (JSON-RPC 2.0)
Uso: registrado em .claude/settings.json — carregado automaticamente pelo Claude Code
"""
import json, sys, os
from datetime import datetime
from pathlib import Path

QUEUE_FILE = Path(__file__).parent / ".claude" / "mcp_queue.json"


def load_queue():
    if QUEUE_FILE.exists():
        try:
            return json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"messages": [], "tasks": []}


def save_queue(data):
    QUEUE_FILE.parent.mkdir(exist_ok=True)
    QUEUE_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def ts():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ── Handlers de ferramentas ────────────────────────────────────────────────

def tool_send(args):
    """Envia mensagem/task de um agente para outro."""
    q = load_queue()
    msg = {
        "id":         f"msg-{int(datetime.now().timestamp()*1000)}",
        "de":         args.get("de", "desconhecido"),
        "para":       args["para"],
        "tipo":       args.get("tipo", "mensagem"),   # mensagem | task | resultado
        "conteudo":   args["conteudo"],
        "ts":         ts(),
        "lida":       False,
    }
    q["messages"].append(msg)
    save_queue(q)
    return {"ok": True, "id": msg["id"], "ts": msg["ts"]}


def tool_receber(args):
    """Retorna mensagens não lidas para o agente especificado e marca como lidas."""
    q = load_queue()
    agente = args["agente"]
    pendentes = [m for m in q["messages"] if m["para"] == agente and not m["lida"]]
    for m in q["messages"]:
        if m["para"] == agente:
            m["lida"] = True
    save_queue(q)
    return {"total": len(pendentes), "mensagens": pendentes}


def tool_status(args):
    """Lista as últimas N mensagens de todos os agentes (padrão 20)."""
    q = load_queue()
    n = int(args.get("n", 20))
    msgs = q["messages"][-n:]
    nao_lidas = sum(1 for m in q["messages"] if not m["lida"])
    return {"total_historico": len(q["messages"]), "nao_lidas": nao_lidas, "ultimas": msgs}


def tool_delegar(args):
    """
    Atalho: Principal delega task à Lexgroup com prioridade e descrição formatada.
    Equivale a send com tipo=task para lexgroup.
    """
    q = load_queue()
    task_id = args.get("task_id", f"TASK-AUTO-{int(datetime.now().timestamp())}")
    msg = {
        "id":       f"task-{int(datetime.now().timestamp()*1000)}",
        "de":       "principal",
        "para":     "lexgroup",
        "tipo":     "task",
        "conteudo": f"[{task_id}] {args['descricao']}",
        "prioridade": args.get("prioridade", "normal"),
        "ts":       ts(),
        "lida":     False,
    }
    q["messages"].append(msg)
    save_queue(q)
    return {"ok": True, "task_id": task_id, "id": msg["id"]}


def tool_reportar(args):
    """
    Atalho: Lexgroup reporta conclusão de task ao Principal.
    Equivale a send com tipo=resultado para principal.
    """
    q = load_queue()
    msg = {
        "id":       f"result-{int(datetime.now().timestamp()*1000)}",
        "de":       "lexgroup",
        "para":     "principal",
        "tipo":     "resultado",
        "conteudo": f"[{args['task_id']}] CONCLUÍDA — {args['resumo']}",
        "ic":       args.get("ic", "1.0"),
        "ts":       ts(),
        "lida":     False,
    }
    q["messages"].append(msg)
    save_queue(q)
    return {"ok": True, "id": msg["id"]}


# ── Definição das ferramentas MCP ──────────────────────────────────────────

TOOLS = [
    {
        "name": "orq_send",
        "description": "Envia uma mensagem direta de um agente Claude para outro (Principal ou Lexgroup).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "de":       {"type": "string", "description": "Agente remetente: 'principal' ou 'lexgroup'"},
                "para":     {"type": "string", "description": "Agente destinatário: 'principal' ou 'lexgroup'"},
                "tipo":     {"type": "string", "description": "Tipo: 'mensagem', 'task' ou 'resultado'"},
                "conteudo": {"type": "string", "description": "Conteúdo da mensagem"},
            },
            "required": ["para", "conteudo"],
        },
    },
    {
        "name": "orq_receber",
        "description": "Retorna mensagens pendentes (não lidas) para este agente. Chame ao iniciar uma sessão.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agente": {"type": "string", "description": "Seu nome: 'principal' ou 'lexgroup'"},
            },
            "required": ["agente"],
        },
    },
    {
        "name": "orq_status",
        "description": "Lista as últimas mensagens trocadas entre os agentes (histórico).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "n": {"type": "integer", "description": "Número de mensagens a retornar (padrão 20)"},
            },
        },
    },
    {
        "name": "orq_delegar",
        "description": "Principal delega uma task à Lexgroup com task_id e descrição formatada.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id":    {"type": "string", "description": "Ex: TASK-30"},
                "descricao":  {"type": "string", "description": "Descrição completa do que deve ser feito"},
                "prioridade": {"type": "string", "description": "'urgente', 'alta', 'normal' (padrão: normal)"},
            },
            "required": ["descricao"],
        },
    },
    {
        "name": "orq_reportar",
        "description": "Lexgroup reporta conclusão de task ao Principal com resumo do que foi feito.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "ID da task concluída"},
                "resumo":  {"type": "string", "description": "O que foi implementado"},
                "ic":      {"type": "string", "description": "Instruction Completeness (padrão: '1.0')"},
            },
            "required": ["task_id", "resumo"],
        },
    },
]

TOOL_HANDLERS = {
    "orq_send":     tool_send,
    "orq_receber":  tool_receber,
    "orq_status":   tool_status,
    "orq_delegar":  tool_delegar,
    "orq_reportar": tool_reportar,
}


# ── Loop MCP stdio ─────────────────────────────────────────────────────────

def respond(req_id, result):
    out = json.dumps({"jsonrpc": "2.0", "id": req_id, "result": result})
    sys.stdout.write(out + "\n")
    sys.stdout.flush()


def error(req_id, code, msg):
    out = json.dumps({"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": msg}})
    sys.stdout.write(out + "\n")
    sys.stdout.flush()


def main():
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            req = json.loads(raw)
        except json.JSONDecodeError:
            continue

        method = req.get("method", "")
        req_id = req.get("id")
        params = req.get("params", {})

        if method == "initialize":
            respond(req_id, {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "laadv-orchestrator", "version": "1.0.0"},
            })

        elif method == "notifications/initialized":
            pass  # sem resposta necessária

        elif method == "tools/list":
            respond(req_id, {"tools": TOOLS})

        elif method == "tools/call":
            name = params.get("name")
            args = params.get("arguments", {})
            handler = TOOL_HANDLERS.get(name)
            if handler:
                try:
                    result = handler(args)
                    respond(req_id, {
                        "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]
                    })
                except Exception as e:
                    error(req_id, -32603, str(e))
            else:
                error(req_id, -32601, f"Tool '{name}' não encontrada")

        elif method == "ping":
            respond(req_id, {})

        else:
            # Notificações sem id — ignorar silenciosamente
            if req_id is not None:
                error(req_id, -32601, f"Método '{method}' não implementado")


if __name__ == "__main__":
    main()

# AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: orchestrator

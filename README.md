# claude-code-tracker

> Real-time task tracker that syncs with Claude Code — visualize your project progress as you build, from PRD to deployment.

![demo](./assets/demo.gif)

---

## What it does

- Drag in a PRD, MVP doc, or Markdown file → tasks extracted automatically via Claude API
- Claude Code MCP integration → task progress auto-updates as you complete features
- Three views: Kanban board, Gantt chart, and progress dashboard
- Local JSON persistence — your tasks survive a browser refresh
- Zero npm dependencies — single `index.html`, runs anywhere

## Quick start
```bash
git clone https://github.com/yourname/claude-code-tracker
cd claude-code-tracker
open index.html   # or double-click
```

That's it. No build step, no server needed for the basic version.

## Claude Code sync (MCP)

This is the feature that makes claude-code-tracker different from every other kanban tool. When you work with Claude Code, task progress updates automatically.

### Step 1 — install the MCP server
```bash
cd claude-code-tracker
npm install
```

### Step 2 — add to Claude Desktop config

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):
```json
{
  "mcpServers": {
    "task-tracker": {
      "command": "node",
      "args": ["/absolute/path/to/claude-code-tracker/mcp/server.js"],
      "env": {
        "TRACKER_DATA": "/absolute/path/to/claude-code-tracker/data/tasks.json"
      }
    }
  }
}
```

### Step 3 — restart Claude Desktop

Claude Code now has access to three MCP tools:

| Tool | What it does |
|------|-------------|
| `update_task_progress` | Set a task's progress % and status |
| `list_tasks` | Read current task list into Claude's context |
| `add_task` | Create a new task from conversation |

Claude Code will call these automatically when it completes work. You can also prompt it directly: *"mark the API task as 80% complete"*.

## File parsing (Claude API)

Drag any of these into the tracker and Claude will extract tasks automatically:

- Markdown files (`.md`) — PRDs, specs, meeting notes
- Plain text (`.txt`)
- PDF documents *(requires `ANTHROPIC_API_KEY`)*
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Project structure
```
claude-code-tracker/
├── index.html          # entire frontend — no build step
├── mcp/
│   └── server.js       # MCP server (Node.js, ~80 lines)
├── data/
│   └── tasks.json      # local persistence (auto-created)
├── assets/
│   └── demo.gif        # add your own recording here
└── README.md
```

## Roadmap

- [x] Kanban + Gantt + progress dashboard
- [x] Drag-and-drop between columns
- [x] Priority levels and due dates
- [ ] Local JSON persistence
- [ ] MCP server — `update_task_progress`
- [ ] File drop parsing (Markdown, PDF)
- [ ] Claude API integration for task extraction
- [ ] Cloud sync + team accounts (v2)
- [ ] VS Code extension (v2)

## Contributing

Issues and PRs are welcome. The goal is to keep this tool small and focused — if you're using Claude Code, this should just work alongside it with minimal setup.

## License

MIT — use it, fork it, build on it.

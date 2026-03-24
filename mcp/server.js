#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');

const DATA_FILE = process.env.TRACKER_DATA
  || path.join(__dirname, '../data/tasks.json');

function loadTasks() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch { return []; }
}

function saveTasks(tasks) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

const TOOLS = {
  list_tasks: {
    description: 'Return all tasks with their current status and progress.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => loadTasks()
  },
  add_task: {
    description: 'Add a new task to the tracker.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title:    { type: 'string' },
        priority: { type: 'string', enum: ['high','medium','low'] },
        due:      { type: 'string' }
      }
    },
    handler: ({ title, priority = 'medium', due }) => {
      const tasks = loadTasks();
      const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
      const today = new Date().toISOString().slice(0, 10);
      const task = {
        id, title, priority, status: 'todo', progress: 0,
        start: today,
        due: due || new Date(Date.now() + 7*86400000).toISOString().slice(0,10)
      };
      tasks.push(task);
      saveTasks(tasks);
      return { ok: true, task };
    }
  },
  update_task_progress: {
    description: 'Update the progress (0-100) and status of a task.',
    inputSchema: {
      type: 'object',
      required: ['id', 'progress'],
      properties: {
        id:       { type: 'number' },
        progress: { type: 'number', minimum: 0, maximum: 100 },
        status:   { type: 'string', enum: ['todo','doing','done'] }
      }
    },
    handler: ({ id, progress, status }) => {
      const tasks = loadTasks();
      const task = tasks.find(t => t.id === id);
      if (!task) return { ok: false, error: `Task ${id} not found` };
      task.progress = progress;
      task.status = status ?? (progress === 100 ? 'done' : progress > 0 ? 'doing' : 'todo');
      saveTasks(tasks);
      return { ok: true, task };
    }
  }
};

process.stdin.setEncoding('utf8');
let buf = '';

process.stdin.on('data', chunk => {
  buf += chunk;
  const lines = buf.split('\n');
  buf = lines.pop();
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    try { handleMessage(JSON.parse(line)); }
    catch (e) { sendError(null, -32700, 'Parse error'); }
  });
});

function send(obj) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...obj }) + '\n');
}

function sendError(id, code, message) {
  send({ id, error: { code, message } });
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return send({ id, result: {
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'claude-code-tracker', version: '0.1.0' },
      capabilities: { tools: {} }
    }});
  }

  if (method === 'notifications/initialized') return;

  if (method === 'tools/list') {
    return send({ id, result: {
      tools: Object.entries(TOOLS).map(([name, t]) => ({
        name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    }});
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    const tool = TOOLS[name];
    if (!tool) return sendError(id, -32601, `Unknown tool: ${name}`);
    try {
      const result = tool.handler(args || {});
      return send({ id, result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }});
    } catch (e) {
      return sendError(id, -32603, e.message);
    }
  }

  if (method === 'ping') return send({ id, result: {} });

  sendError(id, -32601, `Unknown method: ${method}`);
}

process.stderr.write('claude-code-tracker MCP server ready\n')
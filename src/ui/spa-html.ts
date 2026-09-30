/**
 * Interface SPA Nativa do IdeaBank (HTML5/CSS3 Grid/Vanilla JS embutido).
 */
export function getIdeaBankSpaHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IdeaBank — Plataforma de Demandas de Software & Sincronização com GitHub</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #8b5cf6;
      --accent-hover: #7c3aed;
      --success: #10b981;
      --error: #ef4444;
      --warning: #f59e0b;
      --code-bg: #030712;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      line-height: 1.5;
    }
    header {
      background: var(--card-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      font-size: 24px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      padding: 6px 12px;
      border-radius: 8px;
    }
    .brand h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
    .brand span {
      font-size: 0.75rem;
      background: #1f2937;
      color: var(--text-muted);
      padding: 2px 8px;
      border-radius: 999px;
      margin-left: 6px;
    }
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .stats-bar {
      font-size: 0.85rem;
      color: var(--text-muted);
      background: rgba(255,255,255,0.03);
      padding: 6px 16px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
    }
    .stats-bar strong { color: var(--accent); }
    .btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .btn-secondary { background: #1f2937; color: var(--text); }
    .btn-secondary:hover { background: #374151; }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }

    main {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      padding: 24px 20px;
      flex: 1;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 16px 20px;
      border-radius: 10px;
    }
    .search-box { flex: 1; min-width: 240px; }
    .search-box input {
      width: 100%;
      background: #030712;
      border: 1px solid var(--card-border);
      padding: 9px 14px;
      border-radius: 6px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
    }
    .search-box input:focus { border-color: var(--accent); }
    .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn {
      background: #1f2937;
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 500;
    }
    .filter-btn.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
    .sort-select {
      background: #1f2937;
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      outline: none;
    }

    .ideas-feed { display: flex; flex-direction: column; gap: 16px; }
    .idea-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 20px;
      display: grid;
      grid-template-columns: 56px 1fr;
      gap: 16px;
      transition: border-color 0.15s ease;
    }
    .idea-card:hover { border-color: rgba(139, 92, 246, 0.4); }
    .vote-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
    }
    .vote-btn {
      background: #1f2937;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      width: 38px;
      height: 34px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .vote-btn:hover { background: #374151; color: #fff; }
    .vote-count {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 2px 0;
    }
    .idea-content { display: flex; flex-direction: column; gap: 8px; }
    .idea-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .badge-dev-tools { background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.4); }
    .badge-web { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-security { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-automation { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .badge-ai-applied { background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }
    
    .status-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: #1f2937;
      color: var(--text-muted);
    }
    .status-open { color: var(--success); }
    .status-in_progress { color: var(--warning); }
    .status-implemented { color: #60a5fa; }

    .idea-title { font-size: 1.15rem; font-weight: 700; color: #fff; }
    .idea-problem { font-size: 0.9rem; color: #d1d5db; line-height: 1.5; }
    .idea-solution {
      background: rgba(0,0,0,0.25);
      border-left: 3px solid var(--accent);
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 0.85rem;
      color: #9ca3af;
      margin-top: 4px;
    }
    .idea-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(31, 41, 55, 0.6);
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .idea-actions { display: flex; gap: 8px; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      width: 620px;
      max-width: 92vw;
      padding: 28px;
      box-shadow: 0 25px 30px -5px rgba(0,0,0,0.5);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      background: #030712;
      border: 1px solid var(--card-border);
      padding: 10px 12px;
      border-radius: 6px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
    }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--accent); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      padding: 14px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 250px;
      overflow-y: auto;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-icon">💡</div>
      <div>
        <h1>IdeaBank <span>Local-First</span></h1>
      </div>
    </div>
    <div class="header-actions">
      <div class="stats-bar" id="statsBar">
        Demandas: <strong id="statIdeas">0</strong> | Votos: <strong id="statVotes">0</strong>
      </div>
      <button class="btn" onclick="openCreateModal()">+ Nova Demanda</button>
    </div>
  </header>

  <main>
    <div class="toolbar">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Pesquisar problemas técnicos, ferramentas..." oninput="filterIdeas()">
      </div>
      <div class="filter-group">
        <button class="filter-btn active" onclick="setCategory('all', this)">Todas</button>
        <button class="filter-btn" onclick="setCategory('dev-tools', this)">DevTools</button>
        <button class="filter-btn" onclick="setCategory('web', this)">Web</button>
        <button class="filter-btn" onclick="setCategory('security', this)">Segurança</button>
        <button class="filter-btn" onclick="setCategory('automation', this)">Automação</button>
        <button class="filter-btn" onclick="setCategory('ai-applied', this)">IA</button>
      </div>
      <div>
        <select class="sort-select" id="sortSelect" onchange="fetchIdeas()">
          <option value="top">🔥 Mais Quentes (Gravidade)</option>
          <option value="new">🕒 Mais Recentes</option>
          <option value="wilson">⭐ Melhor Avaliadas (Wilson)</option>
        </select>
      </div>
    </div>

    <div class="ideas-feed" id="ideasFeed">
      <!-- Renderizado via JavaScript -->
    </div>
  </main>

  <!-- Modal Criação -->
  <div class="modal-backdrop" id="createModal" style="display: none;">
    <div class="modal">
      <div class="modal-title">✨ Registrar Nova Demanda de Software</div>
      <form id="createIdeaForm" onsubmit="handleCreateIdea(event)">
        <div class="form-group">
          <label>Título do Problema ou Ferramenta Faltante:</label>
          <input type="text" id="formTitle" required placeholder="Ex: CLI para validar schemas OpenAPI e gerar mocks locais">
        </div>
        <div class="form-group">
          <label>Categoria:</label>
          <select id="formCategory" required>
            <option value="dev-tools">DevTools (Ferramentas de Desenvolvimento)</option>
            <option value="web">Web (Aplicações e APIs)</option>
            <option value="security">Segurança & Privacidade</option>
            <option value="automation">Automação & Integrações</option>
            <option value="ai-applied">IA Aplicada & Local LLMs</option>
          </select>
        </div>
        <div class="form-group">
          <label>Descrição do Problema (A Dor Real):</label>
          <textarea id="formProblem" required placeholder="Descreva por que as ferramentas atuais falham ou o que causa fricção no dia a dia..."></textarea>
        </div>
        <div class="form-group">
          <label>Solução Proposta (O que o software deve fazer):</label>
          <textarea id="formSolution" required placeholder="Visão técnica resumida da arquitetura ou funcionalidade chave..."></textarea>
        </div>
        <div class="form-group">
          <label>Público-Alvo Beneficiado:</label>
          <input type="text" id="formAudience" required placeholder="Ex: Desenvolvedores Fullstack, Engenheiros de DevOps...">
        </div>
        <div class="form-group">
          <label>Seu Nome ou GitHub Username:</label>
          <input type="text" id="formAuthor" required placeholder="Ex: FelipeMadson">
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">Cancelar</button>
          <button type="submit" class="btn">Publicar Demanda</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Exportação GitHub -->
  <div class="modal-backdrop" id="exportModal" style="display: none;">
    <div class="modal">
      <div class="modal-title">🐙 Exportar Especificação para GitHub Issue</div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
        Esta especificação formatada em Markdown pode ser criada instantaneamente em qualquer repositório GitHub com 1 clique:
      </p>
      <div class="form-group">
        <label>Repositório de Destino:</label>
        <input type="text" id="exportRepoInput" value="FelipeMadson/ideabank" oninput="updateExportUrls()">
      </div>
      <div class="form-group">
        <label>Especificação Técnica em Markdown:</label>
        <pre id="exportMarkdownView"></pre>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="copyExportMarkdown()">📋 Copiar Markdown</button>
        <a class="btn" id="btnOpenGitHub" href="#" target="_blank" rel="noopener">🚀 Criar Issue no GitHub (1-Click)</a>
        <button class="btn btn-secondary" onclick="closeExportModal()">Fechar</button>
      </div>
    </div>
  </div>

  <script>
    let currentCategory = 'all';
    let allIdeas = [];
    let activeExportIdea = null;

    async function fetchIdeas() {
      const sort = document.getElementById('sortSelect').value;
      try {
        const res = await fetch(\`/api/ideas?sort=\${sort}&category=\${currentCategory}\`);
        allIdeas = await res.json();
        renderIdeas(allIdeas);
        fetchStats();
      } catch (err) {
        console.error('Falha ao carregar ideias', err);
      }
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const s = await res.json();
        document.getElementById('statIdeas').innerText = s.totalIdeas || 0;
        document.getElementById('statVotes').innerText = s.totalVotes || 0;
      } catch {}
    }

    function renderIdeas(ideas) {
      const feed = document.getElementById('ideasFeed');
      feed.innerHTML = '';
      if (ideas.length === 0) {
        feed.innerHTML = '<div style="text-align:center; padding:48px; color:var(--text-muted);">Nenhuma demanda encontrada nesta categoria. Seja o primeiro a cadastrar!</div>';
        return;
      }

      ideas.forEach(idea => {
        const netVotes = idea.upvotes - idea.downvotes;
        const card = document.createElement('div');
        card.className = 'idea-card';
        card.innerHTML = \`
          <div class="vote-col">
            <button class="vote-btn" onclick="castVote('\${idea.id}', 1)" title="Voto positivo">▲</button>
            <span class="vote-count" id="vote_\${idea.id}">\${netVotes}</span>
            <button class="vote-btn" onclick="castVote('\${idea.id}', -1)" title="Voto negativo">▼</button>
          </div>
          <div class="idea-content">
            <div class="idea-meta">
              <span class="badge badge-\${idea.category}">\${idea.category}</span>
              <span class="status-badge status-\${idea.status}">\${idea.status.toUpperCase()}</span>
              <span style="font-size:0.75rem; color:var(--text-muted);">Score Gravidade: \${idea.gravity_score.toFixed(2)}</span>
            </div>
            <div class="idea-title">\${escapeHtml(idea.title)}</div>
            <div class="idea-problem">\${escapeHtml(idea.problem_statement)}</div>
            <div class="idea-solution">
              <strong>Solução Proposta:</strong> \${escapeHtml(idea.proposed_solution)}
            </div>
            <div class="idea-footer">
              <div>
                Por <strong>@\${escapeHtml(idea.author_name)}</strong> &bull; Público: <em>\${escapeHtml(idea.target_audience)}</em>
              </div>
              <div class="idea-actions">
                <button class="btn btn-secondary btn-sm" onclick="openExportModal('\${idea.id}')">🐙 Exportar Issue</button>
              </div>
            </div>
          </div>
        \`;
        feed.appendChild(card);
      });
    }

    async function castVote(ideaId, voteType) {
      try {
        const res = await fetch(\`/api/ideas/\${ideaId}/vote\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById(\`vote_\${ideaId}\`).innerText = data.netVotes;
        } else if (data.reason) {
          alert(data.reason);
        }
      } catch (err) {
        console.error('Falha ao votar', err);
      }
    }

    function setCategory(cat, el) {
      currentCategory = cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      fetchIdeas();
    }

    function filterIdeas() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const filtered = allIdeas.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.problem_statement.toLowerCase().includes(q) ||
        i.proposed_solution.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
      renderIdeas(filtered);
    }

    function openCreateModal() { document.getElementById('createModal').style.display = 'flex'; }
    function closeCreateModal() { document.getElementById('createModal').style.display = 'none'; }

    async function handleCreateIdea(e) {
      e.preventDefault();
      const body = {
        title: document.getElementById('formTitle').value,
        category: document.getElementById('formCategory').value,
        problem_statement: document.getElementById('formProblem').value,
        proposed_solution: document.getElementById('formSolution').value,
        target_audience: document.getElementById('formAudience').value,
        author_name: document.getElementById('formAuthor').value
      };

      try {
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          closeCreateModal();
          document.getElementById('createIdeaForm').reset();
          fetchIdeas();
        } else {
          alert('Erro ao registrar ideia');
        }
      } catch (err) {
        alert('Falha de rede: ' + err.message);
      }
    }

    async function openExportModal(ideaId) {
      const idea = allIdeas.find(i => i.id === ideaId);
      if (!idea) return;
      activeExportIdea = idea;

      const repo = document.getElementById('exportRepoInput').value;
      const res = await fetch(\`/api/ideas/\${ideaId}/export-issue?repo=\${encodeURIComponent(repo)}\`);
      const exportData = await res.json();

      document.getElementById('exportMarkdownView').innerText = exportData.markdownBody;
      document.getElementById('btnOpenGitHub').href = exportData.oneClickUrl;
      document.getElementById('exportModal').style.display = 'flex';
    }

    function closeExportModal() { document.getElementById('exportModal').style.display = 'none'; }

    async function updateExportUrls() {
      if (!activeExportIdea) return;
      const repo = document.getElementById('exportRepoInput').value;
      const res = await fetch(\`/api/ideas/\${activeExportIdea.id}/export-issue?repo=\${encodeURIComponent(repo)}\`);
      const exportData = await res.json();
      document.getElementById('btnOpenGitHub').href = exportData.oneClickUrl;
    }

    function copyExportMarkdown() {
      const text = document.getElementById('exportMarkdownView').innerText;
      navigator.clipboard.writeText(text);
      alert('Markdown copiado para a área de transferência!');
    }

    function escapeHtml(str) {
      return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    // Inicialização
    fetchIdeas();
  </script>
</body>
</html>`;
}

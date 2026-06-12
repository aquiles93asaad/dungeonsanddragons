/* ── HISTORIA / STORY ── */

async function loadStory() {
  const el = document.getElementById('page-story');
  if (!el) return;

  try {
    const res  = await fetch('/api/story');
    const data = await res.json();           // { chapters: [...], acts: [...] }
    renderStory(data.chapters, data.acts, el);
  } catch (e) {
    console.error('Error cargando historia:', e);
    el.innerHTML += '<p class="muted" style="padding:1rem">Error al cargar la historia.</p>';
  }
}

function renderStory(chapters, acts, el) {
  // Agrupar actos por número de capítulo
  const byChapter = {};
  acts.forEach(a => {
    if (!byChapter[a.chapter]) byChapter[a.chapter] = [];
    byChapter[a.chapter].push(a);
  });

  // Ordenar actos dentro de cada capítulo
  Object.values(byChapter).forEach(arr => arr.sort((a, b) => a.order - b.order));

  let html = '';

  chapters.forEach(ch => {
    const chActs = byChapter[ch.number] || [];
    if (!chActs.length) return;

    const chTitle = ch.title
      ? `<h2 class="story-chapter-title">Capítulo ${ch.number} — ${ch.title}</h2>`
      : `<h2 class="story-chapter-title">Crónica — Capítulo ${ch.number}</h2>`;

    const subtitle = ch.number === 1
      ? '<p class="page-subtitle muted">Reconstruida a partir de lo jugado en mesa</p>'
      : '';

    const actsHtml = chActs.map(act => {
      const bodyHtml = (act.body || [])
        .map(p => `<p>${p}</p>`)
        .join('');

      const highlightHtml = act.highlight
        ? `<div class="act-note">${act.highlight}</div>`
        : '';

      return `
        <div class="timeline-act">
          <div class="timeline-dot"></div>
          <div class="act-title">${act.title}</div>
          <div class="act-body">
            ${bodyHtml}
            ${highlightHtml}
          </div>
        </div>`;
    }).join('');

    html += `
      ${chTitle}
      ${subtitle}
      <div class="timeline">
        ${actsHtml}
      </div>`;
  });

  el.innerHTML = html;
}

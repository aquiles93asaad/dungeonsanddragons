/* ── ABILITIES & SPELLS: render bilingüe + resources + long/short rest ── */

function fmtMod(m){ return (m>=0?'+':'')+m; }

function getCharSaveBonus(c, ability){
  const scores = ABILITY_SCORES[c];
  const preset = CLASS_PRESETS[c];
  const mod = abilityMod(scores[ability]);
  const prof = preset.saveProfs.includes(ability) ? getCharProfBonus(c) : 0;
  return mod + prof;
}

function getCharSkillBonus(c, skill){
  const scores = ABILITY_SCORES[c];
  return abilityMod(scores[skill.ability]) + getCharProfBonus(c);
}

/* ── SPELL SLOTS (dinámico por nivel) ── */
function loadSlotState(c, level){
  const slots = getSpellSlotsForLevel(c);
  const max = slots[level] || 0;
  const used = load('slots_'+c+'_'+level, 0);
  return { max, used: Math.min(used, max) };
}

/* Nivel máximo de hechizo que el personaje puede castear */
function getMaxSpellLevel(c){
  const slots = getSpellSlotsForLevel(c);
  const keys = Object.keys(slots).map(Number);
  return keys.length ? Math.max(...keys) : 0;
}

/* Helper: mantiene CHAR_STATE sincronizado para que syncCharState() lea valores frescos */
function _patchCharState(c, patch){
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  Object.assign(window.CHAR_STATE[c], patch);
}

function _patchCharStateSlot(c, level, newUsed){
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  if(!window.CHAR_STATE[c].slots) window.CHAR_STATE[c].slots = {};
  window.CHAR_STATE[c].slots[String(level)] = newUsed;
}

function _patchCharStateResource(c, key, newVal){
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  if(!window.CHAR_STATE[c].resources) window.CHAR_STATE[c].resources = {};
  window.CHAR_STATE[c].resources[key] = newVal;
}

function toggleSpellSlot(c, level, idx){
  const state = loadSlotState(c, level);
  const newUsed = idx < state.used ? state.used - 1 : state.used + 1;
  _patchCharStateSlot(c, level, newUsed);
  save('slots_'+c+'_'+level, newUsed);
  renderCharAbilities(c);
}

/* Consume slot programáticamente (lo usará Sesión Live) */
function consumeSpellSlot(c, level){
  const state = loadSlotState(c, level);
  if(state.used >= state.max) return false;
  const newUsed = state.used + 1;
  _patchCharStateSlot(c, level, newUsed);
  save('slots_'+c+'_'+level, newUsed);
  renderCharAbilities(c);
  return true;
}

/* ── RESOURCES (Rage, Ki, Lay on Hands, Wild Shape, etc.) — MAX dinámico ── */
function loadResourceState(c, r){
  const max = getResourceMax(c, r.key);
  if(r.kind === 'pool'){
    const current = load('resource_'+c+'_'+r.key, max);
    return { current: Math.max(0, Math.min(max, current)), max };
  } else {
    const used = load('resource_'+c+'_'+r.key, 0);
    return { used: Math.max(0, Math.min(max, used)), max };
  }
}

function toggleResourceUse(c, key, idx){
  const r = (CLASS_PRESETS[c].resources||[]).find(x=>x.key===key);
  if(!r) return;
  const state = loadResourceState(c, r);
  const newUsed = Math.max(0, Math.min(r.max, idx < state.used ? state.used - 1 : state.used + 1));
  _patchCharStateResource(c, key, newUsed);
  save('resource_'+c+'_'+key, newUsed);
  renderCharAbilities(c);
}

function changeResourcePool(c, key, delta){
  const r = (CLASS_PRESETS[c].resources||[]).find(x=>x.key===key);
  if(!r || r.kind !== 'pool') return;
  const state = loadResourceState(c, r);
  const next = Math.max(0, Math.min(r.max, state.current + delta));
  _patchCharStateResource(c, key, next);
  save('resource_'+c+'_'+key, next);
  renderCharAbilities(c);
}

function setResourcePool(c, key, val){
  const r = (CLASS_PRESETS[c].resources||[]).find(x=>x.key===key);
  if(!r || r.kind !== 'pool') return;
  const next = Math.max(0, Math.min(r.max, parseInt(val)||0));
  _patchCharStateResource(c, key, next);
  save('resource_'+c+'_'+key, next);
  renderCharAbilities(c);
}

/* ── LEVEL UP ── */
/* Sube un nivel sin diálogos: nivel, HP máx (promedio del dado + CON) y HP actual por el mismo delta.
   La usan el botón de la hoja y el "Subir nivel grupal" de la Sesión Live. */
function applyLevelUp(c){
  const spellLevelBefore = getMaxSpellLevel(c), prepBefore = getPreparedLimit(c);
  const oldLevel = getCharLevel(c);
  const newLevel = oldLevel + 1;
  const hpGain = hpGainOnLevelUp(c);
  const oldMax = getHPMax(c);
  const newMax = oldMax + hpGain;
  // HP actual sube por el mismo delta (queda al mismo daño)
  const newCurHP = Math.min(newMax, load('hp_'+c, oldMax) + hpGain);

  save('char_level_'+c, newLevel);
  save('hp_max_'+c, newMax);
  save('hp_'+c, newCurHP);

  // DOM de HP en la hoja: input max + span max + value
  const inp = document.getElementById(c+'-hp');
  const spanMax = document.getElementById(c+'-hp-max');
  if(inp){ inp.max = newMax; inp.value = newCurHP; }
  if(spanMax) spanMax.textContent = newMax;
  if(inp) updateHP(c); // recalcula la barra y guarda

  // Línea de clase ("Nivel N")
  const classEl = document.querySelector(`#char-${c} .char-class`);
  if(classEl) classEl.textContent = classEl.textContent.replace(/Nivel \d+/, 'Nivel '+newLevel);

  // Re-render de abilities (prof bonus, saves, skills, slots, panel de mejoras)
  renderCharAbilities(c);
  return { oldLevel, newLevel, hpGain, oldMax, newMax, asi: ASI_LEVELS.includes(newLevel),
    spellLevelBefore, spellLevelAfter: getMaxSpellLevel(c), prepBefore, prepAfter: getPreparedLimit(c) };
}

function levelUpCharacter(c){
  const oldLevel = getCharLevel(c);
  const newLevel = oldLevel + 1;
  if(newLevel > 20){ alert('Ya está en nivel 20 (máximo).'); return; }

  const preset = CLASS_PRESETS[c];
  const die = HIT_DIE_BY_CHAR[c];
  const conMod = abilityMod(ABILITY_SCORES[c].con);
  const hpGain = hpGainOnLevelUp(c);
  const oldProf = getCharProfBonus(c);
  const newProf = 2 + Math.floor((newLevel-1)/4);
  const profChange = newProf > oldProf;
  const oldMax = getHPMax(c);
  const charLabel = c.charAt(0).toUpperCase()+c.slice(1);
  const className = preset.className;

  const confirmMsg = [
    `¿Subir a ${charLabel} a Nivel ${newLevel}?`,
    '',
    `HP máximo: ${oldMax} → ${oldMax + hpGain} (+${hpGain})`,
    `  · ${className}: 1d${die} promedio = ${hitDieAvg(die)}`,
    `  · CON mod: ${conMod>=0?'+':''}${conMod}`,
    profChange ? `Proficiency bonus: +${oldProf} → +${newProf}` : `Proficiency bonus: +${oldProf} (sin cambios)`,
    ASI_LEVELS.includes(newLevel) ? `\n⬆ Nv ${newLevel} trae una Mejora de característica (o dote): se elige después, en la hoja.` : ''
  ].filter(Boolean).join('\n');

  if(!confirm(confirmMsg)) return;
  const r = applyLevelUp(c);

  // Aviso de cosas para revisar manualmente
  const hints = [`${charLabel} ahora es ${className} Nivel ${newLevel}.`, ''];
  if(profChange) hints.push(`✓ Proficiency bonus subió a +${newProf}.`);
  if(ASI_LEVELS.includes(newLevel)) hints.push('• ⬆ Mejora de característica pendiente: +2 a una, +1 a dos, o una dote — elegila en la hoja, debajo de los atributos.');
  if(r.spellLevelAfter > r.spellLevelBefore) hints.push(`• ✨ Desbloquea hechizos de Nv ${r.spellLevelAfter}.`);
  if(r.prepAfter != null && r.prepAfter > r.prepBefore) hints.push(`• Puede preparar ${r.prepAfter} hechizos (antes ${r.prepBefore}) — marcalos con ○ en la hoja.`);
  if(c==='tyrell' && newLevel===6) hints.push('• Paladín: Aura of Protection (+CHA a los saves propios y de aliados a 10 ft).');
  if(c==='tyrell' && newLevel===3) hints.push('• Paladín: Sacred Oath (subclass). Divine Health. Channel Divinity.');
  if(c==='rac' && newLevel===3) hints.push('• Bárbaro: Primal Path (subclass: Berserker, Totem, etc.).');
  if(c==='relyo' && newLevel===3) hints.push('• Monje: Monastic Tradition (subclass). Deflect Missiles.');
  if(c==='boyd' && newLevel===3) hints.push('• Druida: 2nd-level spells unlocked. Circle de Bosque suma hechizos.');
  if(c==='esdas' && newLevel===3) hints.push('• Wizard: 2nd-level spells unlocked. +2 hechizos al spellbook (gratis).');
  if([5,11,17].includes(newLevel)) hints.push('• Cantrips de daño suben un dado (a menos que Esdas siga sin escuela elegida).');
  if(newLevel===5){
    if(c==='rac') hints.push('• Bárbaro: Extra Attack. Fast Movement. Rage uses = 4.');
    if(c==='relyo') hints.push('• Monje: Extra Attack. Stunning Strike. Ki = 5.');
    if(c==='tyrell') hints.push('• Paladín: Extra Attack. 2nd-level spell slots.');
    if(c==='boyd') hints.push('• Druida: 3rd-level spell slots.');
    if(c==='esdas') hints.push('• Wizard: 3rd-level spell slots.');
  }
  setTimeout(()=>alert(hints.join('\n')), 100);
}

/* ── CARACTERÍSTICAS Y MEJORAS (ASI) ──
   Los atributos, la CA y la iniciativa de la hoja se pintan desde los datos (antes eran HTML fijo).
   Mejoras pendientes = niveles de ASI alcanzados − mejoras registradas en el historial (asi_<c>).
   El historial guarda { kind:'asi'|'feat'|'skip'|'manual', level, changes, feat, featDesc, at };
   las ediciones manuales del DM ('manual') no consumen mejoras. */
const ABILITY_KEYS = ['str','dex','con','int','wis','cha'];
const ASI_LEVELS = [4, 8, 12, 16, 19];   // 5E: Bárbaro, Monje, Paladín, Druida y Wizard
const ASI_FORM = {};       // picker abierto por personaje (estado de UI, no se guarda)
const SCORES_EDIT = {};    // edición manual abierta por personaje

function getASIState(c){
  const cs = window.CHAR_STATE && window.CHAR_STATE[c];
  const st = (cs && cs.asi) || load('asi_'+c, null) || {};
  return { history: Array.isArray(st.history) ? st.history : [] };
}
function usedASIs(c){ return getASIState(c).history.filter(h => h.kind !== 'manual').length; }
function getPendingASI(c){
  const earned = ASI_LEVELS.filter(l => l <= getCharLevel(c)).length;
  return Math.max(0, earned - usedASIs(c));
}
/* Nivel de la mejora que se está eligiendo (la primera sin resolver) */
function nextASILevel(c){ return ASI_LEVELS[usedASIs(c)] || getCharLevel(c); }

function getASIForm(c){
  if(!ASI_FORM[c]) ASI_FORM[c] = { mode:'plus2', a:'', b:'', feat:'', featAbility:'', featDesc:'', allowOver20:false };
  return ASI_FORM[c];
}
function setASIForm(c, field, value, keepFocus){
  const f = getASIForm(c);
  f[field] = value;
  if(field === 'mode'){ f.a = ''; f.b = ''; f.featAbility = ''; }
  if(keepFocus){
    const el = document.getElementById('asi-preview-'+c);
    if(el) el.innerHTML = renderASIPreview(c);
  } else renderCharStats(c);
}
/* Cambios de atributos que propone el picker: {dex:2} · {dex:1, wis:1} · dote {cha:1} o {} */
function asiChanges(c){
  const f = getASIForm(c);
  if(f.mode === 'feat') return f.featAbility ? { [f.featAbility]: 1 } : {};
  if(f.mode === 'split') return (f.a && f.b && f.a !== f.b) ? { [f.a]: 1, [f.b]: 1 } : null;
  return f.a ? { [f.a]: 2 } : null;
}
function scoresWith(c, changes){
  const next = Object.assign({}, getAbilityScores(c));
  Object.entries(changes || {}).forEach(([k, v]) => { next[k] = (next[k] || 10) + v; });
  return next;
}

/* Cambia los atributos y propaga lo que no se recalcula solo:
   si cambia el mod de CON, el HP máx cambia retroactivamente (± 1 por nivel) y el HP actual igual.
   CA, iniciativa, saves, skills, ataques y DC de hechizos se derivan de los atributos. */
function setAbilityScores(c, newScores){
  const old = getAbilityScores(c);
  const level = getCharLevel(c);
  const conDelta = abilityMod(newScores.con) - abilityMod(old.con);
  save('ability_scores_'+c, newScores);
  if(conDelta){
    const newMax = Math.max(1, getHPMax(c) + conDelta * level);
    const next = Math.max(0, Math.min(newMax, load('hp_'+c, getHPMax(c)) + conDelta * level));
    save('hp_max_'+c, newMax);
    save('hp_'+c, next);
    const inp = document.getElementById(c+'-hp');
    const spanMax = document.getElementById(c+'-hp-max');
    if(inp){ inp.max = newMax; inp.value = next; updateHP(c); }
    if(spanMax) spanMax.textContent = newMax;
  }
  if(typeof updateOverview === 'function') updateOverview();
  return { conDelta, hpDelta: conDelta * level };
}

function applyASI(c){
  const f = getASIForm(c);
  const changes = asiChanges(c);
  if(f.mode === 'feat' && !f.feat.trim()){ alert('Escribí el nombre de la dote.'); return; }
  if(f.mode !== 'feat' && !changes){ alert(f.mode === 'split' ? 'Elegí dos atributos distintos.' : 'Elegí el atributo.'); return; }
  const next = scoresWith(c, changes);
  const over = Object.keys(changes).filter(k => next[k] > 20);
  if(over.length && !f.allowOver20){ alert(`${over.map(k=>k.toUpperCase()).join(', ')} quedaría en más de 20 (el máximo por reglas). Marcá "Permitir superar 20" si es decisión del DM.`); return; }
  const level = nextASILevel(c);
  setAbilityScores(c, next);
  const history = getASIState(c).history.concat([{
    kind: f.mode === 'feat' ? 'feat' : 'asi', level, changes,
    feat: f.mode === 'feat' ? f.feat.trim() : '', featDesc: f.mode === 'feat' ? (f.featDesc||'').trim() : '',
    at: new Date().toISOString()
  }]);
  save('asi_'+c, { history });
  delete ASI_FORM[c];
  renderCharAbilities(c);
}

/* La mejora ya se aplicó a mano o se decidió no tomarla: se registra sin tocar atributos */
function resolveASIWithoutChanges(c){
  if(!confirm('¿Marcar esta mejora como resuelta sin cambiar atributos? (ej: ya se aplicó a mano o el DM decidió otra cosa)')) return;
  const history = getASIState(c).history.concat([{ kind:'skip', level: nextASILevel(c), changes:{}, at: new Date().toISOString() }]);
  save('asi_'+c, { history });
  delete ASI_FORM[c];
  renderCharAbilities(c);
}

/* Edición libre del DM (bonus narrativos, correcciones). No consume mejoras pendientes. */
function openScoresEditor(c){ SCORES_EDIT[c] = Object.assign({}, getAbilityScores(c)); renderCharStats(c); }
function closeScoresEditor(c){ delete SCORES_EDIT[c]; renderCharStats(c); }
function setScoreDraft(c, k, v){ if(SCORES_EDIT[c]) SCORES_EDIT[c][k] = parseInt(v); }
function saveManualScores(c){
  const draft = SCORES_EDIT[c]; if(!draft) return;
  const bad = ABILITY_KEYS.filter(k => !(draft[k] >= 1 && draft[k] <= 30));
  if(bad.length){ alert(`Valores inválidos en ${bad.map(k=>k.toUpperCase()).join(', ')} (1-30).`); return; }
  const old = getAbilityScores(c);
  const changes = {};
  ABILITY_KEYS.forEach(k => { if(draft[k] !== old[k]) changes[k] = draft[k] - old[k]; });
  if(Object.keys(changes).length){
    setAbilityScores(c, Object.assign({}, old, draft));
    const history = getASIState(c).history.concat([{ kind:'manual', level: getCharLevel(c), changes, at: new Date().toISOString() }]);
    save('asi_'+c, { history });
  }
  delete SCORES_EDIT[c];
  renderCharAbilities(c);
}

function asiHistoryLabel(h){
  const ch = Object.entries(h.changes||{}).map(([k,v]) => `${v>0?'+':''}${v} ${k.toUpperCase()}`).join(', ');
  if(h.kind === 'feat') return `Nv ${h.level}: dote ${h.feat}${ch ? ` (${ch})` : ''}`;
  if(h.kind === 'skip') return `Nv ${h.level}: resuelta fuera de la app`;
  if(h.kind === 'manual') return `✎ DM (Nv ${h.level}): ${ch}`;
  return `Nv ${h.level}: ${ch}`;
}

/* Qué cambia si se aplica lo elegido: atributos, CA, HP máx, iniciativa, DC de hechizos */
function renderASIPreview(c){
  const changes = asiChanges(c);
  if(!changes || !Object.keys(changes).length){
    return getASIForm(c).mode === 'feat'
      ? '<span class="muted">La dote se registra en el historial; si da +1 a un atributo, elegilo arriba. Sus otros efectos se aplican a mano.</span>'
      : '<span class="muted">Elegí cómo repartir la mejora.</span>';
  }
  const old = getAbilityScores(c), next = scoresWith(c, changes);
  const lines = Object.keys(changes).map(k => {
    const om = abilityMod(old[k]), nm = abilityMod(next[k]);
    return `<div>${k.toUpperCase()} ${old[k]} → <strong>${next[k]}</strong>${nm !== om ? ` (mod ${fmtMod(om)} → <strong>${fmtMod(nm)}</strong>)` : ' (mismo modificador)'}${next[k] > 20 ? ' <span class="form-warn">supera 20</span>' : ''}</div>`;
  });
  const effects = [];
  const oldAC = getCharAC(c, old), newAC = getCharAC(c, next);
  if(newAC !== oldAC) effects.push(`CA ${oldAC} → ${newAC}`);
  const conD = abilityMod(next.con) - abilityMod(old.con);
  if(conD) effects.push(`HP máx ${conD>0?'+':''}${conD * getCharLevel(c)} (CON retroactivo, ${getCharLevel(c)} niveles)`);
  if(abilityMod(next.dex) !== abilityMod(old.dex)) effects.push(`Iniciativa ${fmtMod(abilityMod(old.dex))} → ${fmtMod(abilityMod(next.dex))}`);
  const sc = SPELLCASTING_STAT[c];
  if(sc && ['tyrell','boyd','esdas'].includes(c) && abilityMod(next[sc]) !== abilityMod(old[sc])){
    const prof = getCharProfBonus(c);
    effects.push(`DC de hechizos ${8+prof+abilityMod(old[sc])} → ${8+prof+abilityMod(next[sc])}`);
  }
  return lines.join('') + (effects.length ? `<div class="asi-effects">${effects.join(' · ')}</div>` : '') +
    '<div class="muted" style="font-size:0.75rem">Saves, skills y ataques se recalculan solos.</div>';
}

function renderASIPicker(c, pending){
  const f = getASIForm(c);
  const scores = getAbilityScores(c);
  const opt = (sel, exclude) => '<option value="">— atributo —</option>' +
    ABILITY_KEYS.map(k => `<option value="${k}" ${sel===k?'selected':''} ${exclude===k?'disabled':''}>${k.toUpperCase()} (${scores[k]})</option>`).join('');
  const modeBtn = (m, label) => `<button type="button" class="asi-mode${f.mode===m?' on':''}" onclick="setASIForm('${c}','mode','${m}')">${label}</button>`;
  let fields;
  if(f.mode === 'plus2'){
    fields = `<select class="form-input" onchange="setASIForm('${c}','a',this.value)">${opt(f.a)}</select>`;
  } else if(f.mode === 'split'){
    fields = `<select class="form-input" onchange="setASIForm('${c}','a',this.value)">${opt(f.a, f.b)}</select>
      <select class="form-input" onchange="setASIForm('${c}','b',this.value)">${opt(f.b, f.a)}</select>`;
  } else {
    fields = `<input class="form-input" placeholder="Dote (ej: Tough, War Caster, Alert)" value="${(f.feat||'').replace(/"/g,'&quot;')}" oninput="setASIForm('${c}','feat',this.value,true)">
      <select class="form-input" onchange="setASIForm('${c}','featAbility',this.value)" title="Medias dotes: +1 a un atributo">${opt(f.featAbility).replace('— atributo —','+1 a un atributo (opcional)')}</select>
      <textarea class="form-input asi-feat-desc" placeholder="Qué hace (queda en el historial)" oninput="setASIForm('${c}','featDesc',this.value,true)">${(f.featDesc||'').replace(/</g,'&lt;')}</textarea>`;
  }
  return `<div class="asi-title">⬆ Mejora de característica · Nv ${nextASILevel(c)}${pending > 1 ? ` <span class="muted">(${pending} pendientes)</span>` : ''}</div>
    <div class="asi-modes">${modeBtn('plus2','+2 a uno')}${modeBtn('split','+1 a dos')}${modeBtn('feat','Dote')}</div>
    <div class="asi-fields">${fields}</div>
    <div class="asi-preview" id="asi-preview-${c}">${renderASIPreview(c)}</div>
    <div class="asi-btns">
      <label class="asi-over20"><input type="checkbox" ${f.allowOver20?'checked':''} onchange="setASIForm('${c}','allowOver20',this.checked)"> Permitir superar 20 (DM)</label>
      <button class="btn-small" onclick="resolveASIWithoutChanges('${c}')" title="Ya se aplicó a mano o el DM decidió otra cosa">Resuelta sin cambios</button>
      <button class="btn-rest btn-levelup" onclick="applyASI('${c}')">Aplicar</button>
    </div>`;
}

function renderScoresEditor(c){
  const draft = SCORES_EDIT[c];
  return `<div class="asi-box dm-only">
    <div class="asi-title">✎ Editar características <span class="muted">(bonus narrativos, correcciones — no usa mejoras pendientes)</span></div>
    <div class="asi-edit-grid">${ABILITY_KEYS.map(k => `<label>${k.toUpperCase()}<input class="form-input" type="number" min="1" max="30" value="${draft[k]}" oninput="setScoreDraft('${c}','${k}',this.value)"></label>`).join('')}</div>
    <div class="asi-btns"><button class="btn-small" onclick="closeScoresEditor('${c}')">Cancelar</button><button class="btn-rest btn-levelup" onclick="saveManualScores('${c}')">Guardar</button></div>
  </div>`;
}

function renderASIPanel(c){
  const pending = getPendingASI(c);
  const history = getASIState(c).history;
  const parts = [];
  if(pending > 0){
    parts.push(`<div class="asi-pending player-only">⬆ Mejora de característica pendiente (Nv ${nextASILevel(c)}) — elegila con el DM.</div>`);
    parts.push(`<div class="asi-box dm-only">${renderASIPicker(c, pending)}</div>`);
  }
  if(SCORES_EDIT[c]) parts.push(renderScoresEditor(c));
  if(history.length) parts.push(`<div class="asi-history">Mejoras: ${history.map(h => `<span title="${(h.featDesc||'').replace(/"/g,'&quot;')}">${asiHistoryLabel(h)}</span>`).join(' · ')}</div>`);
  if(!SCORES_EDIT[c]) parts.push(`<div class="asi-actions dm-only"><button class="asi-edit-link" onclick="openScoresEditor('${c}')">✎ Editar características</button></div>`);
  return parts.join('');
}

/* Pinta atributos, CA e iniciativa de la hoja desde los datos + el panel de mejoras debajo de la grilla */
function renderCharStats(c){
  const sheet = document.getElementById('char-'+c);
  if(!sheet) return;
  const scores = getAbilityScores(c);
  const grid = sheet.querySelector('.stats-grid');
  if(grid){
    grid.innerHTML = ABILITY_KEYS.map(k =>
      `<div class="stat-box"><span class="stat-name">${k.toUpperCase()}</span><span class="stat-score">${scores[k]}</span><span class="stat-mod">${fmtMod(abilityMod(scores[k]))}</span></div>`).join('');
  }
  sheet.querySelectorAll('.vital-box').forEach(box => {
    const label = ((box.querySelector('.vital-label')||{}).textContent || '').trim();
    const span = box.querySelector('.vital-controls > span');
    if(!span) return;
    if(/^AC/.test(label)) span.textContent = getCharAC(c);
    else if(/^Iniciativa/.test(label)) span.innerHTML = span.innerHTML.replace(/^[+-]\d+/, fmtMod(abilityMod(scores.dex)));
  });
  let panel = document.getElementById('asi-'+c);
  if(!panel && grid){
    panel = document.createElement('div');
    panel.id = 'asi-'+c;
    panel.className = 'asi-panel';
    grid.insertAdjacentElement('afterend', panel);
  }
  if(panel) panel.innerHTML = renderASIPanel(c);
}

/* ── REST ── */
function longRest(c){
  if(!confirm('¿Long rest? Restaura HP máximo, slots de hechizo, Rage/Ki/Lay on Hands/Wild Shape, y todos los recursos diarios.')) return;
  const preset = CLASS_PRESETS[c];
  // HP
  const inp = document.getElementById(c+'-hp');
  if(inp){ inp.value = getHPMax(c); updateHP(c); }
  // Slots → patch CHAR_STATE + localStorage. Todos los niveles según el nivel de personaje
  // (preset.spellSlots solo trae los de Nv 1: los slots de Nv 2+ nunca se recuperaban).
  const newSlots = {};
  Object.keys(getSpellSlotsForLevel(c)).forEach(level => {
    newSlots[level] = 0;
    save('slots_'+c+'_'+level, 0);
  });
  _patchCharState(c, { slots: newSlots });
  // Resources → patch CHAR_STATE + localStorage
  const newResources = {};
  (preset.resources||[]).forEach(r=>{
    const val = r.kind === 'pool' ? r.max : 0;
    newResources[r.key] = val;
    save('resource_'+c+'_'+r.key, val);
  });
  _patchCharState(c, { resources: newResources });
  renderCharAbilities(c);
}

function shortRest(c){
  if(!confirm('¿Short rest? Restaura solo los recursos que recargan en short rest (Ki, Wild Shape).')) return;
  const preset = CLASS_PRESETS[c];
  (preset.resources||[]).forEach(r=>{
    if(r.restoresOn === 'short'){
      const val = r.kind === 'pool' ? r.max : 0;
      _patchCharStateResource(c, r.key, val);
      save('resource_'+c+'_'+r.key, val);
    }
  });
  renderCharAbilities(c);
}

/* ── PREPARED SPELLS ── */
function toggleSpellPrepared(c, spellName){
  const prepared = load('prepared_'+c, null);
  let list;
  if(prepared === null){
    list = (CLASS_PRESETS[c].spellList||[]).filter(s=>s.prepared).map(s=>s.name);
  } else {
    list = prepared;
  }
  if(list.includes(spellName)){
    list = list.filter(n=>n!==spellName);
  } else {
    list.push(spellName);
  }
  _patchCharState(c, { prepared: list });
  save('prepared_'+c, list);
  renderCharAbilities(c);
}

function isSpellPrepared(c, spellName){
  // Hechizos siempre preparados (Land Spells de Druida, Oath Spells de Paladín, etc.):
  // se cuentan como preparados automáticamente sin contar al límite, una vez que el
  // char alcanza el unlockLevel.
  const sp = (CLASS_PRESETS[c]?.spellList||[]).find(s=>s.name===spellName);
  if(sp && sp.alwaysPrepared){
    const unlock = sp.alwaysPreparedAt || 1;
    if(getCharLevel(c) >= unlock) return true;
  }
  const prepared = load('prepared_'+c, null);
  if(prepared === null){
    return !!(CLASS_PRESETS[c].spellList||[]).find(s=>s.name===spellName && s.prepared);
  }
  return prepared.includes(spellName);
}

/* ── DESBLOQUEO POR EL DM ──
   Un hechizo se desbloquea solo cuando el personaje tiene slots de su nivel. El DM puede
   desbloquear uno antes (evolución narrativa): queda en unlocked_spells_<c> y se sincroniza.
   Para lanzarlo sin slot de ese nivel, la Sesión Live pide confirmación. */
function getUnlockedSpells(c){
  const cs = window.CHAR_STATE && window.CHAR_STATE[c];
  return (cs && Array.isArray(cs.unlockedSpells)) ? cs.unlockedSpells : load('unlocked_spells_'+c, []);
}
function isSpellUnlocked(c, sp){
  return sp.level <= getMaxSpellLevel(c) || getUnlockedSpells(c).includes(sp.name);
}
function toggleSpellUnlock(c, spellName){
  const sp = (CLASS_PRESETS[c].spellList||[]).find(s=>s.name===spellName);
  if(!sp) return;
  const name = c.charAt(0).toUpperCase()+c.slice(1);
  const list = getUnlockedSpells(c);
  if(list.includes(spellName)){
    if(!confirm(`¿Volver a bloquear ${spellName} para ${name}? Si estaba preparado, se des-prepara.`)) return;
    save('unlocked_spells_'+c, list.filter(n=>n!==spellName));
    const prepared = load('prepared_'+c, null);
    if(prepared && prepared.includes(spellName)){
      const next = prepared.filter(n=>n!==spellName);
      _patchCharState(c, { prepared: next });
      save('prepared_'+c, next);
    }
  } else {
    if(!confirm(`¿Desbloquear ${spellName} (Nv ${sp.level}) para ${name}?\n\nHoy tiene slots hasta Nv ${getMaxSpellLevel(c)}: lo puede preparar, y en la Sesión Live lanzarlo pide confirmar que no hay slot de ese nivel.`)) return;
    save('unlocked_spells_'+c, [...list, spellName]);
  }
  renderCharAbilities(c);
}

/* ── CUÁNTOS HECHIZOS PUEDE PREPARAR (5E) ──
   Paladín: CHA + ½ nivel · Druida: WIS + nivel · Wizard: INT + nivel (mínimo 1).
   Los "siempre preparados" (círculo/juramento) no cuentan. Es informativo: no bloquea. */
const PREP_RULES = {
  tyrell: { ab:'cha', lv: l => Math.floor(l/2), label:'CHA + ½ nivel' },
  boyd:   { ab:'wis', lv: l => l,               label:'WIS + nivel' },
  esdas:  { ab:'int', lv: l => l,               label:'INT + nivel' }
};
function getPreparedLimit(c){
  const r = PREP_RULES[c];
  if(!r) return null;
  return Math.max(1, abilityMod(getAbilityScores(c)[r.ab]) + r.lv(getCharLevel(c)));
}
function countPreparedForLimit(c){
  const lvl = getCharLevel(c);
  return (CLASS_PRESETS[c].spellList||[]).filter(s =>
    isSpellPrepared(c, s.name) && !(s.alwaysPrepared && lvl >= (s.alwaysPreparedAt || 1))).length;
}

/* ── ACTIVE CANTRIPS (house rule: toggle on/off para Sesión Live) ── */
function isCantripActive(c, name){
  const active = load('active_cantrips_'+c, null);
  if(active === null){
    // Default: todos activos a menos que el preset diga active:false
    const cn = (CLASS_PRESETS[c].cantripsData||[]).find(x=>x.name===name);
    return !cn || cn.active !== false;
  }
  return active.includes(name);
}

function toggleCantripActive(c, name){
  const active = load('active_cantrips_'+c, null);
  let list;
  if(active === null){
    // Inicializar desde los defaults (todos activos por default)
    list = (CLASS_PRESETS[c].cantripsData||[]).filter(cn=>cn.active!==false).map(cn=>cn.name);
  } else {
    list = active;
  }
  if(list.includes(name)){
    list = list.filter(n=>n!==name);
  } else {
    list.push(name);
  }
  _patchCharState(c, { activeCantrips: list });
  save('active_cantrips_'+c, list);
  renderCharAbilities(c);
}

/* Para Sesión Live (Fase 2): obtener solo los cantrips activos */
function getActiveCantrips(c){
  return (CLASS_PRESETS[c].cantripsData||[]).filter(cn => isCantripActive(c, cn.name));
}

/* ── SCHOOL BADGES ── */
const SCHOOL_LABELS = {
  evocation:    { en:'Evocation',    es:'Evocación' },
  abjuration:   { en:'Abjuration',   es:'Abjuración' },
  conjuration:  { en:'Conjuration',  es:'Conjuración' },
  divination:   { en:'Divination',   es:'Adivinación' },
  enchantment:  { en:'Enchantment',  es:'Encantamiento' },
  illusion:     { en:'Illusion',     es:'Ilusión' },
  necromancy:   { en:'Necromancy',   es:'Nigromancia' },
  transmutation:{ en:'Transmutation',es:'Transmutación' }
};

function schoolBadge(school){
  if(!school || !SCHOOL_LABELS[school]) return '';
  const lbl = SCHOOL_LABELS[school];
  return `<span class="school-badge school-${school}" title="${lbl.en} / ${lbl.es}">${lbl.es}</span>`;
}

/* ── RENDER ── */
function renderCharAbilities(c){
  renderCharStats(c);   // atributos, CA, iniciativa y mejoras pendientes (siempre al día con los datos)
  const container = document.getElementById('abilities-'+c);
  if(!container) return;
  const preset = CLASS_PRESETS[c];
  if(!preset){ container.innerHTML = ''; return; }

  // Saves
  const savesHTML = ['str','dex','con','int','wis','cha'].map(ab=>{
    const isProf = preset.saveProfs.includes(ab);
    const bonus = getCharSaveBonus(c, ab);
    return `<div class="save-row ${isProf?'is-prof':''}">
      <span class="save-dot">${isProf?'●':'○'}</span>
      <span class="save-name">${ab.toUpperCase()}</span>
      <span class="save-bonus">${fmtMod(bonus)}</span>
    </div>`;
  }).join('');

  // Skills
  const skillsHTML = (preset.skillProfs||[]).map(sk=>{
    const bonus = getCharSkillBonus(c, sk);
    return `<div class="skill-row">
      <span class="skill-name">${sk.name}${sk.nameEs?` <em>/ ${sk.nameEs}</em>`:''}</span>
      <span class="skill-ability">${sk.ability.toUpperCase()}</span>
      <span class="skill-bonus">${fmtMod(bonus)}</span>
    </div>`;
  }).join('');

  // Determinar si hay short-rest resources para mostrar el botón
  const hasShortRest = (preset.resources||[]).some(r=>r.restoresOn==='short');

  const charLevel = getCharLevel(c);

  // Resources (Rage, Ki, Lay on Hands, etc.) — max dinámico por nivel
  const resourcesHTML = (preset.resources||[]).map(r=>{
    const state = loadResourceState(c, r);
    if(state.max === 0) return ''; // no aún a este nivel
    if(r.kind === 'pool'){
      return `<div class="resource-row pool-row">
        <div class="resource-meta">
          <span class="resource-name">${r.name}<em> / ${r.nameEs}</em></span>
          <span class="resource-tag tag-${r.restoresOn}">${r.restoresOn === 'short' ? '↻ short rest' : '↺ long rest'}</span>
        </div>
        <div class="resource-controls">
          <button class="vital-btn" onclick="changeResourcePool('${c}','${r.key}',-1)">−</button>
          <input class="pool-val" type="number" value="${state.current}" min="0" max="${state.max}" onchange="setResourcePool('${c}','${r.key}',this.value)">
          <span class="pool-max">/ ${state.max} HP</span>
          <button class="vital-btn" onclick="changeResourcePool('${c}','${r.key}',1)">+</button>
        </div>
        <div class="resource-desc">${r.desc}</div>
      </div>`;
    }
    // 'uses' kind
    const boxes = [];
    const displayMax = Math.min(state.max, 12); // visualizar máximo 12 (si Nv 20 unlimited muestra 12 + texto)
    for(let i = 0; i < displayMax; i++){
      const spent = i < state.used;
      boxes.push(`<button class="use-box ${spent?'spent':''}" onclick="toggleResourceUse('${c}','${r.key}',${i})" title="${spent?'Gastado':'Disponible'}">${spent?'●':'○'}</button>`);
    }
    const countLabel = state.max >= 99 ? '∞' : (state.max - state.used)+'/'+state.max;
    return `<div class="resource-row uses-row">
      <div class="resource-meta">
        <span class="resource-name">${r.name}<em> / ${r.nameEs}</em></span>
        <span class="resource-tag tag-${r.restoresOn}">${r.restoresOn === 'short' ? '↻ short rest' : '↺ long rest'}</span>
      </div>
      <div class="resource-controls">
        <div class="use-boxes">${boxes.join('')}</div>
        <span class="use-count">${countLabel}</span>
      </div>
      <div class="resource-desc">${r.desc}</div>
    </div>`;
  }).join('');

  // Class features por nivel — todos visibles, lockeados grisados
  const features = preset.levelFeatures || preset.abilities || [];
  // Ordenar por nivel
  const sortedFeatures = [...features].sort((a,b)=>(a.level||1)-(b.level||1));
  const abilitiesHTML = sortedFeatures.map(a=>{
    const featureLevel = a.level || 1;
    const isLocked = featureLevel > charLevel;
    return `<div class="ability-item ${isLocked?'is-locked':''} ${isLocked?'dm-only':''}">
      <div class="ability-header">
        <span class="level-badge ${isLocked?'lvl-locked':'lvl-unlocked'}">Nv ${featureLevel}${isLocked?' 🔒':''}</span>
        <span class="ability-name">${a.name}${a.nameEs?`<em> / ${a.nameEs}</em>`:''}</span>
        ${a.uses ? `<span class="ability-uses">${a.uses}</span>` : ''}
      </div>
      <div class="ability-desc">${(a.desc||'').replace(/\n/g,'<br>')}</div>
    </div>`;
  }).join('');

  // Spells (solo si la clase tiene)
  let spellsHTML = '';
  if(preset.spellList){
    // Slots dinámicos por nivel
    const dynamicSlots = getSpellSlotsForLevel(c);
    const maxSpellLevel = getMaxSpellLevel(c);
    const allLevels = ['1','2','3','4','5','6','7','8','9'].filter(lv => dynamicSlots[lv]);

    const slotsHTML = allLevels.length === 0
      ? '<div class="muted" style="font-size:0.82rem;padding:0.4rem">Sin slots a este nivel (Paladín gana slots a Nv 2).</div>'
      : allLevels.map(level=>{
          const state = loadSlotState(c, level);
          const boxes = [];
          for(let i = 0; i < state.max; i++){
            const spent = i < state.used;
            boxes.push(`<button class="slot-box ${spent?'spent':''}" onclick="toggleSpellSlot('${c}',${level},${i})" title="${spent?'Gastado':'Disponible'}">${spent?'●':'○'}</button>`);
          }
          return `<div class="slot-row">
            <span class="slot-level">Nivel ${level}</span>
            <div class="slot-boxes">${boxes.join('')}</div>
            <span class="slot-count">${state.max-state.used}/${state.max}</span>
          </div>`;
        }).join('');

    // Cantrips como cards con damage scaling visible
    const cantripsHTML = (preset.cantripsData||[]).map(cn=>{
      const active = isCantripActive(c, cn.name);
      const currentDmg = getCantripDamageDice(cn, charLevel, c);
      const dmgLine = currentDmg
        ? `<div class="cantrip-damage">Daño actual: <strong>${currentDmg} ${cn.damageType||''}</strong>${cn.damageScaling ? ` <span class="cantrip-scaling-hint">(escala: ${Object.entries(cn.damageScaling).map(([lv,d])=>`Nv${lv}→${d}`).join(' · ')})</span>` : ''}</div>`
        : '';
      return `<div class="cantrip-item ${active?'is-active':'is-inactive'}">
        <div class="cantrip-header">
          <button class="cantrip-active-btn ${active?'on':''}" onclick="toggleCantripActive('${c}','${cn.name.replace(/'/g,'\\\'')}')" title="${active?'Activo (click para desactivar)':'Inactivo (click para activar)'}">${active?'✓':'○'}</button>
          <span class="cantrip-name">${cn.name}<em> / ${cn.nameEs}</em></span>
          ${schoolBadge(cn.school)}
          ${cn.shape?`<span class="spell-shape">${cn.shape}</span>`:''}
          <span class="cantrip-tag">${active?'Cantrip · libre':'Cantrip · pausado'}</span>
          <span class="badge-no-disponible">No disponible</span>
        </div>
        ${dmgLine}
        <div class="cantrip-desc">${(cn.desc||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    }).join('');

    // Spells: lockear los de nivel mayor al accesible
    const spellListHTML = preset.spellList.map(s=>{
      const prepared = isSpellPrepared(c, s.name);
      const esc = s.name.replace(/'/g,'\\\'');
      const dmUnlocked = s.level > maxSpellLevel && getUnlockedSpells(c).includes(s.name);
      const isLocked = !isSpellUnlocked(c, s);
      const charLvl = getCharLevel(c);
      const alwaysActive = s.alwaysPrepared && charLvl >= (s.alwaysPreparedAt || 1);
      const alwaysPending = s.alwaysPrepared && !alwaysActive;
      let prepBtn;
      if(isLocked){
        prepBtn = `<button class="spell-prep-btn spell-unlock-btn" onclick="toggleSpellUnlock('${c}','${esc}')" title="Bloqueado — se desbloquea solo con slots de Nv ${s.level}. Click para desbloquearlo ya (decisión del DM)">🔒</button>`;
      } else if(alwaysActive){
        prepBtn = `<span class="spell-prep-btn always-prep" title="Siempre preparado (${s.circleSpell||'Subclass'}) — no cuenta al límite">★</span>`;
      } else {
        prepBtn = `<button class="spell-prep-btn ${prepared?'on':''}" onclick="toggleSpellPrepared('${c}','${s.name.replace(/'/g,'\\\'')}')" title="${prepared?'Preparado (click para olvidar)':'No preparado (click para preparar)'}">${prepared?'✓':'○'}</button>`;
      }
      const circleBadge = s.circleSpell
        ? `<span class="circle-spell-badge" title="${alwaysActive?'Siempre preparado':'Se desbloqueará como siempre preparado a Nv '+(s.alwaysPreparedAt||'?')}">${s.circleSpell}${alwaysPending?' 🔒 Nv '+(s.alwaysPreparedAt||'?'):' ★'}</span>`
        : '';
      const noDisponible = !prepared && !alwaysActive && !isLocked;
      return `<div class="spell-item ${prepared?'is-prepared':''} ${isLocked?'is-locked':''} ${isLocked?'dm-only':''} ${alwaysActive?'is-always-prep':''} ${noDisponible?'no-disponible':''}">
        <div class="spell-header">
          ${prepBtn}
          <span class="spell-name">${s.name}<em> / ${s.nameEs||''}</em></span>
          ${schoolBadge(s.school)}
          ${circleBadge}
          ${dmUnlocked ? `<button class="dm-unlock-badge dm-only" onclick="toggleSpellUnlock('${c}','${esc}')" title="Desbloqueado por el DM antes de tener slots de Nv ${s.level} — click para volver a bloquearlo">🔓 DM</button>` : ''}
          ${s.shape?`<span class="spell-shape">${s.shape}</span>`:''}
          <span class="spell-level" ${isLocked ? `title="Se desbloquea cuando el personaje es nivel ${getSpellUnlockLevel(c, s.level) || '?'}"` : ''}>Nivel ${s.level}${isLocked?' 🔒':''}</span>
          <span class="badge-no-disponible">No disponible</span>
        </div>
        <div class="spell-desc">${s.desc}</div>
      </div>`;
    }).join('');

    const prepLimit = getPreparedLimit(c);
    const prepCount = prepLimit != null ? countPreparedForLimit(c) : 0;

    // Spell DC y attack dinámicos
    const spellAbility = preset.spellcastingAbility || (c==='tyrell'?'cha':(c==='boyd'?'wis':(c==='esdas'?'int':null)));
    let dynamicDC = preset.spellSaveDC, dynamicAtk = preset.spellAtk;
    if(spellAbility){
      const mod = abilityMod(ABILITY_SCORES[c][spellAbility]);
      const prof = getCharProfBonus(c);
      dynamicDC = 8 + prof + mod;
      dynamicAtk = (prof + mod >= 0 ? '+' : '') + (prof + mod);
    }

    spellsHTML = `
      <h2 class="sec-head">Hechizos · ${preset.className}</h2>
      <div class="spell-meta">
        <span class="spell-dc">Spell save DC <strong>${dynamicDC}</strong></span>
        <span class="spell-atk">Spell attack <strong>${dynamicAtk}</strong></span>
        <span class="spell-max-level">Hasta hechizos de <strong>Nv ${maxSpellLevel}</strong></span>
        ${prepLimit != null ? `<span class="spell-prep-count${prepCount > prepLimit ? ' over' : ''}" title="${PREP_RULES[c].label}: ${fmtMod(abilityMod(getAbilityScores(c)[PREP_RULES[c].ab]))} + ${PREP_RULES[c].lv(getCharLevel(c))} (los ★ siempre preparados no cuentan)">Preparados <strong>${prepCount}/${prepLimit}</strong>${prepCount > prepLimit ? ' ⚠' : ''}</span>` : ''}
      </div>
      <div class="slots-block">${slotsHTML}</div>
      ${cantripsHTML ? `<h3 class="sub-head" style="margin-top:1rem">Cantrips</h3><div class="cantrips-list">${cantripsHTML}</div>` : ''}
      <h3 class="sub-head" style="margin-top:1rem">Hechizos disponibles para la clase</h3>
      <div class="spells-list">${spellListHTML}</div>
    `;
  }

  const restButtonsHTML = `
    <div class="rest-buttons dm-only">
      <button class="btn-rest btn-levelup" onclick="levelUpCharacter('${c}')" title="Subir un nivel">↑ Subir a Nv ${getCharLevel(c)+1}</button>
      ${hasShortRest ? `<button class="btn-rest btn-short" onclick="shortRest('${c}')">↻ Short rest</button>` : ''}
      <button class="btn-rest btn-long" onclick="longRest('${c}')">↺ Long rest</button>
    </div>
  `;

  // Campaign notes (reglas especiales, ej: house rule de Esdas)
  const campaignNotesHTML = (preset.campaignNotes||[]).map(n=>`
    <div class="campaign-note campaign-note-${n.type||'info'}">
      <div class="campaign-note-title">⚠ ${n.title}</div>
      <div class="campaign-note-desc">${n.desc.replace(/\n/g,'<br>')}</div>
    </div>
  `).join('');

  container.innerHTML = `
    ${campaignNotesHTML}

    <h2 class="sec-head">Saves &amp; Skills</h2>
    <div class="profs-grid">
      <div class="saves-block">
        <h3 class="sub-head">Saving Throws</h3>
        ${savesHTML}
      </div>
      <div class="skills-block">
        <h3 class="sub-head">Skill Proficiencies</h3>
        ${skillsHTML}
      </div>
    </div>

    <div class="class-header-row">
      <h2 class="sec-head" style="margin:0;border:none;flex:1">Habilidades de clase · ${preset.className} Nv${getCharLevel(c)}</h2>
      ${restButtonsHTML}
    </div>

    ${resourcesHTML ? `<div class="resources-block">${resourcesHTML}</div>` : ''}

    <div class="abilities-list">${abilitiesHTML}</div>

    ${spellsHTML}
  `;
}

function renderAllAbilities(){
  CHARS.forEach(c => renderCharAbilities(c));
}

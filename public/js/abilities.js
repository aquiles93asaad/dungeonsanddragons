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

function toggleSpellSlot(c, level, idx){
  const state = loadSlotState(c, level);
  if(idx < state.used){
    save('slots_'+c+'_'+level, state.used - 1);
  } else {
    save('slots_'+c+'_'+level, state.used + 1);
  }
  renderCharAbilities(c);
}

/* Consume slot programáticamente (lo usará Sesión Live) */
function consumeSpellSlot(c, level){
  const state = loadSlotState(c, level);
  if(state.used >= state.max) return false;
  save('slots_'+c+'_'+level, state.used + 1);
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
  const newUsed = idx < state.used ? state.used - 1 : state.used + 1;
  save('resource_'+c+'_'+key, Math.max(0, Math.min(r.max, newUsed)));
  renderCharAbilities(c);
}

function changeResourcePool(c, key, delta){
  const r = (CLASS_PRESETS[c].resources||[]).find(x=>x.key===key);
  if(!r || r.kind !== 'pool') return;
  const state = loadResourceState(c, r);
  const next = Math.max(0, Math.min(r.max, state.current + delta));
  save('resource_'+c+'_'+key, next);
  renderCharAbilities(c);
}

function setResourcePool(c, key, val){
  const r = (CLASS_PRESETS[c].resources||[]).find(x=>x.key===key);
  if(!r || r.kind !== 'pool') return;
  const next = Math.max(0, Math.min(r.max, parseInt(val)||0));
  save('resource_'+c+'_'+key, next);
  renderCharAbilities(c);
}

/* ── LEVEL UP ── */
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
  const newMax = oldMax + hpGain;

  const charLabel = c.charAt(0).toUpperCase()+c.slice(1);
  const className = preset.className;

  const confirmMsg = [
    `¿Subir a ${charLabel} a Nivel ${newLevel}?`,
    '',
    `HP máximo: ${oldMax} → ${newMax} (+${hpGain})`,
    `  · ${className}: 1d${die} promedio = ${hitDieAvg(die)}`,
    `  · CON mod: ${conMod>=0?'+':''}${conMod}`,
    profChange ? `Proficiency bonus: +${oldProf} → +${newProf}` : `Proficiency bonus: +${oldProf} (sin cambios)`,
  ].join('\n');

  if(!confirm(confirmMsg)) return;

  // 1) Guardar nuevo nivel
  save('char_level_'+c, newLevel);

  // 2) Guardar nuevo HP max
  save('hp_max_'+c, newMax);

  // 3) HP actual sube por el mismo delta (queda al mismo % de daño)
  const curHP = load('hp_'+c, oldMax);
  const newCurHP = Math.min(newMax, curHP + hpGain);
  save('hp_'+c, newCurHP);

  // 4) Actualizar el DOM de HP en la hoja: input max + span max + value
  const inp = document.getElementById(c+'-hp');
  const spanMax = document.getElementById(c+'-hp-max');
  if(inp){ inp.max = newMax; inp.value = newCurHP; }
  if(spanMax) spanMax.textContent = newMax;
  updateHP(c); // recalcula la barra y guarda

  // 5) Actualizar el char-class line (reemplaza "Nivel N")
  const classEl = document.querySelector(`#char-${c} .char-class`);
  if(classEl) classEl.textContent = classEl.textContent.replace(/Nivel \d+/, 'Nivel '+newLevel);

  // 6) Re-render de abilities (recalcula prof bonus, saves, skills, level display)
  renderCharAbilities(c);

  // 7) Aviso de cosas para revisar manualmente
  const hints = [`${charLabel} ahora es ${className} Nivel ${newLevel}.`, ''];
  if(profChange) hints.push(`✓ Proficiency bonus subió a +${newProf}.`);
  if([4, 8, 12, 16, 19].includes(newLevel)) hints.push('• ASI (Ability Score Improvement) o Feat: elegí +2 a una stat, +1 a dos, o un feat.');
  if(c==='tyrell' && newLevel===6) hints.push('• Paladín: ASI extra a Nv 6.');
  if(c==='tyrell' && newLevel===3) hints.push('• Paladín: Sacred Oath (subclass). Divine Health. Channel Divinity.');
  if(c==='rac' && newLevel===3) hints.push('• Bárbaro: Primal Path (subclass: Berserker, Totem, etc.).');
  if(c==='relyo' && newLevel===3) hints.push('• Monje: Monastic Tradition (subclass). Deflect Missiles.');
  if(c==='boyd' && newLevel===3) hints.push('• Druida: 2nd-level spells unlocked. Circle de Bosque suma hechizos.');
  if(c==='esdas' && newLevel===3) hints.push('• Wizard: 2nd-level spells unlocked. +2 hechizos al spellbook (gratis).');
  if([5,11,17].includes(newLevel)) hints.push('• Cantrips de daño suben un dado (a menos que Esdas siga sin escuela elegida).');
  if(['rac','relyo','tyrell','boyd','esdas'].includes(c) && newLevel===5){
    if(c==='rac') hints.push('• Bárbaro: Extra Attack. Fast Movement. Rage uses = 4.');
    if(c==='relyo') hints.push('• Monje: Extra Attack. Stunning Strike. Ki = 5.');
    if(c==='tyrell') hints.push('• Paladín: Extra Attack. 2nd-level spell slots.');
    if(c==='boyd') hints.push('• Druida: 3rd-level spell slots.');
    if(c==='esdas') hints.push('• Wizard: 3rd-level spell slots.');
  }
  setTimeout(()=>alert(hints.join('\n')), 100);
}

/* ── REST ── */
function longRest(c){
  if(!confirm('¿Long rest? Restaura HP máximo, slots de hechizo, Rage/Ki/Lay on Hands/Wild Shape, y todos los recursos diarios.')) return;
  // HP
  const inp = document.getElementById(c+'-hp');
  if(inp){ inp.value = getHPMax(c); updateHP(c); }
  // Slots
  const preset = CLASS_PRESETS[c];
  if(preset.spellSlots){
    Object.keys(preset.spellSlots).forEach(level=>save('slots_'+c+'_'+level, 0));
  }
  // Resources
  (preset.resources||[]).forEach(r=>{
    if(r.kind === 'pool') save('resource_'+c+'_'+r.key, r.max);
    else save('resource_'+c+'_'+r.key, 0);
  });
  renderCharAbilities(c);
}

function shortRest(c){
  if(!confirm('¿Short rest? Restaura solo los recursos que recargan en short rest (Ki, Wild Shape).')) return;
  const preset = CLASS_PRESETS[c];
  (preset.resources||[]).forEach(r=>{
    if(r.restoresOn === 'short'){
      if(r.kind === 'pool') save('resource_'+c+'_'+r.key, r.max);
      else save('resource_'+c+'_'+r.key, 0);
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
        </div>
        ${dmgLine}
        <div class="cantrip-desc">${(cn.desc||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    }).join('');

    // Spells: lockear los de nivel mayor al accesible
    const spellListHTML = preset.spellList.map(s=>{
      const prepared = isSpellPrepared(c, s.name);
      const isLocked = s.level > maxSpellLevel;
      const charLvl = getCharLevel(c);
      const alwaysActive = s.alwaysPrepared && charLvl >= (s.alwaysPreparedAt || 1);
      const alwaysPending = s.alwaysPrepared && !alwaysActive;
      let prepBtn;
      if(isLocked){
        prepBtn = `<span class="spell-prep-btn" title="Bloqueado — necesita slots de Nv ${s.level}">🔒</span>`;
      } else if(alwaysActive){
        prepBtn = `<span class="spell-prep-btn always-prep" title="Siempre preparado (${s.circleSpell||'Subclass'}) — no cuenta al límite">★</span>`;
      } else {
        prepBtn = `<button class="spell-prep-btn ${prepared?'on':''}" onclick="toggleSpellPrepared('${c}','${s.name.replace(/'/g,'\\\'')}')" title="${prepared?'Preparado (click para olvidar)':'No preparado (click para preparar)'}">${prepared?'✓':'○'}</button>`;
      }
      const circleBadge = s.circleSpell
        ? `<span class="circle-spell-badge" title="${alwaysActive?'Siempre preparado':'Se desbloqueará como siempre preparado a Nv '+(s.alwaysPreparedAt||'?')}">${s.circleSpell}${alwaysPending?' 🔒 Nv '+(s.alwaysPreparedAt||'?'):' ★'}</span>`
        : '';
      return `<div class="spell-item ${prepared?'is-prepared':''} ${isLocked?'is-locked':''} ${isLocked?'dm-only':''} ${alwaysActive?'is-always-prep':''}">
        <div class="spell-header">
          ${prepBtn}
          <span class="spell-name">${s.name}<em> / ${s.nameEs||''}</em></span>
          ${schoolBadge(s.school)}
          ${circleBadge}
          ${s.shape?`<span class="spell-shape">${s.shape}</span>`:''}
          <span class="spell-level">Nivel ${s.level}${isLocked?' 🔒':''}</span>
        </div>
        <div class="spell-desc">${s.desc}</div>
      </div>`;
    }).join('');

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

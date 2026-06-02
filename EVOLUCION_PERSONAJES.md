# Evolución orgánica de personajes — pendientes post-Sesión 2

> **Estado**: borrador a implementar al final de la Sesión 2, cuando estén las
> decisiones de jugadores tomadas en mesa y los eventos narrativos que los
> empujen a aprender cosas nuevas.

---

## Filosofía de campaña

La progresión de los personajes en esta campaña **no funciona como un videojuego**.
No es "subiste de nivel → desbloqueaste todo lo de la tabla → ahora elegí
subclase del dropdown". Esa lógica mata la fantasía narrativa.

**Cómo funciona en esta mesa:**

1. **La evolución es orgánica y narrativa.**
   - "Aprendiste *Hold Person* porque viste a Nira controlando una bestia y
     pasaste meses estudiándolo."
   - "Tu maestro espiritual te enseñó *Patient Defense* después de meditar."
   - "Esa pelea contra la araña te dejó marcas que ahora canalizás en
     *Thorn Whip*."
   - Los hechizos y features se ganan **por evento**, no por nivel.

2. **Las subclases NO son contenedores rígidos.**
   - Un Bárbaro puede tomar rasgos del Berserker (Frenzy) Y del Totem (Bear
     Spirit) si la historia lo justifica.
   - Lo que importa es lo que **el personaje ha vivido y elegido**, no qué
     "clase secundaria" elegiste en un menú.
   - Mezclar features de varias subclases está habilitado siempre que tenga
     sentido narrativo.

3. **El codex actual sirve como MENÚ DE POSIBILIDADES, no como contrato.**
   - Cuando un jugador dice "quiero hacer X", consulto el codex y le digo
     "podés hacer Y o Z, ¿cuál suena más a vos?"
   - O al revés: "por lo que pasó en la sesión, ahora podés aprender W o V,
     ¿cuál preferís?"
   - El codex completo Nv 1-20 está visible para que ambos sepamos qué
     ESTÁ DISPONIBLE en el sistema 5E como base, sin obligación de usarlo todo.

4. **El sistema no le pide al jugador que "elija subclase" en un menú.**
   - Cuando un personaje haya acumulado suficientes rasgos de un camino,
     simbólicamente "ya es un Berserker" — pero eso se reconoce, no se elige.

---

## Auditoría técnica de Nv 3 — qué falta implementar

### Lo que YA funciona automático al subir a Nv 3

Para los 5 personajes, sin tocar nada:

- HP máximo sube según la fórmula de la clase
- Proficiency bonus se mantiene en +2 (sube a +3 en Nv 5)
- Spell DC y Spell Attack recalculados (sin cambios al Nv 3)
- El display "Nv 3" se actualiza en todos lados
- Features de Nv 3 se desbloquean visualmente (dejan de estar grisadas)
- HP propagado al combat tracker

**Recursos que escalan solos:**

- Rac: Rage 2 → **3 usos**
- Relyo: Ki 2 → **3 puntos**
- Tyrell: Lay on Hands pool 10 → **15 HP**
- Boyd/Esdas: slots de Nv 1 suben de 3 → **4**, y aparecen **2 slots de Nv 2** ✨

**Hechizos de Nv 2 disponibles** para que Boyd y Esdas los puedan activar
con el toggle ✓ (siempre que narrativamente tenga sentido que los conozcan).

---

### Lo que falta por personaje

#### Rac (Bárbaro Nv 3)

**Decisión narrativa**: ¿hacia qué camino se inclina Rac?

Rasgos disponibles del SRD que podemos sumar individualmente (sin
comprometerlo a una subclase entera):

- **Frenzy** (de Berserker) — ataque extra como bonus action mientras
  rage, queda exhausted al terminar
- **Spirit Seeker** (de Totem) — rituales Beast Sense + Speak with Animals
- **Totem Spirit: Bear** (de Totem) — resistencia a TODO daño excepto
  psychic mientras rage
- **Totem Spirit: Eagle** (de Totem) — Dash bonus action mientras rage
- **Totem Spirit: Wolf** (de Totem) — aliados con ventaja vs enemigos
  cerca de Rac
- **Wild Magic Surge** (de Wild Magic) — tabla de efectos aleatorios al
  ragear
- **Divine Fury** (de Zealot) — +1d6+½nivel daño en primer ataque del
  turno mientras rage
- **Ancestral Protectors** (de Ancestral Guardian) — el primer enemigo
  que atacás cada turno: desventaja en ataques contra otros aliados

**Trabajo de código**: ~5-20 min por rasgo individual a sumar.

**Recurso nuevo**: ninguno (Rage sigue siendo el único).

---

#### Relyo (Monje Nv 3)

**Decisión narrativa**: ¿qué tradición monástica está abrazando?

Rasgos disponibles:

- **Open Hand Technique** — al usar Flurry of Blows, cada golpe tiene un
  efecto a elegir: prone / push 15 ft / no reactions hasta tu próximo turno
- **Shadow Arts** — gastar 2 Ki para castear Darkness / Darkvision /
  Pass Without Trace / Silence; también Minor Illusion como cantrip gratis
- **Elemental Disciplines** (Four Elements) — sistema nuevo, gastar Ki
  para efectos elementales. Disciplines a elegir: Fangs of the Fire Snake,
  Fist of Four Thunders, Rush of the Gale Spirits, Shape the Flowing River,
  Sweeping Cinder Strike, Water Whip, Fist of Unbroken Air
- **Radiant Sun Bolt** (Sun Soul) — cantrip-like ranged spell attack:
  4d6 radiante
- **Way of the Kensei** — designar 2 armas Kensei; bonus AC con armas
  ranged; daño die +1 con Kensei weapon
- **Drunken Technique** (Drunken Master) — Flurry of Blows también da
  Disengage + +10 ft velocidad
- **Hand of Healing** (Way of Mercy) — gastar Ki para curar HP por toque

**Caso especial**: si Relyo se inclina por Four Elements, requiere armar
el **sistema de Disciplines** (parecido a spells pero distinto). ~1.5 h.

**Otros**: ~30-45 min por rasgo individual.

**Recurso nuevo**: ninguno (Ki cubre todo).

---

#### Tyrell (Paladín Nv 3)

**Decisión narrativa**: ¿qué juramento sostiene Tyrell?

> Importante: el juramento es más "qué representa Tyrell" que "qué
> mecánicas elige". El juramento de Reynera podría ser parte del Watchers
> o del Devotion, por ejemplo. La luz que despertó podría ser Glory o
> Devotion.

Channel Divinity options disponibles (puede tener 1-2 según narrativa):

- **Sacred Weapon** (Devotion) — bonus action: arma gana +CHA al ataque y
  brilla 20 ft durante 1 min
- **Turn the Unholy** (Devotion) — Turn Undead pero también afecta a
  infernales
- **Abjure Enemy** (Vengeance) — 1 enemigo: WIS save o frightened + vel 0
  por 1 min
- **Vow of Enmity** (Vengeance) — bonus action: ventaja en ataques contra
  1 criatura por 1 min
- **Nature's Wrath** (Ancients) — STR/DEX save o vines restrain
- **Conquering Presence** (Conquest) — todos a 30 ft: WIS save o frightened
- **Champion Challenge** (Crown) — criaturas a 30 ft: WIS save o no pueden
  alejarse de Tyrell
- **Rebuke the Violent** (Redemption) — cuando un enemigo daña a un aliado,
  reaction: el enemigo recibe el mismo daño (CON save mitad)
- **Inspiring Smite** (Glory) — después de Divine Smite: distribuir HP
  temporales (2d8 + nivel) entre aliados a 30 ft
- **Watcher's Will** (Watchers) — vos + 5 aliados: ventaja en INT/WIS/CHA
  saves por 1 min

Always-prepared spells de Nv 1 según juramento (sumados al list de Tyrell,
no cuentan al límite de preparados):

- Devotion: Protection from Evil and Good, Sanctuary
- Vengeance: Bane, Hunter's Mark
- Ancients: Ensnaring Strike, Speak with Animals
- Conquest: Armor of Agathys, Command
- Crown: Command, Compelled Duel
- Redemption: Sanctuary, Sleep
- Glory: Guiding Bolt, Heroism
- Watchers: Alarm, Detect Magic

**Trabajo de código**: ~30 min total (Channel Divinity resource + opciones
elegidas + always-prepared spells).

**Recurso nuevo**: **Channel Divinity** (1/short rest). El código exacto
para sumarlo está en `data.js` con el comentario `TODO subclass-resource:
Channel Divinity`.

---

#### Boyd (Druida Nv 3)

**Sin decisión narrativa nueva** — Boyd ya eligió Circle of the Land
(Bosque) cuando llegó a Nv 2.

**Lo que sí falta implementar:**

Las **Land Spells** del círculo Bosque son siempre-preparadas (no cuentan
al límite de 5 preparados). A Nv 3 desbloquea:

- **Barkskin** (Nv 2) — ya está en su spellList ✓
- **Spider Climb** (Nv 2) — **NO está en su spellList**, hay que sumarlo

**Mecanismo nuevo a crear**: `alwaysPrepared` / `circleSpell` flag en
hechizos. Características:

- El toggle ✓/○ no aplica — siempre están preparados
- En la UI se muestran con badge "Siempre preparado" en vez del toggle
- `isSpellPrepared()` retorna `true` automáticamente
- No cuentan al límite mental de "5 hechizos preparados"

Este mecanismo es el **mismo** que usaríamos para los always-prepared
spells del juramento de Tyrell — así que implementarlo una vez sirve
para los dos.

**Trabajo de código**: ~30 min.

**Cantrip nuevo**: NO — el próximo cantrip llega a Nv 4.

---

#### Esdas (Wizard Nv 3)

**El más simple a Nv 3** porque los wizards no tienen feature de Nv 3
fuera de slots/hechizos.

**Decisión narrativa opcional**: ¿se comprometió Esdas con una escuela
de magia?

Esa decisión es **independiente del nivel** — puede pasar a Nv 2 o Nv 7
o nunca, según trama. Si sigue indeciso a Nv 3, todo igual al estado
actual (cantrips de daño bloqueados, sin features de Arcane Tradition).

**Hechizos al spellbook**: el wizard a Nv 3 puede sumar 2 hechizos
nuevos al spellbook (de cualquier nivel ≤ 2). Como el spell list de
Esdas ya tiene todos los hechizos disponibles de Nv 1 y 2 cargados,
**no requiere código nuevo**.

Lo que SÍ requiere acción narrativa:

- En mesa, decidir CUÁLES 2 hechizos "aprende" Esdas según lo que vivió
- Podría ser: viste a Nira usando *Misty Step* y la copiaste; encontraste
  un scroll de *Misty Step* en Aether Grove; tu maestra te enseñó *Shatter*
  por correspondencia; etc.
- Una vez decidido, simplemente toggle ✓ en esos hechizos

**Trabajo de código**: 0 minutos (todo está en el sistema).

Si **eventualmente** Esdas se compromete con una escuela: ~30-45 min
para agregar los features de esa tradición (Sculpt Spells de Evocation,
Hypnotic Gaze de Enchantment, etc.). El código tiene el TODO inline para
cuando llegue ese momento.

---

## Mecanismos técnicos a implementar (independientes de la decisión)

Estos sirven para varios personajes a la vez:

1. **`alwaysPrepared` / `circleSpell` flag en hechizos** —
   sirve para Land Spells de Boyd y Oath Spells de Tyrell. ~30 min.

2. **Channel Divinity como recurso** — solo para Tyrell, pero el
   código exacto ya está como comentario en `data.js`. ~10 min.

3. **Spider Climb spell** — sumar a la lista de Boyd. ~5 min.

4. (Solo si lo elige Relyo) **Sistema de Disciplines del monje
   Four Elements**. ~1.5 h.

5. (Eventualmente) **Modo "mezcla libre"** — actualmente el sistema
   asume que un personaje tiene una sola subclase. Habría que sumar
   un concepto de "features adoptados" — entries que se agregan
   manualmente al `levelFeatures` del personaje al ganarlos narrativamente.
   Esto reflejaría mejor la filosofía de la mesa.

---

## Workflow propuesto al cerrar la Sesión 2

1. **Antes/durante la sesión**: anotá en la pestaña "Sesión Live" los
   momentos clave que cambien a los personajes (Nira les muestra X,
   un encuentro despierta Y, etc.). Cuando finalices la sesión, esto
   queda en Historia (Fase 3 a implementar).

2. **Al cerrar la sesión**, decidí (vos como DM):
   - ¿Qué rasgos narrativos justifican qué nuevas habilidades para cada
     jugador?
   - ¿Hay algún hechizo, feature o recurso que se haya ganado por evento?
   - ¿Algún jugador se inclinó claramente hacia un camino arcano/espiritual/etc?

3. **Implementación**: me pasás la lista. Algo así como:
   ```
   Rac: aprendió Frenzy (después del momento en que casi mata al lobo).
   Relyo: aprendió Open Hand Technique (mientras meditaba con Nira).
   Tyrell: juró el Watchers en Aether Grove. Channel Divinity:
           Watcher's Will + Sacred Weapon (mezcla con Devotion por su
           afinidad con la luz).
   Boyd:   sumar Land Spells (Spider Climb, Barkskin already prepared).
   Esdas:  sumó al spellbook Misty Step y Mirror Image (vio a Nira
           desaparecer y reaparecer, le pareció elegante).
   ```

4. Yo armo todo en un turno, levantamos el HP a Nv 3 con el botón, y
   queda listo para la Sesión 3.

---

## Notas para el sistema actual

- **No tocar** la frase "Hechizos disponibles para la clase" en la UI —
  Akhil confirmó que la quiere visible como codex de posibilidades para
  consultarlas en mesa.
- **No tocar** la regla "house rule" de Esdas multi-escuela. Esa filosofía
  está alineada con la de evolución orgánica.
- Si en algún momento se decide implementar la **mezcla libre de subclases**
  como concepto explícito, agregar campo `narrativeSource: 'evento X'` a
  cada feature ganado, para que quede registrado de dónde salió.

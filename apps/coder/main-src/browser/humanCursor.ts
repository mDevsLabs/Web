/**
 * 注入到目标页面的"人形光标"overlay。
 *
 * 设计：
 * - 一个固定定位的 SVG 鼠标指针（独立于真实系统光标），位于最高 z-index。
 * - 暴露 `window.__maiAiCursor` API：
 *     `.show()` / `.hide()` —— 显隐光标
 *     `.moveTo(x, y, durationMs?)` —— 缓动移动到目标点（视口坐标）
 *     `.click(x, y)` —— 在目标点产生按压 + 涟漪效果
 *     `.type()` —— 触发短暂的输入指示动画
 *     `.label(text, ms)` —— 在光标旁短暂显示一行说明（如"点击登录按钮"）
 * - 完全在页面侧绘制，不与真实输入设备冲突；Playwright 的真实点击/输入由 CDP 派发，
 *   光标动画与之并行展示给用户看。
 *
 * 该函数返回一个 IIFE 字符串，既能作为 `addInitScript` 内容（每次导航重建 DOM 时重新注入），
 * 也能用 `page.evaluate` 立即执行（首次激活时让光标立刻出现）。
 */
export function humanCursorInitScript(): string {
  // Note : cette chaîne est injectée telle quelle dans la page cible, sans référence aux symboles du processus main ;
  // Écrit en IIFE auto-installante, idempotente.
  return `
(() => {
	if (typeof window === 'undefined') return;
	if (window.__maiAiCursor && window.__maiAiCursor.__installed) return;

	const STATE = {
		x: window.innerWidth / 2,
		y: window.innerHeight / 2,
		visible: false,
		container: null,
		cursor: null,
		halo: null,
		labelEl: null,
		styleEl: null,
		moveAnim: null,
		labelTimer: null,
		keyHud: null,
		keyPills: [],
		keyHudTimer: null,
	};

	function ensureRoot() {
		if (STATE.container && document.documentElement.contains(STATE.container)) {
			return;
		}
		if (!document.documentElement) {
			// Avant DOMContentLoaded, met en cache les nœuds et ajoute à la préparation.
			document.addEventListener('DOMContentLoaded', ensureRoot, { once: true });
			return;
		}

		const style = document.createElement('style');
		style.setAttribute('data-mai-ai-cursor', '1');
		style.textContent = [
			'.mai-ai-cursor-root{position:fixed;inset:0;pointer-events:none;z-index:2147483646;contain:layout style;}',
			'.mai-ai-cursor{position:absolute;width:24px;height:24px;transform:translate(-3px,-2px);transition:opacity .2s ease;will-change:transform;}',
			'.mai-ai-cursor[data-visible="0"]{opacity:0;}',
			'.mai-ai-cursor[data-visible="1"]{opacity:1;}',
			'.mai-ai-cursor[data-pressed="1"] .mai-ai-cursor-svg{transform:scale(.82);}',
			'.mai-ai-cursor-svg{transition:transform .14s cubic-bezier(.4,0,.2,1);width:100%;height:100%;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 6px 16px rgba(99,102,241,.45));}',
			'.mai-ai-cursor-glow{position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(129,140,248,.55),rgba(129,140,248,0) 65%);transform:translate(-12px,-12px) scale(1);opacity:.55;animation:mai-ai-glow 2.4s ease-in-out infinite;pointer-events:none;}',
			'@keyframes mai-ai-glow{0%,100%{opacity:.4;transform:translate(-12px,-12px) scale(.9);}50%{opacity:.65;transform:translate(-12px,-12px) scale(1.15);}}',
			'.mai-ai-cursor-halo{position:absolute;width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(129,140,248,.9);background:radial-gradient(circle,rgba(129,140,248,.18),rgba(129,140,248,0) 70%);transform:translate(-9px,-9px) scale(.5);opacity:0;pointer-events:none;}',
			'@keyframes mai-ai-ripple{0%{opacity:.95;transform:translate(-9px,-9px) scale(.4);border-width:2px;}70%{opacity:.0;transform:translate(-9px,-9px) scale(3);border-width:.6px;}100%{opacity:0;border-width:.5px;}}',
			'.mai-ai-cursor-halo[data-active="1"]{animation:mai-ai-ripple .6s cubic-bezier(.16,.78,.3,1) forwards;}',
			'.mai-ai-cursor-label{position:absolute;padding:5px 11px;border-radius:999px;font:600 11.5px/1.3 ui-sans-serif,system-ui,-apple-system,"SF Pro Text","Segoe UI",Roboto,sans-serif;color:#fff;background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(30,41,59,.94));white-space:nowrap;transform:translate(14px,8px);box-shadow:0 8px 24px rgba(15,23,42,.45),0 0 0 1px rgba(255,255,255,.08) inset;pointer-events:none;opacity:0;transition:opacity .2s ease,transform .2s ease;letter-spacing:.01em;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}',
			'.mai-ai-cursor-label[data-visible="1"]{opacity:1;}',
			'.mai-ai-keyhud{position:fixed;left:50%;bottom:36px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;justify-content:center;pointer-events:none;font:600 17px/1 ui-sans-serif,system-ui,-apple-system,"SF Pro Text","Segoe UI",Roboto,sans-serif;max-width:90vw;flex-wrap:nowrap;overflow:hidden;z-index:2147483646;}',
			'.mai-ai-keyhud-pill{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:44px;padding:0 14px;border-radius:12px;color:#f8fafc;background:linear-gradient(180deg,rgba(30,41,59,.95),rgba(15,23,42,.95));box-shadow:0 10px 30px rgba(15,23,42,.55),0 0 0 1px rgba(255,255,255,.09) inset,0 -1px 0 rgba(0,0,0,.4) inset;letter-spacing:.02em;animation:mai-ai-keypop .2s cubic-bezier(.16,.78,.3,1);will-change:transform,opacity;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);text-shadow:0 1px 2px rgba(0,0,0,.4);}',
			'.mai-ai-keyhud-pill[data-fading="1"]{transition:opacity .4s ease,transform .4s ease;opacity:0;transform:translateY(10px) scale(.9);}',
			'.mai-ai-keyhud-pill[data-mod="1"]{background:linear-gradient(180deg,rgba(99,102,241,.95),rgba(79,70,229,.95));box-shadow:0 10px 30px rgba(79,70,229,.55),0 0 0 1px rgba(165,180,252,.4) inset,0 -1px 0 rgba(30,27,75,.5) inset;}',
			'@keyframes mai-ai-keypop{0%{opacity:0;transform:translateY(14px) scale(.82);}60%{opacity:1;transform:translateY(-2px) scale(1.04);}100%{opacity:1;transform:translateY(0) scale(1);}}',
		].join('\\n');
		document.documentElement.appendChild(style);
		STATE.styleEl = style;

		const root = document.createElement('div');
		root.className = 'mai-ai-cursor-root';
		root.setAttribute('aria-hidden', 'true');

		const halo = document.createElement('div');
		halo.className = 'mai-ai-cursor-halo';

		const cursor = document.createElement('div');
		cursor.className = 'mai-ai-cursor';
		cursor.setAttribute('data-visible', '0');
		cursor.innerHTML = [
			'<div class="mai-ai-cursor-glow"></div>',
			'<svg class="mai-ai-cursor-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
			'<defs>',
			'<linearGradient id="mai-ai-cursor-grad" x1="0%" y1="0%" x2="80%" y2="100%">',
			'<stop offset="0%" stop-color="#a5b4fc"/>',
			'<stop offset="55%" stop-color="#818cf8"/>',
			'<stop offset="100%" stop-color="#6366f1"/>',
			'</linearGradient>',
			'<linearGradient id="mai-ai-cursor-shine" x1="0%" y1="0%" x2="0%" y2="60%">',
			'<stop offset="0%" stop-color="rgba(255,255,255,.7)"/>',
			'<stop offset="100%" stop-color="rgba(255,255,255,0)"/>',
			'</linearGradient>',
			'</defs>',
			// Flèche fine moderne : terminaison lisse, jonctions arrondies, contour blanc lisible sur fonds clair/sombre
			'<path d="M3.4 2.6 L3.4 18.6 Q3.4 19.7 4.5 19.1 L8.4 17 L11.1 21.7 Q11.5 22.4 12.3 22 L13.9 21.1 Q14.6 20.7 14.2 19.9 L11.6 15.4 L16.4 14.2 Q17.5 13.9 16.7 13 L4.7 2.1 Q3.4 1.0 3.4 2.6 Z" fill="url(#mai-ai-cursor-grad)" stroke="#fff" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>',
			// Reflet supérieur : donne du relief à la flèche
			'<path d="M4.4 3.5 L4.4 9 Q4.4 9.5 4.9 9.3 L7.5 8 Q8 7.8 7.5 7.3 L5 4.0 Q4.4 3.3 4.4 3.5 Z" fill="url(#mai-ai-cursor-shine)" opacity=".55"/>',
			'</svg>',
		].join('');

		const label = document.createElement('div');
		label.className = 'mai-ai-cursor-label';
		label.setAttribute('data-visible', '0');

		root.appendChild(halo);
		root.appendChild(cursor);
		root.appendChild(label);
		document.documentElement.appendChild(root);

		const keyHud = document.createElement('div');
		keyHud.className = 'mai-ai-keyhud';
		document.documentElement.appendChild(keyHud);

		STATE.container = root;
		STATE.cursor = cursor;
		STATE.halo = halo;
		STATE.labelEl = label;
		STATE.keyHud = keyHud;
		applyPosition(STATE.x, STATE.y);
	}

	const KEY_GLYPHS = {
		'Enter': '↵ Enter',
		'Tab': '⇥ Tab',
		'Backspace': '⌫',
		'Delete': '⌦',
		'Escape': 'Esc',
		'Esc': 'Esc',
		'ArrowUp': '↑',
		'ArrowDown': '↓',
		'ArrowLeft': '←',
		'ArrowRight': '→',
		'Shift': '⇧ Shift',
		'Control': 'Ctrl',
		'Ctrl': 'Ctrl',
		'Alt': 'Alt',
		'Meta': '⌘ Cmd',
		'Cmd': '⌘ Cmd',
		'Space': '␣ Space',
		' ': '␣',
		'CapsLock': '⇪ Caps',
		'PageUp': 'PgUp',
		'PageDown': 'PgDn',
		'Home': 'Home',
		'End': 'End',
	};

	const MAX_KEY_PILLS = 8;

	function pushKey(label) {
		ensureRoot();
		if (!STATE.keyHud) return;
		const raw = String(label == null ? '' : label);
		if (!raw) return;
		// Raccourci composite comme "Control+Shift+A" : découpe en pastilles individuelles.
		const parts = raw.includes('+') && raw.length > 1
			? raw.split('+').map((s) => s.trim()).filter(Boolean)
			: [raw];
		for (const part of parts) {
			const isMod = ['Shift', 'Control', 'Ctrl', 'Alt', 'Meta', 'Cmd'].indexOf(part) !== -1;
			const display = KEY_GLYPHS[part] !== undefined ? KEY_GLYPHS[part] : part;
			const pill = document.createElement('span');
			pill.className = 'mai-ai-keyhud-pill';
			if (isMod) pill.setAttribute('data-mod', '1');
			pill.textContent = display;
			STATE.keyHud.appendChild(pill);
			STATE.keyPills.push(pill);
			while (STATE.keyPills.length > MAX_KEY_PILLS) {
				const old = STATE.keyPills.shift();
				if (old && old.parentNode) old.parentNode.removeChild(old);
			}
			// Auto-disparition après une courte fenêtre pour que le flux continu garde les dernières touches visibles.
			setTimeout(() => {
				if (!pill.parentNode) return;
				pill.setAttribute('data-fading', '1');
				setTimeout(() => {
					if (pill.parentNode) pill.parentNode.removeChild(pill);
					const idx = STATE.keyPills.indexOf(pill);
					if (idx !== -1) STATE.keyPills.splice(idx, 1);
				}, 380);
			}, 1100);
		}
	}

	function applyPosition(x, y) {
		STATE.x = x;
		STATE.y = y;
		if (STATE.cursor) {
			STATE.cursor.style.left = x + 'px';
			STATE.cursor.style.top = y + 'px';
		}
		if (STATE.halo) {
			STATE.halo.style.left = x + 'px';
			STATE.halo.style.top = y + 'px';
		}
		if (STATE.labelEl) {
			STATE.labelEl.style.left = x + 'px';
			STATE.labelEl.style.top = y + 'px';
		}
	}

	function easeInOutCubic(t) {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function bezier(p0, p1, p2, p3, t) {
		const u = 1 - t;
		return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
	}

	function moveTo(targetX, targetY, durationMs) {
		ensureRoot();
		if (!STATE.cursor) return Promise.resolve();
		if (STATE.moveAnim && STATE.moveAnim.cancel) STATE.moveAnim.cancel();
		const startX = STATE.x;
		const startY = STATE.y;
		const dx = targetX - startX;
		const dy = targetY - startY;
		const distance = Math.hypot(dx, dy);
		// Vitesse adaptative : plus rapide sur courtes distances, plafonnée sur longues.
		const dur = typeof durationMs === 'number'
			? Math.max(80, durationMs)
			: Math.min(900, Math.max(180, distance * 1.4));

		// Trajectoire en courbe de Bézier cubique légèrement incurvée (pas une ligne droite), plus humaine.
		const perpX = -dy / (distance || 1);
		const perpY = dx / (distance || 1);
		const sag = Math.min(80, distance * 0.18) * (Math.random() > 0.5 ? 1 : -1);
		const c1x = startX + dx * 0.3 + perpX * sag * 0.6;
		const c1y = startY + dy * 0.3 + perpY * sag * 0.6;
		const c2x = startX + dx * 0.7 + perpX * sag * 0.9;
		const c2y = startY + dy * 0.7 + perpY * sag * 0.9;

		showInternal();
		return new Promise((resolve) => {
			const t0 = performance.now();
			let cancelled = false;
			function frame(now) {
				if (cancelled) return;
				const raw = Math.min(1, (now - t0) / dur);
				const t = easeInOutCubic(raw);
				const x = bezier(startX, c1x, c2x, targetX, t);
				const y = bezier(startY, c1y, c2y, targetY, t);
				// Léger tremblement, uniquement sur les 70% initiaux
				const jitter = raw < 0.7 ? (Math.random() - 0.5) * 0.6 : 0;
				applyPosition(x + jitter, y + jitter);
				if (raw < 1) {
					requestAnimationFrame(frame);
				} else {
					applyPosition(targetX, targetY);
					STATE.moveAnim = null;
					resolve();
				}
			}
			STATE.moveAnim = { cancel: () => { cancelled = true; STATE.moveAnim = null; resolve(); } };
			requestAnimationFrame(frame);
		});
	}

	function showInternal() {
		ensureRoot();
		STATE.visible = true;
		if (STATE.cursor) STATE.cursor.setAttribute('data-visible', '1');
	}

	function hideInternal() {
		STATE.visible = false;
		if (STATE.cursor) STATE.cursor.setAttribute('data-visible', '0');
		if (STATE.labelEl) STATE.labelEl.setAttribute('data-visible', '0');
	}

	function ripple(x, y) {
		ensureRoot();
		if (!STATE.halo) return;
		applyPosition(x, y);
		// Réinitialise l'animation
		STATE.halo.removeAttribute('data-active');
		// Déclenche un reflow pour redémarrer la keyframe
		void STATE.halo.offsetWidth;
		STATE.halo.setAttribute('data-active', '1');
	}

	function click(x, y) {
		ensureRoot();
		if (!STATE.cursor) return Promise.resolve();
		applyPosition(x, y);
		showInternal();
		STATE.cursor.setAttribute('data-pressed', '1');
		ripple(x, y);
		return new Promise((resolve) => {
			setTimeout(() => {
				if (STATE.cursor) STATE.cursor.removeAttribute('data-pressed');
				resolve();
			}, 130);
		});
	}

	function typeIndicator() {
		ripple(STATE.x, STATE.y + 14);
	}

	function setLabel(text, ms) {
		ensureRoot();
		if (!STATE.labelEl) return;
		if (STATE.labelTimer) {
			clearTimeout(STATE.labelTimer);
			STATE.labelTimer = null;
		}
		if (!text) {
			STATE.labelEl.setAttribute('data-visible', '0');
			return;
		}
		STATE.labelEl.textContent = String(text).slice(0, 80);
		STATE.labelEl.setAttribute('data-visible', '1');
		const dur = typeof ms === 'number' && ms > 0 ? ms : 1600;
		STATE.labelTimer = setTimeout(() => {
			if (STATE.labelEl) STATE.labelEl.setAttribute('data-visible', '0');
		}, dur);
	}

	const api = {
		__installed: true,
		show: showInternal,
		hide: hideInternal,
		moveTo,
		click,
		ripple,
		typeIndicator,
		label: setLabel,
		key: pushKey,
		getState: () => ({ x: STATE.x, y: STATE.y, visible: STATE.visible }),
	};

	Object.defineProperty(window, '__maiAiCursor', {
		value: api,
		configurable: true,
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', ensureRoot, { once: true });
	} else {
		ensureRoot();
	}
})();
`.trim();
}

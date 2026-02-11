// Theme toggle: remembers choice in localStorage and responds to system preference.
document.addEventListener('DOMContentLoaded', function () {
	const KEY = 'site-theme';
	const root = document.documentElement;
	const body = document.body;

	function applyTheme(name){
		if(name === 'dark'){
			body.classList.add('theme-dark');
		} else {
			body.classList.remove('theme-dark');
		}
		// update button aria-pressed if present
		const btn = document.getElementById('theme-toggle');
		if(btn) btn.setAttribute('aria-pressed', name === 'dark' ? 'true' : 'false');
	}

	// initial state
	const stored = localStorage.getItem(KEY);
	if(stored === 'dark' || stored === 'light'){
		applyTheme(stored);
	} else {
		// follow system preference
		const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(prefersDark ? 'dark' : 'light');
	}

	// toggle handler
	const toggle = document.getElementById('theme-toggle');
	if(toggle){
		toggle.addEventListener('click', function(){
			const isDark = document.body.classList.contains('theme-dark');
			const next = isDark ? 'light' : 'dark';
			applyTheme(next);
			localStorage.setItem(KEY, next);
		});
	}

	// Side nav collapse/expand (persisted)
	(function(){
		const SIDE_KEY = 'side-nav-expanded';
		const side = document.getElementById('side-nav');
		const btn = document.getElementById('side-toggle');
		if(!side || !btn) return;

		function setExpanded(expanded){
			side.classList.toggle('expanded', expanded);
			side.classList.toggle('collapsed', !expanded);
			side.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			localStorage.setItem(SIDE_KEY, expanded ? 'true' : 'false');
			// update chevron direction
			const icon = document.getElementById('side-toggle-icon');
			if(icon){
				icon.style.transform = expanded ? 'rotate(-90deg)' : 'rotate(90deg)';
			}
		}

		// initialize from storage (default: collapsed)
		const storedSide = localStorage.getItem(SIDE_KEY);
		const initiallyExpanded = storedSide === 'true';
		setExpanded(initiallyExpanded);

		btn.addEventListener('click', function(){
			const expanded = side.classList.contains('expanded');
			setExpanded(!expanded);
		});

		// keyboard support on button
		btn.addEventListener('keydown', function(e){
			if(e.key === 'Enter' || e.key === ' '){
				e.preventDefault();
				btn.click();
			}
		});
	})();

	// Mobile menu toggle (hamburger)
	(function(){
		const menuBtn = document.getElementById('menu-toggle');
		const header = document.querySelector('.top-nav');
		if(!menuBtn || !header) return;

		menuBtn.addEventListener('click', function(){
			header.classList.toggle('open');
			const expanded = header.classList.contains('open');
			menuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		});
	})();

	// Desktop sidebar toggle: reuse the menu pattern for large screens
	(function(){
		const sideBtn = document.getElementById('sidebar-toggle');
		const side = document.getElementById('side-nav');
		const header = document.querySelector('.top-nav');
		if(!sideBtn || !side) return;

		const SIDEBAR_KEY = 'sidebar-open';

			const backdrop = document.getElementById('sidebar-backdrop');
		let _escListener = null;
		let _backdropHandler = null;

        // path elements for icon morph
		const p1 = document.getElementById('sbar-p1');
		const p2 = document.getElementById('sbar-p2');
		const p3 = document.getElementById('sbar-p3');

			function updateToggleIcon(open, instant){
			// coordinates for start (hamburger) and end (X)
			const start = {
				p1: [4,7,20,7],
				p2: [4,12,20,12],
				p3: [4,17,20,17]
			};
			const end = {
				p1: [6,6,18,18],
				p2: [12,12,12,12],
				p3: [6,18,18,6]
			};

			function setD(el, coords){ if(!el) return; el.setAttribute('d', `M${coords[0]} ${coords[1]} L${coords[2]} ${coords[3]}`); }

			if(instant){
				setD(p1, open ? end.p1 : start.p1);
				setD(p2, open ? end.p2 : start.p2);
				setD(p3, open ? end.p3 : start.p3);
				if(p2) p2.style.opacity = open ? '0' : '1';
				return;
			}

			// animate with requestAnimationFrame
			const duration = 220;
			const startTime = performance.now();

			function lerp(a,b,t){ return a + (b-a)*t }

			function step(now){
				let u = Math.min(1, (now - startTime)/duration);
				const factor = open ? u : (1 - u);
				// top
				setD(p1, [
					lerp(start.p1[0], end.p1[0], factor),
					lerp(start.p1[1], end.p1[1], factor),
					lerp(start.p1[2], end.p1[2], factor),
					lerp(start.p1[3], end.p1[3], factor)
				]);
				// middle opacity and coords
				if(p2){
					p2.style.opacity = String(open ? (1 - u) : u);
					setD(p2, [
						lerp(start.p2[0], end.p2[0], factor),
						lerp(start.p2[1], end.p2[1], factor),
						lerp(start.p2[2], end.p2[2], factor),
						lerp(start.p2[3], end.p2[3], factor)
					]);
				}
				// bottom
				setD(p3, [
					lerp(start.p3[0], end.p3[0], factor),
					lerp(start.p3[1], end.p3[1], factor),
					lerp(start.p3[2], end.p3[2], factor),
					lerp(start.p3[3], end.p3[3], factor)
				]);

				if(u < 1) requestAnimationFrame(step);
			}

			// for opening, animate forward; for closing, animate forward then reverse handled above
			requestAnimationFrame(step);
		}

		function setSidebarOpen(open, animate = true){
				// toggle visual state
				side.classList.toggle('open', open);
				// expose state to assistive tech
				side.setAttribute('aria-hidden', open ? 'false' : 'true');
				// keep the header toggle visually prominent and on-top
				sideBtn.classList.toggle('open', open);
				document.body.classList.toggle('sidebar-open', open);
			if(backdrop){
				backdrop.classList.toggle('open', open);
				backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
			}
				sideBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
				// highlight the top navbar so it visually reads above the dimmed backdrop
				if(header) header.classList.toggle('sidebar-active', open);
			// update icon
				try{ updateToggleIcon(open, !animate); } catch(e){}
			// update accessible label and sr-only text
			try{
				sideBtn.setAttribute('aria-label', open ? 'Close sidebar' : 'Open sidebar');
				const lbl = document.getElementById('sidebar-toggle-label');
				if(lbl) lbl.textContent = open ? 'Close sidebar' : 'Open sidebar';
			} catch(e){}
			// persist
			try{ localStorage.setItem(SIDEBAR_KEY, open ? 'true' : 'false'); }catch(e){}

			// manage global listeners only while open
			if(open){
				_backdropHandler = function(){ setSidebarOpen(false); };
				_escListener = function(e){ if(e.key === 'Escape') setSidebarOpen(false); };
				if(backdrop) backdrop.addEventListener('click', _backdropHandler);
				document.addEventListener('keydown', _escListener);
			} else {
				if(backdrop && _backdropHandler) backdrop.removeEventListener('click', _backdropHandler);
				if(_escListener) document.removeEventListener('keydown', _escListener);
				_backdropHandler = null; _escListener = null;
			}
		}

			// If the markup included inline hiding to avoid a flash, remove it now and initialize.
			function clearPreloadHide(){
				try{
					// remove inline styles placed to prevent flicker before CSS/JS loaded
					if(side && side.style){ side.style.visibility = ''; side.style.transform = ''; }
					if(backdrop && backdrop.style){ backdrop.style.display = ''; backdrop.style.visibility = ''; backdrop.style.opacity = ''; }
				} catch(e){}
			}

			// initialize from storage (default: closed). Remove preload hiding first.
			try{
				clearPreloadHide();
				const stored = localStorage.getItem(SIDEBAR_KEY);
				if(stored === 'true') setSidebarOpen(true, false);
				else setSidebarOpen(false, false);
			} catch(e){}

			// user interaction
			sideBtn.addEventListener('click', function(){
				const isOpen = side.classList.contains('open');
				setSidebarOpen(!isOpen);
			});
	})();
});
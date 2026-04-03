/* ========================================
   ANTIGRAVITY — UI Utilities
   Panel building, controls, dynamic UI
======================================== */

const UI = {
    /* Build the side panel for a module */
    buildPanel(panelEl, config) {
        panelEl.innerHTML = '';
        for (const section of config.sections) {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'panel-section';
            sectionEl.innerHTML = `<h4>${section.title}</h4>`;

            if (section.type === 'scenarios') {
                const list = document.createElement('div');
                list.className = 'scenario-list';
                for (const sc of section.items) {
                    const btn = document.createElement('button');
                    btn.className = 'scenario-btn' + (sc.active ? ' active' : '');
                    btn.innerHTML = `<span class="scenario-dot" style="background:${sc.color || '#845ef7'}"></span> ${sc.label}`;
                    btn.onclick = () => {
                        list.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        sc.onSelect();
                    };
                    list.appendChild(btn);
                }
                sectionEl.appendChild(list);
            }

            if (section.type === 'controls') {
                for (const ctrl of section.items) {
                    if (ctrl.kind === 'slider') {
                        const group = document.createElement('div');
                        group.className = 'control-group';
                        const valDisplay = `<span class="control-value" id="val-${ctrl.id}">${ctrl.value}${ctrl.unit || ''}</span>`;
                        group.innerHTML = `
              <div class="control-label"><span>${ctrl.label}</span>${valDisplay}</div>
              <input type="range" id="ctrl-${ctrl.id}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.value}">
            `;
                        sectionEl.appendChild(group);
                        // Bind after DOM insertion
                        setTimeout(() => {
                            const input = document.getElementById(`ctrl-${ctrl.id}`);
                            const val = document.getElementById(`val-${ctrl.id}`);
                            if (input) {
                                input.oninput = () => {
                                    const v = parseFloat(input.value);
                                    val.textContent = v + (ctrl.unit || '');
                                    ctrl.onChange(v);
                                };
                            }
                        }, 0);
                    }

                    if (ctrl.kind === 'checkbox') {
                        const label = document.createElement('label');
                        label.className = 'control-checkbox';
                        label.innerHTML = `<input type="checkbox" id="ctrl-${ctrl.id}" ${ctrl.checked ? 'checked' : ''}> ${ctrl.label}`;
                        sectionEl.appendChild(label);
                        setTimeout(() => {
                            const input = document.getElementById(`ctrl-${ctrl.id}`);
                            if (input) {
                                input.onchange = () => ctrl.onChange(input.checked);
                            }
                        }, 0);
                    }

                    if (ctrl.kind === 'select') {
                        const group = document.createElement('div');
                        group.className = 'control-group';
                        let optionsHtml = '';
                        for (const opt of ctrl.options) {
                            optionsHtml += `<option value="${opt}" ${opt === ctrl.value ? 'selected' : ''}>${opt}</option>`;
                        }
                        group.innerHTML = `
                          <div class="control-label" style="display: flex; flex-direction: column; align-items: stretch; gap: var(--space-xs);">
                            <span>${ctrl.label}</span>
                            <select id="ctrl-${ctrl.id}" style="width: 100%; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); padding: 6px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;">
                              ${optionsHtml}
                            </select>
                          </div>
                        `;
                        sectionEl.appendChild(group);
                        setTimeout(() => {
                            const input = document.getElementById(`ctrl-${ctrl.id}`);
                            if (input) {
                                input.onchange = () => ctrl.onChange(input.value);
                            }
                        }, 0);
                    }

                    if (ctrl.kind === 'button') {
                        const btn = document.createElement('button');
                        btn.className = 'btn-sim';
                        btn.style.width = '100%';
                        btn.style.marginTop = '4px';
                        btn.textContent = ctrl.label;
                        btn.onclick = ctrl.onClick;
                        sectionEl.appendChild(btn);
                    }
                }
            }

            if (section.type === 'info') {
                const container = document.createElement('div');
                container.id = section.id || 'panel-info';
                container.style.fontSize = '0.8rem';
                container.style.color = 'var(--text-secondary)';
                container.style.fontFamily = "'JetBrains Mono', monospace";
                container.style.lineHeight = '1.8';
                sectionEl.appendChild(container);
            }

            panelEl.appendChild(sectionEl);
        }
    },

    /* Update an info panel */
    updateInfo(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    },

    /* Set canvas hint text */
    setHint(text) {
        const el = document.getElementById('canvas-hint');
        if (el) el.textContent = text;
    },

    /* Set canvas info pills */
    setInfoPills(pills) {
        const el = document.getElementById('canvas-info');
        if (!el) return;
        el.innerHTML = pills.map(p => `<span class="info-pill">${p}</span>`).join('');
    }
};

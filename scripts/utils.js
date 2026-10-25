import { MODULE_ID } from "./module.js";

export function animateTitleBar(dialog) {
    const titleBackground = dialog?.element?.querySelector('.window-header');
    if (!titleBackground) return;

    const duration = 20000;
    let startTime = null;
    let stopped = false;
    let frame;

    titleBackground.style.border = "2px solid";
    titleBackground.style.borderImageSlice = 1;

    let baseColor = getDialogColors().baseColor;
    let highlightColor = getDialogColors().highlightColor;

    function step(timestamp) {
        if (stopped || !titleBackground.isConnected) return;
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = (elapsed % duration) / duration;
        
        const angle = 360 * progress;
        
        titleBackground.style.borderImage = `linear-gradient(${angle}deg, ${baseColor}, ${highlightColor}, ${baseColor}) 1`;
        
        frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => { stopped = true; cancelAnimationFrame(frame); };
}

function getDialogColors() {
  const rgbColor = getCssVarValue("--color-warm-2");
  const rgbColorHighlight = getCssVarValue("--color-warm-3");
  let baseColor = addAlphaToRgb(rgbColor, 1);
  let highlightColor = addAlphaToRgb(rgbColorHighlight, 1);

  return { baseColor, highlightColor };
}

function getCssVarValue(varName) {
  const tempEl = document.createElement("div");
  tempEl.style.color = `var(${varName})`;
  tempEl.style.display = "none";
  document.body.appendChild(tempEl);

  const computedColor = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);
  return computedColor;
}

function addAlphaToRgb(rgbString, alpha) {
    const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
    return rgbString;
  }

/** Select owned tokens with usable item areas. */
export function getPickedTokens() {
  const controlled = canvas.tokens.controlled;
  const owned = token => token.actor && (game.user.isGM || token.document.testUserPermission(game.user, "OWNER"));
  if (controlled.length === 1) {
    if (owned(controlled[0])) return [controlled[0]];
    ui.notifications.warn(game.i18n.localize("gambitsTemplatePreviewer.error.tokenPermission"));
    return [];
  }
  return (controlled.length ? controlled : canvas.tokens.placeables)
    .filter(token => owned(token) && token.actor.items.some(item => hasValidTemplate(item)));
}

/** Convert dnd5e activity dimensions to scene units. */
function sceneDistance(value, units) {
  const distance = Number(value);
  if (!Number.isFinite(distance)) return NaN;
  return game.dnd5e.utils.convertLength(distance, units, canvas.scene.grid.units, { strict: false });
}

/** Collect each valid activity area, preserving its dimensions and placement count. */
export function getTemplateData(item) {
  if (game.system.id === "pf2e") {
    const area = item.system.area;
    const validTypes = ["burst", "emanation", "cone", "line", "cube", "square", "cylinder", "ring"];
    return { templates: area && validTypes.includes(area.type) && Number(area.value) > 0 ? [{
      targetType: area.type, targetSize: Number(area.value), targetWidth: Number(area.width) || undefined,
      targetCount: 1, label: item.name, units: "ft"
    }] : [] };
  }
  const templates = [];
  const addTemplate = (target, label) => {
    if (!target) return;
    const type = target.type;
    const supported = CONFIG.DND5E.areaTargetTypes[type]?.template;
    const size = sceneDistance(target.size, target.units);
    if (!supported || !Number.isFinite(size) || size <= 0) return;
    templates.push({
      targetType: type, targetSize: size, targetWidth: sceneDistance(target.width, target.units),
      targetCount: Number(target.count) || 1, label, units: canvas.scene.grid.units
    });
  };
  for (const activity of item.system.activities?.contents ?? []) {
    const name = activity.name?.trim();
    const title = CONFIG.DND5E.activityTypes[activity.type]?.documentClass?.metadata?.title;
    const standardName = title && game.i18n.localize(title);
    const label = !name || name === item.name || name === standardName ? item.name : `${item.name}: ${name}`;
    addTemplate(activity.target?.template, label);
  }
  return { templates };
}

/** Exclude unprepared spells and items without any valid area activity. */
export function hasValidTemplate(item) {
  if (game.system.id === "dnd5e" && item.type === "spell" && item.system.level > 0
    && item.system.method === "spell" && !item.system.prepared) return false;
  return getTemplateData(item).templates.length > 0;
}

export async function displayNewVersionDialog() {
  if(game.settings.get(MODULE_ID, 'lastViewedVersion') === game.modules.get(MODULE_ID).version) return;
  if(!game.user.isGM) return;
  const ICON_PATH = `modules/${MODULE_ID}/assets/gambit.webp`;

  let notesMd;
  try {
    const resp = await fetch(`modules/${MODULE_ID}/CHANGELOG.md`);
    const md = await resp.text();
    notesMd = extractChangelogSection(md, game.modules.get(MODULE_ID).version);
  }
  catch {
    notesMd = "";
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
  }

  function markdownToHtml(md) {
    const lines = md.split(/\r?\n/).filter(l => l.trim() !== "");
    if (!lines.length) return `<p><em>No release notes provided.</em></p>`;

    let html = "";
    const indentStack = [];
    let prevIndent = -1;

    for (let line of lines) {
      const m = line.match(/^(\s*)-\s*(.*)$/);
      const indent = m ? Math.floor(m[1].length / 2) : 0;
      const text   = m ? m[2] : line;

      if (indent > prevIndent) {
        for (let i = prevIndent + 1; i <= indent; i++) {
          html += "<ul>";
          indentStack.push("ul");
        }
      }
      else if (indent < prevIndent) {
        for (let i = indent; i < prevIndent; i++) {
          html += "</li></ul>";
          indentStack.pop();
        }
      }
      else if (prevIndent >= 0) {
        html += "</li>";
      }

      html += `<li>${escapeHtml(text)}`;
      prevIndent = indent;
    }

    if (prevIndent >= 0) html += "</li>";
    while (indentStack.length) {
      html += "</ul>";
      indentStack.pop();
    }

    return html;
  }

  const contentHtml = markdownToHtml(notesMd);

  await foundry.applications.api.DialogV2.wait({
    window: {
      title: `What's New in v${game.modules.get(MODULE_ID).version} of Gambit's Template Previewer`,
      id:    "gtp-changelog-dialog",
      width: 800,
      minimizable: true
    },
    content: `
      <div style="
        display: flex !important;
        width: 800px !important;
        max-width: 800px !important;
        font-family: var(--font-base) !important;
        align-items: center !important;
      ">
        <!-- Notes panel (75%) -->
        <div style="
          flex: 3 0 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 1rem !important;
          overflow-y: auto !important;
          border-right: 1px solid #777 !important;
          box-sizing: border-box !important;
        ">
          ${contentHtml}
        </div>

        <!-- Image panel (25%) -->
        <div style="
          flex: 1 0 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 1rem !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        ">
          <img src="${ICON_PATH}" alt="Previewer Icon" style="
            max-width: 100% !important;
            max-height: 150px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            border-radius: 4px !important;
            box-shadow: 0 0 10px rgba(0,0,0,0.3) !important;
          ">
        </div>
      </div>
    `,
    buttons: [{
      action: "close",
      label: "Close",
      icon:  "fas fa-check"
    }],
    rejectClose: false
  });

  await game.settings.set(MODULE_ID, 'lastViewedVersion', game.modules.get(MODULE_ID).version);
}

function extractChangelogSection(md, version) {
  const verEscaped = version.replace(/\./g, "\\.");
  const headerRe = new RegExp(`^## \\[v?${verEscaped}\\].*$`, "m");
  const allLines = md.split(/\r?\n/);
  const startIdx = allLines.findIndex(line => headerRe.test(line));
  if (startIdx === -1) return "";

  const nextIdx = allLines.slice(startIdx + 1)
    .findIndex(line => /^## \[/.test(line));
  const endIdx = nextIdx === -1 ? allLines.length : startIdx + 1 + nextIdx;
  const sectionLines = allLines.slice(startIdx + 1, endIdx);

  while (sectionLines.length && !sectionLines[0].trim()) sectionLines.shift();
  while (sectionLines.length && !sectionLines.at(-1).trim()) sectionLines.pop();

  return sectionLines.join("\n");
}
import { MODULE_ID } from "./module.js";

export function animateTitleBar(dialog) {
    const titleBackground = dialog?.element?.querySelector('.window-header');
    if (!titleBackground) return;

    const duration = 20000;
    let startTime = null;

    titleBackground.style.border = "2px solid";
    titleBackground.style.borderImageSlice = 1;

    let baseColor = getDialogColors().baseColor;
    let highlightColor = getDialogColors().highlightColor;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = (elapsed % duration) / duration;
        
        const angle = 360 * progress;
        
        titleBackground.style.borderImage = `linear-gradient(${angle}deg, ${baseColor}, ${highlightColor}, ${baseColor}) 1`;
        
        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
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

export function getPickedTokens(isV4) {
  if (canvas.tokens.controlled.length === 1) {
      const selectedToken = canvas.tokens.controlled[0];
      if (selectedToken.document.testUserPermission(game.user, "OWNER") || game.user.isGM) {
          return [selectedToken];
      } else {
          ui.notifications.warn("You do not have permission to use the template tool on the selected token.");
          return [];
      }
  } else {
      let tokens = canvas.tokens.controlled.length > 1
          ? canvas.tokens.controlled
          : canvas.tokens.placeables.filter(token => (token.actor?.hasPlayerOwner && token.document.testUserPermission(game.user, "OWNER")) || game.user.isGM);

      return tokens.filter(token => token?.actor?.items.some(item => hasValidTemplate(item, isV4)));
  }
}

export function getTemplateData(item, isV4) {
  if (game.system.id === "pf2e") {
    const area = item.system.area;
    if (area) {
      let targetType, targetSize, targetWidth;
      switch (area.type) {
        case "burst":
        case "emanation":
        case "cone":
        case "line":
          targetType = area.type;
          targetSize = area.value;
          targetWidth = area.width ?? null;
          break;
        default:
          targetType = null;
          targetSize = null;
          targetWidth = null;
      }
      return { 
        templates: [{
          targetType,
          targetSize,
          targetWidth,
          label: item.name
        }]
      };
    }
    return { templates: [] };
  } else {
    if (isV4) {
      let templates = [];
      if (item.system.activities?.contents) {
        const ignoredNames = new Set(["Attack", "Cast", "Check", "Damage", "Enchant", "Forward", "Heal", "Save", "Summon", "Use"]);
        
        templates = item.system.activities.contents
          .filter(activity => activity.target?.template?.type)
          .map(activity => {
            const activityName = activity.name ? activity.name.trim() : "";
            let label;
            
            if (!activityName || ignoredNames.has(activityName) || item.name === activityName) {
              label = item.name;
            } else {
              label = `${item.name}: ${activityName}`;
            }
            
            return {
              targetType: activity.target.template.type,
              targetSize: activity.target.template.size,
              targetWidth: activity.target.template.width ?? undefined,
              label
            };
          });
      }
      if (!templates.length) {
        templates.push({
          targetType: item.system.target?.template?.type,
          targetSize: item.system.target?.template?.size,
          targetWidth: item.system.target?.template?.width ?? undefined,
          label: item.name
        });
      }
      return { templates };
    } else {
      return { 
        templates: [{
          targetType: item.system?.target?.type,
          targetSize: item.system?.target?.value,
          targetWidth: item.system?.target?.width ?? undefined,
          label: item.name
        }]
      };
    }
  }
}

export function hasValidTemplate(item, isV4) {
  if (game.system.id === "pf2e") {
    const area = item.system.area;
    if (!area || !area.type || !area.value) return false;
    if (!["burst", "cone", "emanation", "line"].includes(area.type)) return false;
    return true;
  } else {
    let targetType, targetSize;
    if (isV4) {
      const activityWithTarget = item.system.activities?.contents.find(activity => activity.target?.template);
      if (activityWithTarget) {
          targetType = activityWithTarget.target.template.type;
          targetSize = activityWithTarget.target.template.size;
      } else {
          targetType = item.system.target?.template?.type;
          targetSize = item.system.target?.template?.size;
      }
    } else {
      targetType = item.system?.target?.type;
      targetSize = item.system?.target?.value;
    }
    if (!targetSize || !["cone", "cube", "cylinder", "line", "radius", "sphere", "square", "wall", "circle", "emanationNoTemplate"].includes(targetType)) {
      return false;
    }
    if (item.type === "spell" && (item.system.level > 0 && item.system.preparation?.mode === "prepared" && !item.system.preparation.prepared)) {
      return false;
    }
    return true;
  }
}

export function getWalledTemplateFlags(item, type) {
  if (!game.modules.get("walledtemplates")?.active) return {};

  return {
      wallsBlock: item?.flags?.walledtemplates?.wallsBlock ?? "globalDefault",
      wallRestriction: item?.flags?.walledtemplates?.wallRestriction ?? "globalDefault",
      snapCenter: item?.flags?.walledtemplates?.snapCenter ?? game.settings.get('walledtemplates', `default-${type}-snapping-center`) ?? false,
      snapCorner: item?.flags?.walledtemplates?.snapCorner ?? game.settings.get('walledtemplates', `default-${type}-snapping-corner`) ?? false,
      snapSideMidpoint: item?.flags?.walledtemplates?.snapSideMidpoint ?? game.settings.get('walledtemplates', `default-${type}-snapping-side-midpoint`) ?? false
  };
}

export async function displayNewVersionDialog() {
  if(game.settings.get(MODULE_ID, 'lastViewedVersion') === game.modules.get(MODULE_ID).version) return;
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
      <style>
      .gtp-changelog-container {
        display: flex;
        width: 800px;
        font-family: var(--font-base);
        align-items: center;
      }
      .gtp-changelog-notes {
        flex: 3;               /* 75% */
        padding: 1rem;
        overflow-y: auto;
        border-right: 1px solid #777;
        box-sizing: border-box;
      }
      .gtp-changelog-notes ul {
        padding-left: 1.2rem;
        margin: 0.5em 0;
      }
      .gtp-changelog-notes ul ul {
        padding-left: 1rem;
        margin-top: 0.2em;
      }
      .gtp-changelog-notes li {
        margin-bottom: 0.4em;
        text-align: left;
      }
      .gtp-changelog-notes p {
        margin: 0.5em 0;
        text-align: left;
      }
      .gtp-changelog-image {
        flex: 1;               /* 25% */
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
      }
      .gtp-changelog-image img {
        max-width: 100%;
        max-height: 100%;
        border-radius: 0.5rem;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      }
      </style>
      <div class="gtp-changelog-container">
        <div class="gtp-changelog-notes">
          ${contentHtml}
        </div>
        <div class="gtp-changelog-image">
          <img src="${ICON_PATH}" alt="Gambit Icon">
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
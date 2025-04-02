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
        switch(area.type) {
          case "burst":
          case "emanation":
            targetType = area.type;
            targetSize = area.value;
            break;
          case "cone":
            targetType = area.type;
            targetSize = area.value;
            break;
          case "line":
            targetType = area.type;
            targetSize = area.value;
            break;
          default:
            targetType = null;
            targetSize = null;
            targetWidth = null;
        }
        return { targetType, targetSize, targetWidth };
      }
      return {};
    } else {
      let targetType, targetSize, targetWidth;
      if (isV4) {
        const activityWithTarget = item.system.activities?.contents.find(activity => activity.target?.template);
        if (activityWithTarget) {
            targetType = activityWithTarget.target.template.type;
            targetSize = activityWithTarget.target.template.size;
            targetWidth = activityWithTarget.target.template?.width ?? undefined;
        } else {
            targetType = item.system.target?.template?.type;
            targetSize = item.system.target?.template?.size;
            targetWidth = item.system.target?.template?.width ?? undefined;
        }
      } else {
        targetType = item.system?.target?.type;
        targetSize = item.system?.target?.value;
        targetWidth = item.system?.target?.width ?? undefined;
      }
      return { targetType, targetSize, targetWidth };
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
      if (!targetSize || !["cone", "cube", "cylinder", "line", "radius", "sphere", "square", "wall"].includes(targetType)) {
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
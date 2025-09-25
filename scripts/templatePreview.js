import * as utils from './utils.js';
import { MODULE_ID } from "./module.js";

function setControlsDisabled(dialog, disabled) {
    dialog.querySelector('#token-select')?.setAttribute('disabled', disabled);
    dialog.querySelector('#item-select')?.setAttribute('disabled', disabled);
    dialog.querySelectorAll('.template-btn').forEach(button => button.setAttribute('disabled', disabled));
    dialog.querySelector('#template-size')?.setAttribute('disabled', disabled);
    dialog.querySelector('#template-size-display')?.setAttribute('disabled', disabled);
    dialog.querySelector('#template-width')?.setAttribute('disabled', disabled);
    dialog.querySelector('#template-width-display')?.setAttribute('disabled', disabled);

    if (!disabled) {
        dialog.querySelector('#token-select')?.removeAttribute('disabled');
        dialog.querySelector('#item-select')?.removeAttribute('disabled');
        dialog.querySelectorAll('.template-btn').forEach(button => button.removeAttribute('disabled'));
        dialog.querySelector('#template-size')?.removeAttribute('disabled');
        dialog.querySelector('#template-size-display')?.removeAttribute('disabled');
        dialog.querySelector('#template-width')?.removeAttribute('disabled');
        dialog.querySelector('#template-width-display')?.removeAttribute('disabled');
    }
}

function addSliderListeners(dialog) {
    const templateSizeRange = dialog.querySelector('#template-size');
    const templateSizeDisplay = dialog.querySelector('#template-size-display');
    const templateWidthRange = dialog.querySelector('#template-width');
    const templateWidthDisplay = dialog.querySelector('#template-width-display');

    if (templateSizeRange && templateSizeDisplay) {
        templateSizeRange.addEventListener('input', () => {
            templateSizeDisplay.value = templateSizeRange.value;
        });
        templateSizeDisplay.addEventListener('input', () => {
            templateSizeRange.value = templateSizeDisplay.value;
        });
    }

    if (templateWidthRange && templateWidthDisplay) {
        templateWidthRange.addEventListener('input', () => {
            templateWidthDisplay.value = templateWidthRange.value;
        });
        templateWidthDisplay.addEventListener('input', () => {
            templateWidthRange.value = templateWidthDisplay.value;
        });
    }
}

function generateItemOptions(items, isV4) {
    const gridUnits = canvas.scene.grid.units;
    return items.map(item => {
        const { templates } = utils.getTemplateData(item, isV4);

        return templates.map(template => {
        return `<option value="${item.id}" data-type="${template.targetType}" data-size="${template.targetSize}" data-width="${template.targetWidth}"> ${template.label} (${template.targetSize} ${gridUnits} ${template.targetType === "emanationNoTemplate" ? "emanation" : template.targetType}${template.targetWidth ? `, ${template.targetWidth} ${gridUnits} ${game.i18n.format("gambitsTemplatePreviewer.dialog.options.width")}` : ""})</option>`;
        }).join("");
    }).join("");
}

function generateSliderInputs(gridUnits, previewInProgress) {
    const unitConfig = {
        meters: {
            min: 1.5,
            step: 0.5,
            max: 37,
            value: 1.5
        },
        feet: {
            min: 5,
            step: 5,
            max: 120,
            value: 5
        }
    };

    const config = ["meters", "m", "mt", "metri"].includes(gridUnits.toLowerCase())
        ? unitConfig.meters
        : unitConfig.feet;

    const sliderTemplate = `
        <div class="form-group">
            <label for="template-size">${game.i18n.format("gambitsTemplatePreviewer.dialog.label.genericAoeSize")} (${gridUnits}):</label>
            <div style="display: flex; align-items: center;">
                <input type="range" id="template-size" name="template-size" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="flex: 1;" ${previewInProgress ? 'disabled' : ''}>
                <input type="number" id="template-size-display" name="template-size-display" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="width: 50px; margin-left: 10px;" ${previewInProgress ? 'disabled' : ''}>
            </div>
        </div>
        <div class="form-group" id="width-group" style="margin-top: 5px;">
            <label for="template-width">${game.i18n.format("gambitsTemplatePreviewer.dialog.label.genericAoeWidth")} (${gridUnits}):</label>
            <div style="display: flex; align-items: center;">
                <input type="range" id="template-width" name="template-width" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="flex: 1;" ${previewInProgress ? 'disabled' : ''}>
                <input type="number" id="template-width-display" name="template-width-display" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="width: 50px; margin-left: 10px;" ${previewInProgress ? 'disabled' : ''}>
            </div>
        </div>
    `;

    return sliderTemplate;
}

export async function generateTemplate() {
    if (game.gambitsTemplatePreviewer.dialogOpen) return;
    game.gambitsTemplatePreviewer.dialogOpen = true;
    
    const isV4 = foundry.utils.isNewerVersion(game.system.version, "3.9.9");
    const gridUnits = canvas.scene.grid.units;

    let pickedTokens = utils.getPickedTokens(isV4);
    let tokenOptions = [];
    let items = [];
    let itemOptions;

    if (pickedTokens.length > 0) {
        tokenOptions = pickedTokens.map(token => `<option value="${token.id}">${token.name}</option>`).join("");
        items = pickedTokens[0].actor.items.filter(item => utils.hasValidTemplate(item, isV4)).sort((a, b) => a.name.localeCompare(b.name));
        itemOptions = generateItemOptions(items, isV4);
    }

    const userFlags = game.user.getFlag(MODULE_ID, "dialog-position-generateTemplate");

    let previewInProgress = false;
    const sliderInputs = generateSliderInputs(gridUnits, previewInProgress);

    await foundry.applications.api.DialogV2.wait({
        window: {
            title: game.i18n.format("gambitsTemplatePreviewer.dialog.window.templatePreview"),
            minimizable: true
        },
        content: `
            <form>
            <div style="width: 500px;">
            ${pickedTokens.length > 1 ? `
                <div class="form-group">
                <label for="token-select">${game.i18n.format("gambitsTemplatePreviewer.dialog.label.selectToken")}:</label>
                <select id="token-select" name="token-select">
                    ${tokenOptions}
                </select>
                </div>
                <hr style="background: none; border: none; height: 2px; background-image: linear-gradient(to right, transparent, var(--color-border-highlight), transparent); margin: 1.5em 0;"/>
            ` : ''}
            ${items.length > 0 ? `
                <div class="form-group">
                <label for="item-select">${game.i18n.format("gambitsTemplatePreviewer.dialog.label.selectItemAoe")}:</label>
                <select id="item-select" name="item-select" ${previewInProgress ? 'disabled' : ''}>
                    <option value="" selected>-- ${game.i18n.format("gambitsTemplatePreviewer.dialog.options.selectAnItem")} --</option>
                    ${itemOptions}
                </select>
                </div>
                <hr style="background: none; border: none; height: 2px; background-image: linear-gradient(to right, transparent, var(--color-border-highlight), transparent); margin: 1.5em 0;"/>
            ` : ''}
                <div class="form-group">
                <label>${game.i18n.format("gambitsTemplatePreviewer.dialog.label.selectGenericAoe")}:</label>
                <div class="template-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <button type="button" id="circle-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-circle"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.circle")}
                    </button>
                    <button type="button" id="rect-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-square"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.square")}
                    </button>
                    <button type="button" id="cone-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-triangle"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.cone")}
                    </button>
                    <button type="button" id="ray-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-arrows-alt-h"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.line")}
                    </button>
                </div>
                </div>
                <hr style="background: none; border: none; height: 2px; background-image: linear-gradient(to right, transparent, var(--color-border-highlight), transparent); margin: 1em 0;"/>
                ${sliderInputs}
            </div>
            </form>
        `,
        buttons: [{
            action: "close",
            label: game.i18n.format("gambitsTemplatePreviewer.dialog.button.close"),
            icon: "fas fa-times",
            default: true
        }],
		render: (event) => {
			const dialog = event.target.element;
			const dialogInstance = event.target;

            utils.animateTitleBar(dialogInstance);

			if (userFlags) {
				dialogInstance.setPosition({ top: userFlags.top, left: userFlags.left });
			}

            game.gambitsTemplatePreviewer.dialogInstance = dialogInstance;

            addSliderListeners(dialog);

			const templateButtons = {
				circle: dialog.querySelector('#circle-template'),
				rect: dialog.querySelector('#rect-template'),
				cone: dialog.querySelector('#cone-template'),
				ray: dialog.querySelector('#ray-template')
			};

			Object.keys(templateButtons).forEach(type => {
				if (templateButtons[type]) {
                    const walledTemplateFlags = utils.getWalledTemplateFlags({}, type);
					templateButtons[type].addEventListener('click', async () => {
						if (previewInProgress) return;
						previewInProgress = true;
						setControlsDisabled(dialog, true);

                        let targetSize = parseFloat(dialog.querySelector('#template-size')?.value);
                        let targetWidth = parseFloat(dialog.querySelector('#template-width')?.value);

                        await dialogInstance.minimize();
						await previewTemplate(type, targetSize, targetWidth, walledTemplateFlags);
                        await dialogInstance.maximize();

						previewInProgress = false;
						setControlsDisabled(dialog, false);
					});
				}
			});

			const tokenSelect = dialog.querySelector('#token-select');
            let selectedToken = null;

			if (tokenSelect) {
				tokenSelect.addEventListener('change', function () {
					const selectedTokenId = this.value;
					selectedToken = pickedTokens.find(token => token.id === selectedTokenId);
					if (selectedToken) {
						items = selectedToken.actor.items.filter(item => utils.hasValidTemplate(item, isV4)).sort((a, b) => a.name.localeCompare(b.name));
						itemOptions = generateItemOptions(items, isV4);

						const itemSelect = dialog.querySelector('#item-select');
						if (itemSelect) {
							itemSelect.innerHTML = `<option value="" selected>-- ${game.i18n.format("gambitsTemplatePreviewer.dialog.options.selectAnItem")} --</option>${itemOptions}`;
						}
					}
				});
			}

			const itemSelect = dialog.querySelector('#item-select');
			if (itemSelect) {
				itemSelect.addEventListener('change', async function () {
					if (previewInProgress) return;

					const selectedItemId = this.value;
                    const selectedItem = items.find(item => item.id === selectedItemId);
                    if (selectedItem) {
                        const selectedOption = this.options[this.selectedIndex];
                        const targetType = selectedOption.getAttribute("data-type");
                        let targetSize = parseFloat(selectedOption.getAttribute("data-size"));
                        let targetWidth = parseFloat(selectedOption.getAttribute("data-width"));

                        const distConfig = ["meters", "m", "mt", "metri"].includes(gridUnits.toLowerCase())
                        ? "meters"
                        : "feet";
                        if (isNaN(targetWidth)) distConfig === "feet" ? targetWidth = 5 : targetWidth === 1.5;

                        let chosenToken = selectedToken ?? pickedTokens[0];

                        if(["emanation", "emanationNoTemplate"].includes(targetType)) {
                            const tokenSizeOffset = Math.max(chosenToken?.document?.width, chosenToken?.document?.height) * 0.5 * canvas.scene.dimensions.distance;
                            targetSize += tokenSizeOffset;
                        }

                        let previewTemplateType;
                        switch (targetType) {
                            case "sphere":
                            case "radius":
                            case "burst":
                            case "emanation":
                            case "cylinder":
                            case "circle":
                            case "emanationNoTemplate":
                            previewTemplateType = 'circle';
                            break;
                            case "cube":
                            case "square":
                            previewTemplateType = 'rect';
                            break;
                            case "cone":
                            previewTemplateType = 'cone';
                            break;
                            case "line":
                            case "wall":
                            previewTemplateType = 'ray';
                            break;
                        }

                        if (previewTemplateType) {
                            previewInProgress = true;
                            const walledTemplateFlags = utils.getWalledTemplateFlags(selectedItem, previewTemplateType);
                            setControlsDisabled(dialog, true);

                            await dialogInstance.minimize();
                            await previewTemplate(previewTemplateType, targetSize, targetWidth, walledTemplateFlags);
                            await dialogInstance.maximize();

                            previewInProgress = false;
                            setControlsDisabled(dialog, false);
                        }
                    }
				});
			}
		},
        close: (event) => {
            const { top, left } = event.target.position;
            game.user.setFlag(MODULE_ID, "dialog-position-generateTemplate", { top, left });
            game.gambitsTemplatePreviewer.dialogOpen = false;
            game.gambitsTemplatePreviewer.dialogInstance = null;
        },
        rejectClose: false
    });
}
  
async function previewTemplate(templateType, targetSize, targetWidth, walledTemplateFlags) {
    let size = targetSize;
    let width = templateType === 'ray' ? targetWidth : undefined;
    let actualTemplateType = (templateType === "rect") ? "ray" : templateType;
    
    const templateData = {
      t: actualTemplateType,
      user: game.user.id,
      direction: 0,
      angle: templateType === "cone"
        ? CONFIG.MeasuredTemplate.defaults.angle
        : templateType === "rect"
        ? 90
        : 0,
      distance: size,
      borderColor: "#FF0000",
      fillAlpha: 0.5,
      fillColor: game.user.color,
      hidden: false,
      width: templateType === "ray" ? width : templateType === "rect" ? size : undefined,
      flags: { walledtemplates: walledTemplateFlags }
    };
  
    if (game.system.id === "pf2e") {
      try {
        await canvas.templates.createPreview(templateData);
        
        const deletionPromise = new Promise((resolve) => {
          const onFinalization = async (document) => {
            try {
              await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [document.id]);
            } catch (err) {
              console.error(game.i18n.format("gambitsTemplatePreviewer.error.pf2eDeleteError"), err);
            }
            cleanup();
            resolve();
          };
  
          const onRightClick = (event) => {
            event.stopImmediatePropagation();
            event.stopPropagation();
            cleanup();
            resolve();
          };
  
          function cleanup() {
            Hooks.off("createMeasuredTemplate", onFinalization);
            canvas.stage.off("rightdown", onRightClick);
          }
  
          Hooks.once("createMeasuredTemplate", onFinalization);
          canvas.stage.once("rightdown", onRightClick);
        });
        
        await deletionPromise;
      } catch (error) {
        console.error(game.i18n.format("gambitsTemplatePreviewer.error.pf2ePreviewError"), error);
      }
    } else {
      const templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
      const template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
    
      try {
        const createdTemplates = await template.drawPreview();
        if (createdTemplates.length > 0) {
          const firstTemplate = createdTemplates[0];
          await firstTemplate.delete();
        }
      } catch (error) {
        console.error(game.i18n.format("gambitsTemplatePreviewer.error.dnd5ePreviewError"), error);
      }

      game.user.targets.forEach(token => token.setTarget(false, { user: game.user }));
    }
  }
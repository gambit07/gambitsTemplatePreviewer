import * as utils from './utils.js';
import { MODULE_ID } from "./module.js";
import { previewTemplate } from "./placement.js";

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

function generateItemOptions(items) {
    const escape = foundry.utils.escapeHTML;
    return items.map(item => {
        const { templates } = utils.getTemplateData(item);

        return templates.map((template, index) => {
        const units = escape(template.units ?? "");
        return `<option value="${item.id}" data-template-index="${index}"> ${escape(template.label)} (${template.targetSize} ${units} ${escape(template.targetType)}${template.targetWidth ? `, ${template.targetWidth} ${units} ${game.i18n.localize("gambitsTemplatePreviewer.dialog.options.width")}` : ""})</option>`;
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
    if (!canvas.ready || !canvas.scene) return ui.notifications.warn(game.i18n.localize("gambitsTemplatePreviewer.error.noCanvas"));
    if (game.gambitsTemplatePreviewer.dialogOpen) return;
    game.gambitsTemplatePreviewer.dialogOpen = true;
    
    const gridUnits = canvas.scene.grid.units;

    let pickedTokens = utils.getPickedTokens();
    let tokenOptions = [];
    let items = [];
    let itemOptions;

    if (pickedTokens.length > 0) {
        tokenOptions = pickedTokens.map(token => `<option value="${token.id}">${foundry.utils.escapeHTML(token.name)}</option>`).join("");
        items = pickedTokens[0].actor.items.filter(item => utils.hasValidTemplate(item)).sort((a, b) => a.name.localeCompare(b.name));
        itemOptions = generateItemOptions(items);
    }

    const userFlags = game.user.getFlag(MODULE_ID, "dialog-position-generateTemplate");

    let previewInProgress = false;
    let stopTitleAnimation;
    const sliderInputs = generateSliderInputs(gridUnits, previewInProgress);

    await foundry.applications.api.DialogV2.wait({
        window: {
            title: game.i18n.format("gambitsTemplatePreviewer.dialog.window.templatePreview"),
            minimizable: true
        },
        content: `
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
            ${pickedTokens.length > 0 ? `
                <div class="form-group">
                <label for="item-select" data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate">${game.i18n.format("gambitsTemplatePreviewer.dialog.label.selectItemAoe")}:</label>
                <select id="item-select" name="item-select" data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate" ${previewInProgress ? 'disabled' : ''}>
                    <option value="" selected>-- ${game.i18n.format("gambitsTemplatePreviewer.dialog.options.selectAnItem")} --</option>
                    ${itemOptions}
                </select>
                </div>
                <hr style="background: none; border: none; height: 2px; background-image: linear-gradient(to right, transparent, var(--color-border-highlight), transparent); margin: 1.5em 0;"/>
            ` : ''}
                <div class="form-group">
                <label data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate">${game.i18n.format("gambitsTemplatePreviewer.dialog.label.selectGenericAoe")}:</label>
                <div class="template-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <button type="button" id="circle-template" class="template-btn" data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-circle"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.circle")}
                    </button>
                    <button type="button" id="rect-template" class="template-btn" data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-square"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.square")}
                    </button>
                    <button type="button" id="cone-template" class="template-btn" data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-triangle"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.cone")}
                    </button>
                    <button type="button" id="ray-template" class="template-btn" data-tooltip="gambitsTemplatePreviewer.dialog.tooltip.rotate" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-arrows-alt-h"></i> ${game.i18n.format("gambitsTemplatePreviewer.dialog.label.line")}
                    </button>
                </div>
                </div>
                <hr style="background: none; border: none; height: 2px; background-image: linear-gradient(to right, transparent, var(--color-border-highlight), transparent); margin: 1em 0;"/>
                ${sliderInputs}
            </div>
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

            stopTitleAnimation?.();
            stopTitleAnimation = utils.animateTitleBar(dialogInstance);

			if (userFlags) {
				dialogInstance.setPosition({ top: userFlags.top, left: userFlags.left });
			}

            game.gambitsTemplatePreviewer.dialogInstance = dialogInstance;

            addSliderListeners(dialog);

            const runPreview = async configuration => {
                if (previewInProgress || game.gambitsTemplatePreviewer.previewInProgress) return;
                previewInProgress = game.gambitsTemplatePreviewer.previewInProgress = true;
                setControlsDisabled(dialog, true);
                try {
                    await dialogInstance.minimize();
                    await previewTemplate(configuration);
                } catch (error) {
                    console.error("Gambit's Template Previewer |", error);
                    ui.notifications.error(game.i18n.localize("gambitsTemplatePreviewer.error.previewFailed"));
                } finally {
                    previewInProgress = game.gambitsTemplatePreviewer.previewInProgress = false;
                    if (dialogInstance.rendered) {
                        await dialogInstance.maximize();
                        setControlsDisabled(dialog, false);
                        const select = dialog.querySelector('#item-select');
                        if (select) select.value = "";
                    }
                }
            };

			const templateButtons = {
				circle: dialog.querySelector('#circle-template'),
				rect: dialog.querySelector('#rect-template'),
				cone: dialog.querySelector('#cone-template'),
				ray: dialog.querySelector('#ray-template')
			};

			Object.keys(templateButtons).forEach(type => {
				if (templateButtons[type]) {
					templateButtons[type].addEventListener('click', async () => {
                        await runPreview({ type,
                            size: Number(dialog.querySelector('#template-size-display')?.value),
                            width: Number(dialog.querySelector('#template-width-display')?.value)
                        });
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
						items = selectedToken.actor.items.filter(item => utils.hasValidTemplate(item)).sort((a, b) => a.name.localeCompare(b.name));
						itemOptions = generateItemOptions(items);

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
                        const template = utils.getTemplateData(selectedItem).templates[Number(this.options[this.selectedIndex].dataset.templateIndex)];
                        if (!template) return;
                        await runPreview({
                            type: template.targetType, size: template.targetSize, width: template.targetWidth,
                            count: template.targetCount, item: selectedItem, token: selectedToken ?? pickedTokens[0]
                        });
                    }
				});
			}
		},
        close: (event) => {
            stopTitleAnimation?.();
            const { top, left } = event.target.position;
            game.user.setFlag(MODULE_ID, "dialog-position-generateTemplate", { top, left });
            game.gambitsTemplatePreviewer.dialogOpen = false;
            game.gambitsTemplatePreviewer.dialogInstance = null;
        },
        rejectClose: false
    });
}
  
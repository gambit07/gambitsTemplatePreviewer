function getPickedTokens(isV4) {
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

function getTemplateData(item, isV4) {
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
        const { targetType, targetSize, targetWidth } = getTemplateData(item, isV4);
        return `<option value="${item.id}" data-type="${targetType}" data-size="${targetSize}" data-width="${targetWidth}">${item.name} (${targetSize} ${gridUnits} ${targetType}${targetWidth ? `, ${targetWidth} ${gridUnits} width` : ""})</option>`;
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
            <label for="template-size">Generic AoE Size (${gridUnits}):</label>
            <div style="display: flex; align-items: center;">
                <input type="range" id="template-size" name="template-size" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="flex: 1;" ${previewInProgress ? 'disabled' : ''}>
                <input type="number" id="template-size-display" name="template-size-display" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="width: 50px; margin-left: 10px;" ${previewInProgress ? 'disabled' : ''}>
            </div>
        </div>
        <div class="form-group" id="width-group" style="margin-top: 5px;">
            <label for="template-width">Generic AoE Width (${gridUnits}):</label>
            <div style="display: flex; align-items: center;">
                <input type="range" id="template-width" name="template-width" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="flex: 1;" ${previewInProgress ? 'disabled' : ''}>
                <input type="number" id="template-width-display" name="template-width-display" value="${config.value}" min="${config.min}" max="${config.max}" step="${config.step}" style="width: 50px; margin-left: 10px;" ${previewInProgress ? 'disabled' : ''}>
            </div>
        </div>
    `;

    return sliderTemplate;
}

export async function generateTemplate() {
    if (game.user.getFlag("gambitsTemplatePreviewer", "dialogOpen")) {
        return;
    }
    game.user.setFlag("gambitsTemplatePreviewer", "dialogOpen", true);
    
    const isV4 = foundry.utils.isNewerVersion(game.system.version, "3.9.9");
    const gridUnits = canvas.scene.grid.units;

    let pickedTokens = getPickedTokens(isV4);
    let tokenOptions = [];
    let items = [];
    let itemOptions;

    if (pickedTokens.length > 0) {
        tokenOptions = pickedTokens.map(token => `<option value="${token.id}">${token.name}</option>`).join("");
        items = pickedTokens[0].actor.items.filter(item => hasValidTemplate(item, isV4)).sort((a, b) => a.name.localeCompare(b.name));
        itemOptions = generateItemOptions(items, isV4);
    }

    const userFlags = game.user.getFlag("gambitsTemplatePreviewer", "dialog-position-generateTemplate");

    let previewInProgress = false;
    const sliderInputs = generateSliderInputs(gridUnits, previewInProgress);

    await foundry.applications.api.DialogV2.wait({
        window: {
            title: `Template Preview`,
            minimizable: true
        },
        content: `
            <form>
            <div style="width: 450px;">
            ${pickedTokens.length > 1 ? `
                <div class="form-group">
                <label for="token-select">Select Token:</label>
                <select id="token-select" name="token-select">
                    ${tokenOptions}
                </select>
                </div>
                <hr/>
            ` : ''}
            ${items.length > 0 ? `
                <div class="form-group">
                <label for="item-select">Select Item AoE:</label>
                <select id="item-select" name="item-select" ${previewInProgress ? 'disabled' : ''}>
                    <option value="" selected>-- Select an Item --</option>
                    ${itemOptions}
                </select>
                </div>
                <hr/>
            ` : ''}
                <div class="form-group">
                <label>Select Generic AoE:</label>
                <div class="template-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <button type="button" id="circle-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-circle"></i> Circle
                    </button>
                    <button type="button" id="rect-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-square"></i> Square
                    </button>
                    <button type="button" id="cone-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-triangle"></i> Cone
                    </button>
                    <button type="button" id="ray-template" class="template-btn" ${previewInProgress ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-arrows-alt-h"></i> Line
                    </button>
                </div>
                </div>
                <hr/>
                ${sliderInputs}
            </div>
            </form>
        `,
        buttons: [{
            action: "close",
            label: `<i class='fas fa-times' style='margin-right: 5px;'></i>Close`,
            default: true
        }],
		render: (event) => {
			const dialog = event.target.element;
			const dialogInstance = event.target;

			if (userFlags) {
				dialogInstance.setPosition({ top: userFlags.top, left: userFlags.left });
			}

            addSliderListeners(dialog);

			const templateButtons = {
				circle: dialog.querySelector('#circle-template'),
				rect: dialog.querySelector('#rect-template'),
				cone: dialog.querySelector('#cone-template'),
				ray: dialog.querySelector('#ray-template')
			};

			Object.keys(templateButtons).forEach(type => {
				if (templateButtons[type]) {
                    const walledTemplateFlags = getWalledTemplateFlags({}, type);
					templateButtons[type].addEventListener('click', async () => {
						if (previewInProgress) return;
						previewInProgress = true;
						setControlsDisabled(dialog, true);

                        await dialogInstance.minimize();
						await previewTemplate(type, dialog, walledTemplateFlags);
                        await dialogInstance.maximize();

						previewInProgress = false;
						setControlsDisabled(dialog, false);
					});
				}
			});

			const tokenSelect = dialog.querySelector('#token-select');
			if (tokenSelect) {
				tokenSelect.addEventListener('change', function () {
					const selectedTokenId = this.value;
					const selectedToken = pickedTokens.find(token => token.id === selectedTokenId);
					if (selectedToken) {
						items = selectedToken.actor.items.filter(item => hasValidTemplate(item, isV4)).sort((a, b) => a.name.localeCompare(b.name));
						itemOptions = generateItemOptions(items, isV4);

						const itemSelect = dialog.querySelector('#item-select');
						if (itemSelect) {
							itemSelect.innerHTML = `<option value="" selected>-- Select an Item --</option>${itemOptions}`;
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
						let { targetType, targetSize, targetWidth } = getTemplateData(selectedItem, isV4);
						
						if(!targetWidth) targetWidth = 5;
						
						const templateSizeRange = dialog.querySelector('#template-size');
						const templateSizeDisplay = dialog.querySelector('#template-size-display');
						const templateWidthRange = dialog.querySelector('#template-width');
						const templateWidthDisplay = dialog.querySelector('#template-width-display');
						
						templateSizeRange.value = targetSize;
						templateSizeDisplay.value = targetSize;
						templateWidthRange.value = targetWidth;
						templateWidthDisplay.value = targetWidth;						

						let previewTemplateType;
						switch (targetType) {
							case "sphere":
							case "radius":
							case "cylinder":
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
                            const walledTemplateFlags = getWalledTemplateFlags(selectedItem, previewTemplateType);
							setControlsDisabled(dialog, true);

                            await dialogInstance.minimize();
							await previewTemplate(previewTemplateType, dialog, walledTemplateFlags);
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
            game.user.setFlag("gambitsTemplatePreviewer", "dialog-position-generateTemplate", { top, left });
            game.user.unsetFlag("gambitsTemplatePreviewer", "dialogOpen");
        },
        rejectClose: false
    });
}
  
async function previewTemplate(templateType, dialog, walledTemplateFlags) {
    let size = parseFloat(dialog.querySelector('#template-size')?.value);
    let width = templateType === 'ray' ? parseFloat(dialog.querySelector('#template-width')?.value) : undefined;
    let actualTemplateType = (templateType === "rect") ? "ray" : templateType;
    
    const templateData = {
        t: actualTemplateType,
        user: game.user.id,
        direction: 0,
        angle: templateType === "cone" ? CONFIG.MeasuredTemplate.defaults.angle : templateType === "rect" ? 90 : 0,
        distance: size,
        borderColor: "#FF0000",
        fillAlpha: 0.5,
        fillColor: game.user.color,
        hidden: false,
        width: templateType === "ray" ? width : templateType === 'rect' ? size : undefined,
        flags: {walledtemplates: walledTemplateFlags}
    };

    const templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
    const template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);

    try {
        const createdTemplates = await template.drawPreview();

        if (createdTemplates.length > 0) {
            const firstTemplate = createdTemplates[0];
            await firstTemplate.delete();
        }

        game.user.targets.forEach(token => {
            token.setTarget(false, { user: game.user });
        });
    } catch (error) {
        if(error) console.error('Error during template preview:', error);
    }
}

function hasValidTemplate(item, isV4) {
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

function getWalledTemplateFlags(item, type) {
    if (!game.modules.get("walledtemplates")?.active) return {};

    return {
        wallsBlock: item?.flags?.walledtemplates?.wallsBlock ?? "globalDefault",
        wallRestriction: item?.flags?.walledtemplates?.wallRestriction ?? "globalDefault",
        snapCenter: item?.flags?.walledtemplates?.snapCenter ?? game.settings.get('walledtemplates', `default-${type}-snapping-center`) ?? false,
        snapCorner: item?.flags?.walledtemplates?.snapCorner ?? game.settings.get('walledtemplates', `default-${type}-snapping-corner`) ?? false,
        snapSideMidpoint: item?.flags?.walledtemplates?.snapSideMidpoint ?? game.settings.get('walledtemplates', `default-${type}-snapping-side-midpoint`) ?? false
    };
}
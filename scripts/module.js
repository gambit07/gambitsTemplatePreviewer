import { generateTemplate } from './templatePreview.js';
import { displayNewVersionDialog } from './utils.js';
export const MODULE_ID = "gambitsTemplatePreviewer";

Hooks.once('init', async function() {
	game.settings.register(MODULE_ID, 'lastViewedVersion', {
        name: 'Last Viewed Version',
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

	game.settings.register(MODULE_ID, 'disableTokenControls', {
        name: game.i18n.format("gambitsTemplatePreviewer.settings.disableTokenControls.name"),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });

	if (!game.gambitsTemplatePreviewer) {
		game.gambitsTemplatePreviewer = { dialogOpen: false, dialogInstance: null };
	}

	game.keybindings.register(MODULE_ID, "toggleBar", {
		name: game.i18n.format("gambitsTemplatePreviewer.keybinds.toggleTemplatePreviewer.name"),
		hint: game.i18n.format("gambitsTemplatePreviewer.keybinds.toggleTemplatePreviewer.hint"),
		editable: [{
			key: "KeyP",
			modifiers: ["Control"]
		}],
		onDown: async (event) => {
			if (game.gambitsTemplatePreviewer.dialogOpen && game.gambitsTemplatePreviewer.dialogInstance) {
				game.gambitsTemplatePreviewer.dialogInstance.close();
			} else {
				await generateTemplate();
			}
			return true;
		},
		onUp: () => { return; },
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});

	if(!game.settings.get(MODULE_ID, 'disableTokenControls')) {
		Hooks.on("getSceneControlButtons", (controls) => {
			const isV13 = !foundry.utils.isNewerVersion("13.0.0", game.version);
			
			const tokensControl = isV13 ? controls.tokens : controls.find(control => control.name === "token");
			if (!tokensControl) return;
			
			if (isV13) {
				tokensControl.tools["template-preview"] = {
					name: "template-preview",
					title: game.i18n.format("gambitsTemplatePreviewer.controls.templatePreviewer.title"),
					icon: "fas fa-drafting-compass",
					order: 6,
					onChange: async () => {
						await generateTemplate();
					},
					button: true
				};
			} else {
				tokensControl.tools.push({
					name: "template-preview",
					title: game.i18n.format("gambitsTemplatePreviewer.controls.templatePreviewer.title"),
					icon: "fas fa-drafting-compass",
					onClick: async () => {
						await generateTemplate();
					},
					button: true
				});
			}
		});
	}
});

Hooks.once('ready', async function() {
	await displayNewVersionDialog();
});
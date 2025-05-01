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

	if (!game.gambitsTemplatePreviewer) {
		game.gambitsTemplatePreviewer = { dialogOpen: false };
	}

	Hooks.on("getSceneControlButtons", (controls) => {
		const isV13 = !foundry.utils.isNewerVersion("13.0.0", game.version);
		
		const tokensControl = isV13 ? controls.tokens : controls.find(control => control.name === "token");
		if (!tokensControl) return;
		
		if (isV13) {
			tokensControl.tools["template-preview"] = {
				name: "template-preview",
				title: "Template Preview Tool",
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
				title: "Template Preview Tool",
				icon: "fas fa-drafting-compass",
				onClick: async () => {
					await generateTemplate();
				},
				button: true
			});
		}
	});
});

Hooks.once('ready', async function() {
	await displayNewVersionDialog();
});
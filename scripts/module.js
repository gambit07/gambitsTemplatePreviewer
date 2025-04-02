import { generateTemplate } from './templatePreview.js';

Hooks.once('init', async function() {
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
			onClick: async () => {
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
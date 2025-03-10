import { generateTemplate } from './templatePreview.js';

Hooks.once('init', async function() {
	if (!game.gambitsTemplatePreviewer) {
		game.gambitsTemplatePreviewer = { dialogOpen: false };
	}

	Hooks.on('getSceneControlButtons', (controls) => {
	const sidebarControls = controls.find(control => control.name === "token");

	if (sidebarControls) {
		sidebarControls.tools.push({
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
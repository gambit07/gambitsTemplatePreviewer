# Changelog

## [v2.0.4] - 2025-05-01
- Added CHANGELOG.md file and updated it to contain previous release notes. The new version’s changelog will now display in a dialog on first load!
- Updated module.json to enable 5e V5 compatibility
- 5e: Remove targeting on tokens on right click, previously only worked on a left click.


## [v2.0.4] - 2025-05-01
- Added CHANGELOG.md file and updated it to contain previous release notes. The new version’s changelog will now display in a dialog on first load!
- Updated module.json to enable 5e V5 compatibility
- 5e: Remove targeting on tokens on right click, previously only worked on a left click.


## [v2.0.4] - 2025-05-01
- Added CHANGELOG.md file and updated it to contain previous release notes. The new version’s changelog will now display in a dialog on first load!
- Updated module.json to enable 5e V5 compatibility
- 5e: Remove targeting on tokens on right click, previously only worked on a left click.


## [v2.0.4] - 2025-05-01
- Added CHANGELOG.md file and updated it to contain previous release notes. The new version’s changelog will now display in a dialog on first load!
- Updated module.json to enable 5e V5 compatibility
- 5e: Remove targeting on tokens on right click, previously only worked on a left click.


## [v2.0.4] - 2025-05-01
- Added CHANGELOG.md file and updated it to contain previous release notes. The new version’s changelog will now display in a dialog on first load!
- Updated module.json to enable 5e V5 compatibility
- 5e: Remove targeting on tokens on right click, previously only worked on a left click.


## [v2.0.4] - 2025-05-01
- Added CHANGELOG.md file and updated it to contain previous release notes. The new version’s changelog will now display in a dialog on first load!
- Updated module.json to enable 5e V5 compatibility
- 5e: Remove targeting on tokens on right click, previously only worked on a left click.


## [2.0.0] - 2025-04-12

- Activities: Went through and re-worked activities for 5e. The menu will now pickup each activity for an item if each has a valid template. The menu will look for activity naming, if a default name (Use, Save, etc) or the same name as the item, the menu will use the default item name. If activity name is different, the activity will be appended to the item name, ie Item.name: Activity.name (ex. Call Lightning: Storm Bolt)
- Fixed a bug with some wall type templates with a 1 foot width. The previewer will now display those correctly. Generic AOE Size and Generic AOE Width buttons will now maintain the last manually set value while the previewer dialog is open instead of updating to the last selected template size.

## [1.1.4] - 2025-04-02

- Initial release for PF2E! Part(2)

## [1.1.3] - 2025-04-02

- Initial release for PF2E!

## [1.1.2] - 2025-04-02

- Added a bit of visual flair to the title bar and re-organized some utils

## [1.1.1] - 2025-04-02

- V13 Compatability, with extra module.json compatability this time

## [1.1.0] - 2025-04-02

- V13 Compatability

## [1.0.9] - 2025-03-10

- Fix manifest location

## [1.0.8] - 2025-03-05

- Add some handling to make sure the dialog is not opened multiple times

## [1.0.7] - 2024-12-14

- Update cone angles to use set foundry config value

## [1.0.6] - 2024-12-08

- Update module.json for 5e 4.1.2 compat

## [1.0.5] - 2024-11-19

- Forgot game.settings.get does not fail gracefully, fix for failure if WT not present/disabled

## [1.0.4] - 2024-11-18

- Added integration with Walled Templates. If installed, templates will now respect Walled Templates options per item or at the setting level if a default template is used.
- Fixed 5e V4 to use the correct item paths for activities.
- Fixed dialog not popping with default options if no valid tokens with templates are on a scene.

## [1.0.3] - 2024-11-16

- Fix metric not properly accounting for decimals.

## [1.0.2] - 2024-11-16

- Added handling for peeps using the metric system in their game. The tool will look for a value of m, mt, meters, or metri in grid scale units for a given scene. If one of those values is found, it will assume items are configured for metric, offer manual sizing options accordingly, and change dialog readouts to metric.

## [1.0.1] - 2024-11-14

Initial release part two! This tool was initially in my other module Gambits Premades, but Ive decided to split it out into its own thing. The dialog window will now respect where the user placed it previously when its re-opened AND the dialog window will be minimized when placing a template.

## [1.0.0] - 2024-11-14

Initial release! This tool was initially in my other module Gambits Premades, but Ive decided to split it out into its own thing. The dialog window will now respect where the user placed it previously when it's re-opened.
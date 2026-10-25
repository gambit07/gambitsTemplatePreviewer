/** Resolve a system area type to its placement shape. */
export function getShapeType(type) {
    if (game.system.id === "dnd5e") return CONFIG.DND5E.areaTargetTypes[type]?.template ?? type;
    return { burst: "circle", cylinder: "circle", square: "rect", cube: "rect", line: "ray" }[type] ?? type;
}

/** Build native region shapes using PF2e area geometry. */
function pf2eRegionShape(type, size, width, { item, token } = {}) {
    const ratio = canvas.grid.size / (item ? 5 : canvas.scene.grid.distance);
    const distance = size * ratio;
    const base = { x: 0, y: 0, rotation: 0 };
    switch (type) {
        case "circle": return { ...base, type: "circle", radius: distance };
        case "cone": return { ...base, type: "cone", radius: distance, angle: 90 };
        case "rect": return { ...base, type: "rectangle", width: distance, height: distance };
        case "ray": return { ...base, type: "line", length: distance, width: width * ratio };
        case "ring": return {
            ...base, type: "ring", radius: distance,
            innerWidth: canvas.grid.size / 2, outerWidth: canvas.grid.size / 2
        };
        case "emanation": return {
            type: "emanation", radius: distance,
            base: {
                ...base, type: "token", width: token?.document.width ?? 1, height: token?.document.height ?? 1,
                shape: token?.document.shape ?? (canvas.grid.isHexagonal ? CONST.TOKEN_SHAPES.ELLIPSE_1 : CONST.TOKEN_SHAPES.RECTANGLE_1)
            }
        };
        default: throw new Error(`Unsupported template shape: ${type}`);
    }
}

/** Preview PF2e cones and lines with one-click completion and system snapping. */
function placePf2ePreview(data, options) {
    return foundry.canvas.layers.RegionLayer.prototype.placeRegion.call(canvas.regions, data, {
        ...options,
        onMove: ({ position, preview, snap }) => {
            if (canvas.grid.type !== CONST.GRID_TYPES.SQUARE || !snap) return;
            Object.assign(position, canvas.grid.getSnappedPoint(position, { mode: preview.snappingMode }));
        },
        onRotate: ({ event, shape }) => {
            if (canvas.grid.type !== CONST.GRID_TYPES.SQUARE) return;
            const free = event.ctrlKey || event.metaKey;
            const step = free || shape.type === "line" ? 5 : 45;
            const rotation = shape.rotation + step * Math.sign(event.deltaY);
            shape.updateSource({ rotation: free ? rotation : Math.round(rotation / step) * step });
            return false;
        }
    });
}

/** Preview an area without creating scene documents on Foundry v14. */
export async function previewTemplate({ type, size, width, count = 1, item, token }) {
    if (!canvas.ready || !canvas.scene) return;
    if (!Number.isFinite(size) || size <= 0) throw new Error(game.i18n.localize("gambitsTemplatePreviewer.error.invalidSize"));
    width = Number.isFinite(width) && width > 0 ? width : (game.system.id === "pf2e" && item ? 5 : canvas.scene.grid.distance);
    count = Number.isSafeInteger(count) && count > 0 ? count : 1;
    const shapeType = getShapeType(type);
    const activeLayer = canvas.activeLayer;
    const scene = canvas.scene;
    try {
        if (game.system.id === "dnd5e") {
            return await game.dnd5e.canvas.TemplatePlacement.place({
                color: game.user.color, minimizeWindows: false,
                shapes: Array.from({ length: count }, () => ({ type: shapeType, size, width }))
            });
        }
        const areaShape = { circle: "burst", rect: "square", ray: "line" }[type] ?? type;
        const data = {
            name: item?.name ?? game.i18n.localize("gambitsTemplatePreviewer.dialog.window.templatePreview"),
            color: game.user.color.toString(),
            shapes: Array.from({ length: count }, () => pf2eRegionShape(shapeType, size, width, { item, token })),
            levels: canvas.level ? [canvas.level.id] : [],
            highlightMode: "coverage", displayMeasurements: true,
            ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
            visibility: CONST.REGION_VISIBILITY.ALWAYS,
            flags: { pf2e: { areaShape } }
        };
        const options = { create: false, attachToToken: shapeType === "emanation" };
        if (["cone", "ray"].includes(shapeType)) return await placePf2ePreview(data, options);
        return await canvas.regions.placeRegion(data, options);
    } finally {
        if (canvas.ready && canvas.scene === scene && activeLayer && canvas.activeLayer !== activeLayer) activeLayer.activate();
    }
}

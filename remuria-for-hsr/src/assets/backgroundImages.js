const bgModules = import.meta.glob('./backgrounds/*.{jpg,jpeg,png,webp,gif}', { eager: true });
const cardBgModules = import.meta.glob('./card_backgrounds/*.{jpg,jpeg,png,webp,gif}', { eager: true });

function toImageList(modules) {
    return Object.entries(modules).map(([path, mod]) => ({
        key: path.replace(/^\.\//, '').replace(/\.[^.]+$/, ''),
        filename: path.replace(/^\.\/backgrounds\//, '').replace(/^\.\/card_backgrounds\//, ''),
        url: mod.default,
    }));
}

export const backgroundImages = toImageList(bgModules);
export const cardBackgroundImages = toImageList(cardBgModules);

export default backgroundImages;

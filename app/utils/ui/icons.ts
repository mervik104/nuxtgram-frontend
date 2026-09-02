const icons = {
    square: 'ic:baseline-square',
    home: 'mingcute:home-3-fill',
    arrowUp: 'tabler:arrow-up',
    arrowUpDashed: 'tabler:arrow-narrow-up-dashed',
    camera: 'material-symbols:android-camera',
    cross: 'maki:cross-11',
    exit: 'fluent:arrow-exit-24-filled',
    settings: 'material-symbols:settings',
    share: 'mingcute:share-forward-line',
    theme: 'material-symbols:light-mode',
    trash: 'solar:trash-bin-trash-bold',
    loveOutline: 'solar:heart-linear',
    loveFilled: 'solar:heart-bold',
    message: 'iconamoon:comment-bold',
    menuDots: 'solar:menu-dots-bold',
    right: 'mingcute:right-fill',
    left: 'mingcute:left-fill',
    search: 'iconamoon:search-bold',
    paperclip: 'streamline-flex:paperclip-1',
    image: 'mdi:file-image-box',
    plus: 'ic:baseline-plus',
    user: 'mingcute:user-3-fill',
    google: 'devicon:google',
    x: 'simple-icons:x',
    github: 'devicon:github',
} as const

export type IconName = keyof typeof icons

export { icons }
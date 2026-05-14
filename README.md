# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

```
first-nuxt-project
├─ README.md
├─ app
│  ├─ app.vue
│  ├─ assets
│  │  └─ css
│  │     └─ main.css
│  ├─ components
│  │  ├─ auth
│  │  │  ├─ AuthCard.vue
│  │  │  ├─ AuthHeader.vue
│  │  │  ├─ LoginPage.vue
│  │  │  └─ RegisterPage.vue
│  │  ├─ comment
│  │  │  ├─ CommentBorder.vue
│  │  │  ├─ CommentCreateInput.vue
│  │  │  ├─ CommentItem.vue
│  │  │  ├─ CommentLayout.vue
│  │  │  └─ CommentList.vue
│  │  ├─ layout
│  │  │  ├─ AppHeader.vue
│  │  │  ├─ AppModals.vue
│  │  │  ├─ AppSidebar.vue
│  │  │  ├─ HeaderAccount.vue
│  │  │  ├─ SidebarItem.vue
│  │  │  └─ SidebarSubscriptions.vue
│  │  ├─ post
│  │  │  ├─ FeedPage.vue
│  │  │  ├─ FeedSinglePost.vue
│  │  │  ├─ InfiniteFeed.vue
│  │  │  ├─ PostCard.vue
│  │  │  ├─ PostFormModal.vue
│  │  │  ├─ PostLayout.vue
│  │  │  └─ PostList.vue
│  │  ├─ profile
│  │  │  ├─ ProfileAvatar.vue
│  │  │  ├─ ProfileLayout.vue
│  │  │  ├─ ProfilePage.vue
│  │  │  ├─ ProfileSettingsModal.vue
│  │  │  └─ ProfileStatChip.vue
│  │  ├─ shared
│  │  │  ├─ Avatar.vue
│  │  │  ├─ DropdownButton.vue
│  │  │  ├─ DropdownMenu.vue
│  │  │  ├─ MediaGallery.vue
│  │  │  ├─ MediaModal.vue
│  │  │  ├─ TextBody.vue
│  │  │  ├─ Toolbar.vue
│  │  │  ├─ ToolbarButton.vue
│  │  │  ├─ TransitionDrop.vue
│  │  │  └─ TransitionFade.vue
│  │  ├─ skeleton
│  │  │  ├─ FeedSkeleton.vue
│  │  │  ├─ PostSkeleton.vue
│  │  │  ├─ ProfileSkeleton.vue
│  │  │  ├─ UserCardLgSkeleton.vue
│  │  │  ├─ UserCardSkeleton.vue
│  │  │  └─ UserlistSkeleton.vue
│  │  ├─ ui
│  │  │  ├─ AppButton.vue
│  │  │  ├─ AppIcon.vue
│  │  │  ├─ AppInput.vue
│  │  │  ├─ AppLoader.vue
│  │  │  ├─ AppModal.vue
│  │  │  ├─ LikeIcon.vue
│  │  │  ├─ SmartScrollButton.vue
│  │  │  └─ VeeInput.vue
│  │  └─ user
│  │     ├─ UserActions.vue
│  │     ├─ UserCard.vue
│  │     ├─ UserList.vue
│  │     ├─ UserMenu.vue
│  │     ├─ UserMenuItem.vue
│  │     └─ UserMenuProfile.vue
│  ├─ composables
│  │  ├─ useApi.ts
│  │  ├─ useApiBuilder.ts
│  │  ├─ useApiFetch.ts
│  │  ├─ useAuthForm.ts
│  │  ├─ useElementVisibility.ts
│  │  ├─ useInfiniteScroll.ts
│  │  ├─ useNicknameCheck.ts
│  │  ├─ usePostLink.ts
│  │  ├─ useScrollTo.ts
│  │  └─ useVisibilityObserver.ts
│  ├─ layouts
│  │  └─ default.vue
│  ├─ middleware
│  │  └─ auth.global.ts
│  ├─ pages
│  │  ├─ feed
│  │  │  ├─ [id].vue
│  │  │  └─ index.vue
│  │  ├─ index.vue
│  │  ├─ login
│  │  │  └─ index.vue
│  │  ├─ profile
│  │  │  ├─ [id].vue
│  │  │  └─ index.vue
│  │  ├─ register
│  │  │  └─ index.vue
│  │  ├─ subscribers
│  │  │  └─ index.vue
│  │  ├─ subscriptions
│  │  │  └─ index.vue
│  │  └─ test
│  │     └─ index.vue
│  ├─ plugins
│  │  ├─ auth.ts
│  │  └─ scroll-manager.client.ts
│  ├─ schemas
│  │  └─ auth.ts
│  ├─ spa-loading-template.html
│  ├─ stores
│  │  ├─ auth.ts
│  │  ├─ comment.ts
│  │  ├─ follows.ts
│  │  └─ post.ts
│  ├─ types
│  │  ├─ comment.types.ts
│  │  ├─ common.types.ts
│  │  ├─ follows.types.ts
│  │  ├─ post.types.ts
│  │  ├─ reaction.types.ts
│  │  └─ user.types.ts
│  └─ utils
│     ├─ dom.ts
│     ├─ formats.ts
│     ├─ pluralize.ts
│     ├─ redirects.ts
│     └─ ui
│        └─ atoms.ts
├─ app.config.ts
├─ bun.lock
├─ db.json
├─ nuxt.config.ts
├─ package.json
├─ public
│  ├─ defaultAvatar.png
│  └─ logo.svg
└─ tsconfig.json

```
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
│  │  ├─ comment
│  │  │  ├─ CommentHeader.vue
│  │  │  ├─ CommentItem.vue
│  │  │  └─ CommentList.vue
│  │  ├─ common
│  │  │  ├─ BaseInputValidate.vue
│  │  │  ├─ BaseModal.vue
│  │  │  ├─ DropdownButton.vue
│  │  │  ├─ DropdownMenu.vue
│  │  │  ├─ TextBody.vue
│  │  │  ├─ Toolbar.vue
│  │  │  ├─ ToolbarButton.vue
│  │  │  ├─ TransitionDrop.vue
│  │  │  └─ TransitionFade.vue
│  │  ├─ layout
│  │  │  ├─ HeaderUser.vue
│  │  │  ├─ HeaderUserMenu.vue
│  │  │  └─ SidebarItem.vue
│  │  └─ post
│  │     ├─ PostCard.vue
│  │     ├─ PostCreateForm.vue
│  │     ├─ PostDetail.vue
│  │     ├─ PostEditForm.vue
│  │     ├─ PostHeader.vue
│  │     └─ PostWrapper.vue
│  ├─ composables
│  │  ├─ useApi.ts
│  │  └─ useApiFetch.ts
│  ├─ layouts
│  │  └─ default.vue
│  ├─ middleware
│  │  └─ auth.global.ts
│  ├─ models
│  │  └─ input.ts
│  ├─ pages
│  │  ├─ index.vue
│  │  ├─ login
│  │  │  └─ index.vue
│  │  ├─ posts
│  │  │  ├─ [id]
│  │  │  │  ├─ edit.vue
│  │  │  │  └─ index.vue
│  │  │  └─ index.vue
│  │  └─ register
│  │     └─ index.vue
│  ├─ plugins
│  │  └─ auth.ts
│  ├─ stores
│  │  ├─ auth.ts
│  │  ├─ comment.ts
│  │  └─ post.ts
│  ├─ types
│  │  ├─ CommentTypes.ts
│  │  ├─ PostTypes.ts
│  │  ├─ ReactionTypes.ts
│  │  └─ UserTypes.ts
│  └─ utils
│     └─ validate.ts
├─ bun.lock
├─ db.json
├─ index.d.ts
├─ nuxt.config.ts
├─ package.json
├─ public
│  ├─ comment.svg
│  ├─ favicon.svg
│  ├─ like.svg
│  ├─ logo.svg
│  ├─ redLike.svg
│  └─ robots.txt
├─ server
│  ├─ api
│  │  ├─ auth
│  │  │  ├─ login.post.ts
│  │  │  ├─ logout.post.ts
│  │  │  ├─ refresh.post.ts
│  │  │  └─ register.post.ts
│  │  ├─ posts
│  │  │  ├─ [id]
│  │  │  │  ├─ comments
│  │  │  │  │  ├─ [id].get.ts
│  │  │  │  │  └─ index.get.ts
│  │  │  │  └─ index.get.ts
│  │  │  └─ index.get.ts
│  │  └─ protected
│  │     ├─ auth
│  │     │  └─ me.get.ts
│  │     ├─ posts
│  │     │  ├─ [id]
│  │     │  │  ├─ comments
│  │     │  │  │  ├─ [id].delete.ts
│  │     │  │  │  ├─ [id].put.ts
│  │     │  │  │  └─ index.post.ts
│  │     │  │  ├─ index.delete.ts
│  │     │  │  └─ index.put.ts
│  │     │  └─ index.post.ts
│  │     └─ reaction
│  │        └─ index.post.ts
│  ├─ middleware
│  │  └─ auth.ts
│  ├─ models
│  │  ├─ Comment.ts
│  │  ├─ Post.ts
│  │  ├─ Reaction.ts
│  │  └─ User.ts
│  ├─ plugins
│  │  └─ database.ts
│  ├─ types.ts
│  └─ utils
│     ├─ jwt.ts
│     ├─ password.ts
│     ├─ reactionCounter.ts
│     └─ requiredString.ts
├─ tailwind.config.js
└─ tsconfig.json

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
│  │  ├─ comment
│  │  │  ├─ CommentCreateInput.vue
│  │  │  ├─ CommentHeader.vue
│  │  │  ├─ CommentItem.vue
│  │  │  └─ CommentList.vue
│  │  ├─ common
│  │  │  ├─ BaseInputValidate.vue
│  │  │  ├─ BaseModal.vue
│  │  │  ├─ DropdownButton.vue
│  │  │  ├─ DropdownMenu.vue
│  │  │  ├─ TextBody.vue
│  │  │  ├─ Toolbar.vue
│  │  │  ├─ ToolbarButton.vue
│  │  │  ├─ TransitionDrop.vue
│  │  │  └─ TransitionFade.vue
│  │  ├─ layout
│  │  │  ├─ HeaderButtonWrapper.vue
│  │  │  ├─ HeaderUser.vue
│  │  │  ├─ ModalsContainer.vue
│  │  │  ├─ SidebarItem.vue
│  │  │  ├─ TheHeader.vue
│  │  │  ├─ TheSidebar.vue
│  │  │  ├─ UserDropdown.vue
│  │  │  ├─ UserDropdownButton.vue
│  │  │  ├─ UserDropdownProfile.vue
│  │  │  └─ UserWidget.vue
│  │  └─ post
│  │     ├─ PostCard.vue
│  │     ├─ PostCreateForm.vue
│  │     ├─ PostDetail.vue
│  │     ├─ PostEditForm.vue
│  │     ├─ PostHeader.vue
│  │     ├─ PostList.vue
│  │     └─ PostWrapper.vue
│  ├─ composables
│  │  ├─ useApi.ts
│  │  └─ useApiFetch.ts
│  ├─ layouts
│  │  └─ default.vue
│  ├─ middleware
│  │  └─ auth.global.ts
│  ├─ models
│  │  └─ input.ts
│  ├─ pages
│  │  ├─ index.vue
│  │  ├─ login
│  │  │  └─ index.vue
│  │  ├─ posts
│  │  │  ├─ [id]
│  │  │  │  ├─ edit.vue
│  │  │  │  └─ index.vue
│  │  │  └─ index.vue
│  │  └─ register
│  │     └─ index.vue
│  ├─ plugins
│  │  └─ auth.ts
│  ├─ stores
│  │  ├─ auth.ts
│  │  ├─ comment.ts
│  │  └─ post.ts
│  ├─ types
│  │  ├─ CommentTypes.ts
│  │  ├─ PostTypes.ts
│  │  ├─ ReactionTypes.ts
│  │  └─ UserTypes.ts
│  └─ utils
│     └─ validate.ts
├─ bun.lock
├─ db.json
├─ index.d.ts
├─ nuxt.config.ts
├─ package.json
├─ public
│  ├─ comment.svg
│  ├─ favicon.svg
│  ├─ like.svg
│  ├─ logo.svg
│  ├─ redLike.svg
│  └─ robots.txt
├─ server
│  ├─ api
│  │  ├─ auth
│  │  │  ├─ login.post.ts
│  │  │  ├─ logout.post.ts
│  │  │  ├─ refresh.post.ts
│  │  │  └─ register.post.ts
│  │  ├─ posts
│  │  │  ├─ [id]
│  │  │  │  ├─ comments
│  │  │  │  │  ├─ [id].get.ts
│  │  │  │  │  └─ index.get.ts
│  │  │  │  └─ index.get.ts
│  │  │  └─ index.get.ts
│  │  └─ protected
│  │     ├─ auth
│  │     │  └─ me.get.ts
│  │     ├─ posts
│  │     │  ├─ [id]
│  │     │  │  ├─ comments
│  │     │  │  │  ├─ [id].delete.ts
│  │     │  │  │  ├─ [id].put.ts
│  │     │  │  │  └─ index.post.ts
│  │     │  │  ├─ index.delete.ts
│  │     │  │  └─ index.put.ts
│  │     │  └─ index.post.ts
│  │     └─ reaction
│  │        └─ index.post.ts
│  ├─ middleware
│  │  └─ auth.ts
│  ├─ models
│  │  ├─ Comment.ts
│  │  ├─ Post.ts
│  │  ├─ Reaction.ts
│  │  └─ User.ts
│  ├─ plugins
│  │  └─ database.ts
│  ├─ types.ts
│  └─ utils
│     ├─ jwt.ts
│     ├─ password.ts
│     ├─ reactionCounter.ts
│     └─ requiredString.ts
├─ tailwind.config.js
└─ tsconfig.json

```
# Contributing to CrowdCanvas

First off, thank you for considering contributing to CrowdCanvas. It's people like you that make CrowdCanvas such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

## Fork & create a branch

If this is something you think you can fix, then fork CrowdCanvas and create a branch with a descriptive name.

## Get the test suite running

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and configure your keys.
3. Start the development server: `npm run dev`
4. The application will be available at `http://localhost:3000`.

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with CrowdCanvas's master branch:

```sh
git remote add upstream git@github.com:Architrb1795/crowdcanvas.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-japanese-translations
git rebase master
git push --set-upstream origin 325-add-japanese-translations
```

Finally, go to GitHub and make a Pull Request.

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

## Code Standards

- **TypeScript**: We use TypeScript strictly. Ensure your types are accurate.
- **ESLint & Prettier**: Our CI runs these checks. Please format your code before submitting.
- **UI Architecture**: We follow the App Router model in Next.js. Keep Client and Server boundaries clear.

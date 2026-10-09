# Tao Market

A responsive, Taobao-inspired shopping storefront for GitHub Pages. Includes product search, category filters, sorting, saved products, product details, ratings and reviews, and a persistent shopping bag. No accounts, payment collection, or online ordering.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the local server in your browser. Use an HTTP server because the catalog is loaded with fetch; opening index.html as a file is not supported. No package installation or build step is required.

## Publish on GitHub Pages

Push the files to `main`. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions**. The included `pages.yml` workflow deploys the static assets on pushes to main or manual runs. Relative asset paths support a project site under `/dummysite2/`. Publication requires repository access and Pages enabled; the presence of the workflow does not mean the site has been published.

## Catalog and assets

Product names, descriptions, prices, rating values and review fixtures are sourced from [DummyJSON](https://github.com/Ovi/DummyJSON), an MIT-licensed sample dataset. Reviews are illustrative dataset entries, not independently verified customer feedback; prices are sample catalog prices, not current offers. The product illustrations are original SVG artwork, representative rather than official product photography. Product and brand names belong to their respective owners; Tao Market is not affiliated with Taobao or these brands.

All product illustrations and fonts are bundled locally. Favorites and bag contents are stored only in the visitor's browser; no data is sent to a checkout service.

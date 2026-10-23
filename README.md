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

## Scraping product data

Every product includes `source_platform`, `title`, `price`, `currency`, `seller_id`,
`seller_name`, `selling_since`, `rating`, `review_count`, `review` (an array of
`{text, rating, date}`), and `product_url`. `source_platform` identifies this
storefront as `Tao Market`; DummyJSON is the upstream fixture source. Prices use
the ISO currency code `USD`. Selling dates use `YYYY-MM-DD`; review dates use ISO
8601 timestamps. Seller identities and selling dates are fictional fixtures,
not actual merchants. Product ratings retain the upstream dataset values and
are not recomputed from its small sample of reviews. `review_count` is the number
of review entries available here. The original `reviews` array remains for
compatibility with the storefront.

Scrapers can fetch `products.json` directly, or follow links from
`products/index.html` to `products/<id>.html`. Each product page serves all fields
in its initial HTML without JavaScript, login, or dialog interaction:

- Visible fields have `data-field` attributes matching the names above.
- Each `[data-field="review"]` contains `text`, `rating`, and `date` fields.
- Dates have machine-readable `datetime` attributes; `product_url` is a link's
  `href` and is also provided as the page's canonical URL.
- `script#product-data` contains a JSON object with the complete catalog entry.

For example, using Python's standard library on a running local server:

```python
import json
from urllib.request import urlopen

with urlopen('http://localhost:8000/products.json') as response:
    products = json.load(response)
for product in products:
    print(product['title'], product['seller_id'], product['review'])
```

After editing `products.json`, regenerate pages and validate scraping:

```sh
python3 scripts/build_products.py
python3 -m unittest discover -s tests
```

Generated product pages are committed for local serving. The Pages workflow also
regenerates, validates, and publishes them. `product_url` targets the default
GitHub Pages deployment at `https://paegnium.github.io/dummysite2/`; update these
URLs and the URL assertion in `tests/test_scraping.py` if moving to a custom domain.

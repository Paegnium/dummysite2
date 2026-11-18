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

The 12 original products use data from [DummyJSON](https://github.com/Ovi/DummyJSON), an MIT-licensed sample dataset. Each has five seller offers including the original. The catalog also includes 54 products from [Cartlane](https://github.com/Paegnium/dummysite) and nine from [Lazora](https://github.com/Paegnium/dummysite3), with two new seller offers each. Imported product images are bundled locally with the applicable dataset notices. Product and brand names belong to their respective owners. Tao Market is not affiliated with Taobao or these brands.

For cross-catalog additions, `reference_price` is the source catalog's sample benchmark in USD. Lazora's SGD benchmarks use a fixed demo conversion of 0.75 USD per SGD. Clearance offers with ratings below 3 stars are priced 51–70% below those sample benchmarks. Sellers, reviews, and prices on these offers are fictional.

All product illustrations and fonts are bundled locally. Favorites and bag contents are stored only in the visitor's browser; no data is sent to a checkout service.

## Scraping product data

Every product includes `source_platform`, `title`, `price`, `currency`, `seller_id`,
`seller_name`, `selling_since`, `rating`, `review_count`, `review` (an array of
`{text, rating, date}`), and `product_url`. `source_platform` identifies this
storefront as `Tao Market`; DummyJSON is the upstream fixture source. Prices use
the ISO currency code `USD`. Selling dates use `YYYY-MM-DD`; review dates use ISO
8601 timestamps. Seller identities and selling dates are fictional fixtures,
not actual merchants. Original listings retain their upstream ratings. Each new
listing's rating is the average of its reviews. `review_count` is the number
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

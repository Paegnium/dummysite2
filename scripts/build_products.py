"""Generate scraper-friendly product pages from the static catalog (no dependencies)."""

import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def product_page(product):
    def field(name):
        return escape(str(product[name]), quote=True)

    reviews = "".join(
        f'<article class="review" data-field="review">'
        f'<p data-field="text">{escape(review["text"])}</p>'
        f'<p>Rating: <span data-field="rating">{review["rating"]}</span> / 5</p>'
        f'<time data-field="date" datetime="{escape(review["date"], quote=True)}">'
        f'{escape(review["date"])}</time></article>'
        for review in product["review"]
    )
    # Protect the script boundary even if future catalog text contains HTML.
    payload = json.dumps(product, ensure_ascii=False).replace("<", "\\u003c")
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{field('title')} — Tao Market</title>
<link rel="canonical" href="{field('product_url')}">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../styles.css">
<script type="application/json" id="product-data">{payload}</script>
</head>
<body>
<header class="container"><a class="brand" href="../index.html">Tao Market</a></header>
<main class="container product-page" data-product-id="{field('id')}">
<a class="back-link" href="../index.html#catalog">← Back to the collection</a>
<div class="detail-top">
<div class="detail-image"><img src="../{field('image')}" alt="{field('title')} illustration"></div>
<div class="detail-copy">
<span class="eyebrow">{field('category')}</span>
<h1 data-field="title">{field('title')}</h1>
<p>{field('description')}</p>
<p class="price"><span data-field="currency">{field('currency')}</span> <span data-field="price">{product['price']:.2f}</span></p>
<p>Rating: <span data-field="rating">{field('rating')}</span> / 5 · <span data-field="review_count">{field('review_count')}</span> reviews</p>
<dl class="seller-details">
<dt>Platform</dt><dd data-field="source_platform">{field('source_platform')}</dd>
<dt>Seller</dt><dd data-field="seller_name">{field('seller_name')}</dd>
<dt>Seller ID</dt><dd data-field="seller_id">{field('seller_id')}</dd>
<dt>Selling since</dt><dd><time data-field="selling_since" datetime="{field('selling_since')}">{field('selling_since')}</time></dd>
</dl>
<a class="product-permalink" data-field="product_url" href="{field('product_url')}">Product permalink</a>
</div></div>
<h2 class="review-heading">Ratings & reviews</h2>
{reviews}
<p class="fixture-note">Sample catalog: seller identities and selling dates are fictional fixtures. Product ratings, reviews, and prices are illustrative sample data.</p>
</main>
</body></html>
'''


def build():
    products = json.loads((ROOT / "products.json").read_text())
    output = ROOT / "products"
    output.mkdir(exist_ok=True)
    for product in products:
        (output / f"{product['id']}.html").write_text(product_page(product))
    links = "".join(
        f'<li><a href="{product["id"]}.html">{escape(product["title"])}</a></li>'
        for product in products
    )
    (output / "index.html").write_text(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>All products — Tao Market</title>'
        '<link rel="stylesheet" href="../styles.css"></head>'
        '<body><main class="container product-page"><a href="../index.html">Tao Market</a>'
        f'<h1>All products</h1><ul>{links}</ul></main></body></html>\n'
    )


if __name__ == "__main__":
    build()

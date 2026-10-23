import json
import unittest
from copy import deepcopy
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

from scripts.build_products import product_page

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    "source_platform", "title", "price", "currency", "seller_id", "seller_name",
    "selling_since", "rating", "review_count", "review", "product_url",
}


class Scraper(HTMLParser):
    """Extract visible fields and the JSON payload without executing JavaScript."""

    def __init__(self, html):
        super().__init__()
        self.fields = {}
        self.reviews = []
        self.active = None
        self.in_review = False
        self.in_json = False
        self.payload = ""
        self.links = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a":
            self.links.append(attrs["href"])
        if attrs.get("id") == "product-data":
            self.in_json = True
        field = attrs.get("data-field")
        if field == "review":
            self.in_review = True
            self.reviews.append({})
        elif field:
            target = self.reviews[-1] if self.in_review else self.fields
            target[field] = ""
            self.active = (tag, field, target)
            if field in ("product_url", "date", "selling_since"):
                target[field] = attrs.get("href", attrs.get("datetime", ""))
                self.active = None

    def handle_data(self, text):
        if self.in_json:
            self.payload += text
        if self.active:
            _, field, target = self.active
            target[field] += text

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_json = False
        if tag == "article":
            self.in_review = False
        if self.active and self.active[0] == tag:
            self.active = None


class ScrapingTests(unittest.TestCase):
    def test_every_product_is_scrapable_without_javascript(self):
        catalog = json.loads((ROOT / "products.json").read_text())
        directory = Scraper((ROOT / "products/index.html").read_text())
        sellers = {}
        for product in catalog:
            with self.subTest(product=product["id"]):
                self.assertTrue(FIELDS <= product.keys())
                self.assertEqual(product["review_count"], len(product["review"]))
                self.assertEqual(product["review_count"], len(product["reviews"]))
                self.assertIn(f'{product["id"]}.html', directory.links)
                url = urlparse(product["product_url"])
                self.assertEqual(url.scheme, "https")
                self.assertEqual(url.netloc, "paegnium.github.io")
                path = ROOT / url.path.removeprefix("/dummysite2/")
                html = path.read_text()
                self.assertEqual(html, product_page(product), "Regenerate static pages")
                scraped = Scraper(html)
                self.assertEqual(json.loads(scraped.payload), product)
                for name in FIELDS - {"review"}:
                    value = scraped.fields[name]
                    if name in {"price", "rating", "review_count"}:
                        self.assertEqual(float(value), product[name])
                    else:
                        self.assertEqual(value, product[name])
                self.assertEqual(len(scraped.reviews), product["review_count"])
                for actual, expected in zip(scraped.reviews, product["review"]):
                    self.assertEqual(actual["text"], expected["text"])
                    self.assertEqual(float(actual["rating"]), expected["rating"])
                    self.assertEqual(actual["date"], expected["date"])
                seller = (product["seller_name"], product["selling_since"])
                self.assertEqual(sellers.setdefault(product["seller_id"], seller), seller)

    def test_catalog_text_cannot_break_html_or_json_script(self):
        product = deepcopy(json.loads((ROOT / "products.json").read_text())[0])
        product["title"] = 'Sample </script><script>alert("x")</script> & <b>title</b>'
        product["review"][0]["text"] = '<img src=x onerror="alert(1)"> & review'
        html = product_page(product)
        scraped = Scraper(html)
        self.assertNotIn('<script>alert', html)
        self.assertNotIn('<img src=x', html)
        self.assertEqual(json.loads(scraped.payload), product)
        self.assertEqual(scraped.fields["title"], product["title"])
        self.assertEqual(scraped.reviews[0]["text"], product["review"][0]["text"])

"""
Fetch 100+ construction and building supplies from EstimationPro.ai free API
and normalize them into BuildBill's local catalog schema.
No API key required.
"""
import urllib.request
import json
import os
import sys
from datetime import datetime

TRADES = [
    ("drywall", "drywall", ["Drywall", "Finishing", "Interior"]),
    ("framing", "lumber", ["Framing", "Carpentry", "Rough Carpentry"]),
    ("concrete", "concrete", ["Foundation", "Slab", "Footings"]),
    ("roofing", "roofing", ["Roofing", "Weatherproofing"]),
    ("insulation", "insulation", ["Insulation", "Energy Efficiency"]),
    ("masonry", "masonry", ["Masonry", "Brickwork", "Stone"]),
    ("electrical", "other", ["Electrical", "Rough-in"]),
    ("plumbing", "other", ["Plumbing", "Rough-in"]),
    ("paint", "other", ["Painting", "Finishing"]),
    ("windows", "other", ["Glazing", "Exterior"]),
    ("doors", "other", ["Doors", "Interior/Exterior"]),
    ("gutters", "roofing", ["Roofing", "Drainage"]),
    ("waterproofing", "concrete", ["Foundation", "Basement"]),
    ("fence", "lumber", ["Exterior", "Fencing"]),
    ("tile", "masonry", ["Tile", "Finishing"]),
]

def fetch_trade_items(trade):
    url = f"https://estimationpro.ai/api/v1/costs?trade={trade}"
    req = urllib.request.Request(url, headers={"User-Agent": "BuildBill/1.0 (Mozilla/5.0)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode())
            return data.get("data", {}).get("items", [])
    except Exception as e:
        print(f"Warning: Failed to fetch trade {trade}: {e}")
        return []

def main():
    print("Starting building supplies catalog fetch from EstimationPro.ai...")
    all_products = []
    seen_ids = set()

    for trade_name, cat, compatible_jobs in TRADES:
        if len(all_products) >= 105:
            break
        print(f"Fetching costs for trade '{trade_name}'...")
        items = fetch_trade_items(trade_name)
        for item in items:
            item_id = item.get("id") or f"{trade_name}-{len(all_products)+1}"
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            desc = item.get("description", "Building Material")
            unit = item.get("unit", "each").strip().lower()
            
            # Unit price in typical USD dollars converted to integer cents
            typical_dollar = float(item.get("typical", 10.0))
            if typical_dollar <= 0:
                typical_dollar = float(item.get("low", 5.0))
            unit_price_cents = int(round(typical_dollar * 100))

            # Derive specifications and brand
            spec = f"{unit.upper()} — Trade: {trade_name.capitalize()}"
            brand = "Commercial Spec"
            sku = f"EP-{trade_name[:3].upper()}-{len(all_products)+1:04d}"

            product = {
                "id": f"prod-{item_id}",
                "brand": brand,
                "productName": desc,
                "specification": spec,
                "sku": sku,
                "category": cat,
                "compatibleJobTypes": compatible_jobs,
                "unit": unit,
                "quantityStep": 1 if unit in ["each", "sheet", "roll", "bag", "box", "sq ft"] else 0.5,
                "unitPriceCents": unit_price_cents,
                "currency": "USD",
                "retailer": "EstimationPro Baseline",
                "sourceUrl": f"https://estimationpro.ai/costs?trade={trade_name}",
                "market": "US National Average",
                "priceCheckedAt": item.get("lastVerified", datetime.now().strftime("%Y-%m-%d")),
                "catalogueStatus": "verified",
                "taxCategory": "taxable",
                "minQuantity": 1,
                "maxQuantity": 1000,
                "active": True
            }
            all_products.append(product)

    print(f"Successfully collected {len(all_products)} products.")

    # Write output to src/data/catalog.local.json and catalogue-meta.json
    output_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    os.makedirs(output_dir, exist_ok=True)

    catalog_path = os.path.join(output_dir, "catalog.local.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(all_products, f, indent=2)
    print(f"Saved catalog to {catalog_path}")

    meta = {
        "version": "1.0.0",
        "totalProducts": len(all_products),
        "source": "EstimationPro Open Construction API",
        "catalogueBuiltAt": datetime.now().strftime("%Y-%m-%d"),
        "currency": "USD",
        "market": "US National Benchmark"
    }
    meta_path = os.path.join(output_dir, "catalogue-meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Saved metadata to {meta_path}")

if __name__ == "__main__":
    main()

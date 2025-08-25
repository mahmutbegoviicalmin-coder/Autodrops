# Autodrops – AliExpress API Access Request

## Reason (for form)
Autodrops is an e‑commerce product research and fulfillment app for Shopify and WooCommerce merchants. We request access to the AliExpress API to:

1) Read the AliExpress catalog (prices, variants, stock, shipping options and delivery time) to display accurate product data to our users.
2) Estimate profit and shipping costs and help merchants select the best supplier/warehouse combinations.
3) Import selected products into the merchant’s store (authorized accounts only).
4) Create orders on behalf of the authenticated merchant and retrieve shipment tracking numbers to automate fulfillment.

Data usage is restricted to the authenticated merchant’s account after OAuth. We do not collect customer PII; we store only minimal product and order metadata required for fulfillment. API credentials are stored encrypted, we respect rate limits/retry policies, and we fully comply with AliExpress Terms of Service.

Purpose: streamline product selection and order synchronization to improve conversion and reduce operational workload for small and medium merchants.

Website: autodrops.io  
Contact: support@autodrops.io

---

## Attachment (one‑pager)
**Title:** Autodrops – Product Research & Fulfillment for Shopify/WooCommerce

### Overview
- Autodrops helps merchants discover profitable AliExpress products and automates product import and fulfillment.
- Core features: product discovery, profit/shipping estimates, one‑click import to stores, order & tracking sync.

### Requested Permissions (Scopes)
- Catalog read: product details, variants, pricing, images, attributes.
- Logistics/shipping read: shipping methods, costs, delivery time.
- Order create/read: place orders on behalf of the authenticated merchant and fetch tracking information.
- Warehouse/stock read: stock per warehouse to avoid out‑of‑stock.

### Data Handling & Security
- No customer PII collected. We store only product metadata and order references required for fulfillment.
- Secrets and API tokens encrypted at rest; least‑privilege access enforced.
- Rate‑limit aware requests with retries/backoff; audit logging for key API interactions.
- Retention: product cache up to 30 days; order references retained per merchant contract/policy.

### Compliance
- Full adherence to AliExpress API Terms and branding/content policies.
- OAuth‑based consent with revocation available at any time.

### Company & Contact
- Website: autodrops.io  
- Email: support@autodrops.io

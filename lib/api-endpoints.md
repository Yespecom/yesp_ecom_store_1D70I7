# API Endpoints Currently Used

## Base URL
\`\`\`
https://api.yespstudio.com/api/1D70I7
\`\`\`

## Product Endpoints

### 1. Get All Products
**Endpoint:** `GET /products`
**URL:** `https://api.yespstudio.com/api/1D70I7/products`
**Query Parameters:**
- `category` - Filter by category ID
- `search` - Search query string
- `page` - Page number for pagination
- `limit` - Number of products per page
- `sortBy` - Sort field (price_low, price_high, newest, name)
- `sortOrder` - Sort direction (asc, desc)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `featured` - Filter featured products (boolean)
- `inStock` - Filter in-stock products (boolean)

### 2. Get Featured Products
**Endpoint:** `GET /featured`
**URL:** `https://api.yespstudio.com/api/1D70I7/featured`
**Query Parameters:**
- `limit` - Number of featured products to return (default: 8)

### 3. Get Single Product
**Endpoint:** `GET /products/{productId}`
**URL:** `https://api.yespstudio.com/api/1D70I7/products/{productId}`

### 4. Search Products
**Endpoint:** `GET /search`
**URL:** `https://api.yespstudio.com/api/1D70I7/search`
**Query Parameters:**
- `q` - Search query string
- Additional filter parameters

### 5. Get Categories
**Endpoint:** `GET /categories`
**URL:** `https://api.yespstudio.com/api/1D70I7/categories`
**Query Parameters:**
- `includeProductCount` - Include product count for each category (boolean)

## Expected Response Format

### Products Response:
\`\`\`json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "6884c670e7f4c023cd398dd8",
        "name": "Happie Comfort Cotton T-Shirt",
        "description": "Product description...",
        "shortDescription": "Short description...",
        "slug": "happie-comfort-cotton-t-shirt",
        "sku": "H762026C44",
        "price": 499,
        "originalPrice": 699,
        "gallery": ["image1.jpg", "image2.jpg"],
        "thumbnail": "thumbnail.jpg",
        "inventory": {
          "quantity": 1000,
          "lowStockThreshold": 5
        },
        "isActive": true,
        "isFeatured": false,
        // ... other fields
      }
    ],
    "totalProducts": 100,
    "totalPages": 10,
    "currentPage": 1
  }
}
\`\`\`

### Featured Products Response:
\`\`\`json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      // ... product fields
    }
  ]
}

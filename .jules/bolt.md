## 2026-08-22 - [MongoDB Memory Optimization]
**Learning:** Loading an entire MongoDB collection into memory with `Product.find({}).lean()` to perform a manual array  search for calculated or fallback IDs causes massive CPU and memory bottlenecks.
**Action:** Use projection (e.g., `Product.find({}, { _id: 1 })`) to fetch only the minimally required fields into memory, find the specific match locally, and then query the database for just that one full document (`Product.findById(match._id)`).

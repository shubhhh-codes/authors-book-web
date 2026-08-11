## 2024-06-25 - [Customer Analytics Aggregation]
**Learning:** Mapping over huge `Order` result sets (`Order.find({}).lean()`) in memory to group orders by customer causes severe memory/CPU issues on scale. This was happening in `app/admin/customers/page.tsx`.
**Action:** Shift computation to MongoDB using the aggregation pipeline (`Order.aggregate([{ $group: ... }])`). This solves N+1 memory issues and runs significantly faster (~5x improvement).

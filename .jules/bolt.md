## 2024-05-19 - [Performance Optimization in Array Operations]
**Learning:** Overwriting existing repository files to run quick benchmarks is a destructive practice that must be strictly avoided. The repository's state must remain clean of scratchpad files.
**Action:** In the future, create separate temporary files for benchmarking (e.g., `temp_benchmark.js`) and ensure they are removed via bash commands (`rm`) before finalizing changes, or use `node -e` for small inline scripts.

# Archive76 Performance Benchmarks

This document records the benchmark environment, methodology and results for
Archive76 performance work. Performance is a product requirement (see
`DEVELOPMENT.md` §8–9 and `AGENTS.md`).

The benchmark environment below was captured at benchmark time. It should be
updated whenever a meaningful benchmark run is performed. Results for a given
run are stored in `benchmarks/` and referenced from this file.

---

## Benchmark environment

Captured on the development machine. Re-capture before a published performance
run that should stand as a baseline.

### Machine

| Property              | Value                                   |
| --------------------- | --------------------------------------- |
| OS                    | Windows 11 (Build 26200.9168)           |
| CPU                   | 12th Gen Intel Core i5-1235U (10 cores, 12 threads) |
| RAM                   | 8 GB (8,406,097,920 bytes)              |
| GPU                   | Intel Iris Xe Graphics (Vivi Display Adapter present) |
| Storage               | KIOXIA THGJFAT0T44BAILB, 127,919,554,560 bytes (~127.9 GB) NVMe SSD |
| Display               | 1536 × 1024                              |
| Windows power mode    | High performance (Scheme GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c) |

### Build / toolchain

| Property            | Value                          |
| ------------------- | ------------------------------ |
| Release/debug       | Release                        |
| Compiler            | rustc / cargo (see `rust-toolchain.toml` once added) |
| Tauri version       | tauri 2 (to be confirmed on first build) |
| React version       | react 18 + react-dom 18 (once scaffolded) |
| Rust version        | stable (see `rust-toolchain.toml`) |

These are populated from the build configuration in use at benchmark time.
As M2 scaffolding is established, pin exact versions here so results are
reproducible.

### Dataset

| Property                     | Value |
| ---------------------------- | ----- |
| Number of catalogue records  | (seeded — to be measured once M2 schema exists) |
| Number of images             | n/a (image cache not yet implemented) |
| Database size                | n/a |
| FTS5 index size              | n/a |

Dataset records are stored under `benchmarks/` as fixed fixtures so that
benchmark inputs are reproducible across runs and machines.

### Measurement methodology

Benchmarking follows the measure → identify bottleneck → change → re-measure →
compare → document cycle required by `DEVELOPMENT.md` §9.

* All timings are wall-clock, averaged over `N` repetitions with a warm cache
  unless a cold-path measurement is explicitly required.
* The first run after a clean build is treated as a cold run; subsequent runs
  are warm runs.
* `p50` and `p95` percentiles are reported in addition to the mean.
* For UI/rendering benchmarks, the browser DevTools/Performance API or
  Tauri's profiling hooks measure end-to-end latency from trigger to frame
  present.
* For database benchmarks, the Rust test harness or a dedicated benchmark
  binary (criterion-style or `std::time::Instant`) measures query time. The
  dataset is loaded into an isolated test database; no production user data is
  used.
* For startup benchmarks, measurement begins at process launch and ends when
  the first interactive frame is presented. Warm startup is measured with the
  OS file cache hot and the database already initialised.
* Benchmarks are never run against the user's production database; a fixture
  or temporary database is used.

## Recording results

Benchmark outputs live under `benchmarks/`. Each result file is named
`<run>-<timestamp>.json` and contains raw timings plus the environment block
above. This `PERFORMANCE.md` records the headline targets and links to the
latest result files.

## Performance targets

Targets are defined in `DEVELOPMENT.md` §8 and summarised here.

| Operation              | Target           |
| ---------------------- | --------------- |
| Warm startup           | < 500 ms        |
| Cold startup           | < 1 s           |
| Search p95             | < 50 ms         |
| Common filtering p95   | < 50 ms         |
| Typical UI interaction | < 50 ms         |
| Catalogue scrolling    | sustained 60 FPS |
| Catalogue memory usage | bounded as dataset grows |

If a target cannot be met, investigate the actual bottleneck before weakening
the target.

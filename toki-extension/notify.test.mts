import assert from "node:assert"

import { shouldNotify } from "./shared/notify.ts"

assert.strictEqual(shouldNotify(null, 100), false, "no prev reading → no notify")
assert.strictEqual(shouldNotify(10, 15), true, "balance increased → notify")
assert.strictEqual(shouldNotify(15, 15), false, "no change → no notify")
assert.strictEqual(shouldNotify(15, 10), false, "balance decreased → no notify")
assert.strictEqual(shouldNotify(0, 5), true, "0 → 5 (prev not null) → notify")

console.log("shouldNotify unit tests: PASS (5/5)")

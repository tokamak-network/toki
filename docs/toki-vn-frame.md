# Toki VN Frame — the shared visual-novel page layout

Every Toki "talking sub-page" (a full-screen scene with **Toki on the left**, a
**dialogue bar at the bottom**, and a **menu/quest panel on the right**) uses the
exact same frame. Match it pixel-for-pixel when you build a new sub-page so the
hub feels like one continuous game, not a set of slightly-different screens.

> **Why this doc exists:** the sizing drifted twice (once building `/get-ton`,
> once building the `/agent` key gate). Both times the **character rendered ~66%
> too small** because of one easy-to-miss flex detail (see the Gotcha). Copy the
> skeleton below verbatim and you will not hit it again.

## Source of truth

`src/components/staking/StakingScreen.tsx` is the canonical implementation. The
`TokiCharacter` and `DialogueBar` components there are the reference. Pages that
must stay identical to it:

| Page | File | Status |
|------|------|--------|
| `/staking` | `src/components/staking/StakingScreen.tsx` | **canonical** |
| `/get-ton` | `src/components/getton/GetTonView.tsx` | matches |
| `/agent` (key gate) | `src/components/agent/AgentWorkspace.tsx` (`if (!hasKey)` return) | matches |

When you add a page, add a row here.

## The frame skeleton (copy verbatim)

```tsx
<div className="fixed inset-0 overflow-hidden">
  {/* 1. full-bleed background + scrim */}
  <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
       style={{ backgroundImage: "url('/backgrounds/staking-dawn.png')" }} />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

  {/* 2. optional back-to-hub pill — note top-20 (clears the fixed 64px Header) */}
  <Link href="/dashboard"
        className="absolute left-4 top-20 z-30 inline-flex items-center gap-1.5 rounded-full
                   border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-gray-300
                   backdrop-blur-md hover:text-accent-cyan">
    ‹ Back
  </Link>

  {/* 3. MID: character (left 40%) + panel (right 60%) */}
  <div className="absolute inset-x-0 top-16 bottom-[176px] z-10 flex items-center justify-center">
    <div className="max-w-3xl w-full mx-auto flex items-end h-full">

      {/* LEFT — Toki. Keep ALL three wrapper levels (see Gotcha). */}
      <div className="hidden md:flex w-[40%] items-end justify-center">
        <div className="flex justify-center z-10">
          <div className="relative w-64 sm:w-80 md:w-96 lg:w-[28rem] aspect-[3/4] overflow-visible">
            <div className="absolute inset-[15%] bottom-0 rounded-full blur-3xl -z-10
                            animate-glow-pulse opacity-40"
                 style={{ backgroundColor: "rgba(34,211,238,0.35)" }} />
            <img src="/characters/toki-welcome.png" alt="Toki"
                 className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* RIGHT — panel. max-w-sm, bottom-aligned. */}
      <div className="w-full md:w-[60%] flex items-end justify-center pb-4 px-4 md:px-0">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5
                          shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            {/* …panel content… */}
          </div>
        </div>
      </div>

    </div>
  </div>

  {/* 4. BOTTOM: dialogue bar, constrained to the same max-w-3xl as the mid row */}
  <div className="absolute bottom-0 left-0 right-0 z-20">
    <div className="max-w-3xl mx-auto">
      {/* DialogueBar: inner box is h-[160px] sm:h-[176px] — must equal the mid's bottom-[176px] */}
    </div>
  </div>
</div>
```

## The Gotcha — the character must NOT be a direct flex child

The left column is `w-[40%]` (≈294px inside `max-w-3xl`). The character box is a
**fixed** `lg:w-[28rem]` (448px) and is *meant to overflow that column* — that
overflow is what makes Toki big.

If you put the sized character box **directly** inside the `w-[40%]` column, it
becomes a flex item with `flex-shrink: 1` and `min-width: auto`, so flex shrinks
it down to the 294px column width — Toki renders at **~66% size**.

The fix (already in the skeleton) is the **`flex justify-center z-10` wrapper**
plus **`overflow-visible`** on the sized box. The wrapper absorbs the flex
sizing so the inner box keeps its intrinsic 448px and overflows the column,
centered and bottom-aligned.

```
✅ column ▸ flex-justify-center wrapper ▸ w-[28rem] box (overflow-visible)   → 448px, correct
❌ column ▸ w-[28rem] box (direct flex child)                                → 294px, shrunk
```

## Fixed values — don't change these per-page

| Token | Value | Notes |
|-------|-------|-------|
| Mid band | `top-16 bottom-[176px]` | `top-16` clears the 64px fixed Header |
| Row width | `max-w-3xl` (768px) | mid **and** dialogue use the same width |
| Split | `w-[40%]` / `w-[60%]` | character / panel |
| Character width | `w-64 sm:w-80 md:w-96 lg:w-[28rem]` | 256 → 320 → 384 → 448 |
| Character ratio | `aspect-[3/4]` + `object-contain object-bottom` | sprite is bottom-anchored |
| Panel | `max-w-sm` (384px) | `bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5` |
| Dialogue height | `h-[160px] sm:h-[176px]` | must equal the mid's `bottom-[176px]` |
| Character sprite | `/characters/toki-welcome.png` | use the same step-0 sprite as staking unless the page has its own mood logic |

Mobile (`< md`): the character column is `hidden`, the panel goes full-width.

## Verify parity (regression check)

At viewport **1280×800**, the character and panel land at exact pixels. Compare a
new page against `/get-ton`:

```bash
# agent-browser; run on the new page, then on /get-ton — numbers must match.
agent-browser set viewport 1280 800
agent-browser open "http://localhost:3000/<page>"
agent-browser eval '(()=>{const c=document.querySelector("img[class*=drop-shadow]").getBoundingClientRect();const p=document.querySelector(".animate-slide-up").getBoundingClientRect();return JSON.stringify({char:{w:Math.round(c.width),h:Math.round(c.height),bottom:Math.round(c.bottom)},panel:{w:Math.round(p.width),left:Math.round(p.left)}});})()'
```

Expected at 1280×800:

```json
{"char":{"w":448,"h":597,"bottom":624},"panel":{"w":384,"left":602}}
```

If `char.w` comes back ~294 instead of 448, you hit the Gotcha — you're missing
the `flex justify-center` wrapper and/or `overflow-visible`.

## Checklist for a new VN sub-page

- [ ] Root `fixed inset-0 overflow-hidden` + background + scrim
- [ ] Mid band `top-16 bottom-[176px]`, inner `max-w-3xl … flex items-end h-full`
- [ ] Character has **all three** wrapper levels (column → `flex justify-center` → sized box) and `overflow-visible`
- [ ] Panel is `max-w-sm`, right column has `pb-4 px-4 md:px-0`
- [ ] Dialogue bar inner is `h-[160px] sm:h-[176px]`, wrapped in `max-w-3xl mx-auto`
- [ ] Back pill (if any) at `top-20` so it clears the Header
- [ ] Measured at 1280×800 → `char 448×597 @ bottom 624`, `panel 384 @ left 602`
- [ ] Added a row to the page table above

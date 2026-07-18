# Weight Calculator & Metals–Composites Comparison

## TABLE OF CONTENTS
1. [Weight Calculation Formula](#1-weight-calculation-formula)
2. [Volume Formulas — Common Shapes](#2-volume-formulas--common-shapes)
3. [Worked Examples](#3-worked-examples)
4. [Cross-Material Comparison Tables](#4-cross-material-comparison-tables)
5. [Material Selection Framework](#5-material-selection-framework)
6. [Cost Index Reference](#6-cost-index-reference)

---

## 1. Weight Calculation Formula

```
Mass (kg) = Density (kg/m³) × Volume (m³)
Mass (g)  = Density (g/cm³) × Volume (cm³)
Weight (N)   = Mass (kg) × 9.81
Weight (lbf) = Mass (kg) × 2.2046
```

### Unit Conversions
```
1 g/cm³  = 1000 kg/m³
1 kg     = 2.2046 lbs
1 cm³    = 1,000 mm³  =  0.000001 m³
1 m³     = 1,000,000 cm³
1 in³    = 16.387 cm³
1 ft³    = 28,317 cm³
```

---

## 2. Volume Formulas — Common Shapes

| Shape | Formula | Notes |
|---|---|---|
| Box / Plate / Block | V = L × W × H | All same units |
| Solid Cylinder / Rod | V = (π/4) × D² × L | D = diameter |
| Hollow Cylinder / Tube | V = (π/4) × (D_o² − D_i²) × L | D_o = OD, D_i = ID |
| Sphere | V = (π/6) × D³ | |
| Hollow Sphere | V = (π/6) × (D_o³ − D_i³) | |
| Cone | V = (π/12) × D² × H | D = base diameter |
| Hex Bar (flat-to-flat = F) | V = 0.866 × F² × L | |
| Square Bar | V = a² × L | a = side |
| Ring / Torus | V = π² × R × r² | R = center radius, r = wire radius |
| I-Beam (approx.) | V = (2 × b × t_f + h × t_w) × L | b=flange, h=web height, t=thickness |

---

## 3. Worked Examples

### Example 1 — Steel Plate
- **Size:** 600 × 400 × 12 mm
- **Material:** AISI 1018 Steel (ρ = 7.87 g/cm³)
- **Volume:** 600 × 400 × 12 = 2,880,000 mm³ = **2,880 cm³**
- **Mass:** 7.87 × 2,880 = 22,666 g = **22.7 kg = 50.0 lbs** ✅

### Example 2 — Aluminum Round Bar
- **Size:** Ø 60mm × 500mm
- **Material:** Al 6061-T6 (ρ = 2.70 g/cm³)
- **Volume:** π/4 × 60² × 500 = 1,413,717 mm³ = **1,413.7 cm³**
- **Mass:** 2.70 × 1,413.7 = 3,817 g = **3.82 kg = 8.42 lbs** ✅

### Example 3 — Stainless Steel Tube
- **Size:** OD 50mm, ID 44mm, Length 1000mm
- **Material:** SS 316 (ρ = 7.99 g/cm³)
- **Volume:** π/4 × (50² − 44²) × 1000 = π/4 × (2500−1936) × 1000 = 443,053 mm³ = **443.1 cm³**
- **Mass:** 7.99 × 443.1 = 3,540 g = **3.54 kg = 7.81 lbs** ✅

### Example 4 — Weight Saving Comparison (Same Part Volume = 1000 cm³)
| Material | Density (g/cm³) | Mass (kg) | vs Steel | Saving (kg) |
|---|---|---|---|---|
| AISI 4140 Steel | 7.85 | 7.85 | reference | — |
| Stainless 316 | 7.99 | 7.99 | +1.8% | −0.14 |
| Titanium Ti-6Al-4V | 4.43 | 4.43 | −44% | **+3.42** |
| Aluminum 6061-T6 | 2.70 | 2.70 | −66% | **+5.15** |
| Aluminum 7075-T6 | 2.81 | 2.81 | −64% | **+5.04** |
| CFRP (UD laminate) | 1.58 | 1.58 | −80% | **+6.27** |
| GFRP (UD laminate) | 2.00 | 2.00 | −75% | **+5.85** |
| Al/SiC MMC (20%) | 2.77 | 2.77 | −65% | **+5.08** |

---

## 4. Cross-Material Comparison Tables

### 4.1 Structural Performance (Specific Properties)

| Material | Density (g/cm³) | UTS (MPa) | Sp. Strength | E (GPa) | Sp. Stiffness | Max Temp (°C) |
|---|---|---|---|---|---|---|
| AISI 1018 Steel | 7.87 | 440 | 56 | 200 | 25.4 | 400 |
| AISI 4140 Steel | 7.85 | 850 | 108 | 205 | 26.1 | 400 |
| AISI 304 SS | 8.00 | 515 | 64 | 193 | 24.1 | 870 |
| AISI 316 SS | 7.99 | 580 | 73 | 193 | 24.2 | 870 |
| Ti-6Al-4V | 4.43 | 950 | **214** | 113.8 | 25.7 | 315 |
| Al 6061-T6 | 2.70 | 310 | 115 | 68.9 | 25.5 | 150 |
| Al 7075-T6 | 2.81 | 572 | **204** | 71.7 | 25.5 | 120 |
| Inconel 718 | 8.22 | 1380 | 168 | 200 | 24.3 | 704 |
| CFRP (UD, 0°) | 1.58 | 1750 | **1108** | 140 | **88.6** | 180 |
| CFRP (QI laminate) | 1.55 | 600 | 387 | 60 | 38.7 | 180 |
| GFRP (UD) | 2.00 | 850 | 425 | 43 | 21.5 | 120 |
| Aramid/Epoxy (UD) | 1.38 | 1400 | 1014 | 70 | 50.7 | 150 |
| Al/SiC (20%) | 2.77 | 425 | 153 | 97 | 35.0 | 300 |

*Sp. Strength = UTS/Density (MPa·cm³/g) — higher = lighter for same strength*
*Sp. Stiffness = E/Density (GPa·cm³/g) — higher = lighter for same stiffness*

---

### 4.2 Thermal Performance

| Material | Thermal Cond. (W/m·K) | CTE (μm/m·°C) | Max Cont. Temp (°C) | Category |
|---|---|---|---|---|
| Copper C11000 | 391 | 17.0 | 200 | Metal |
| Al 6061 | 167 | 23.6 | 150 | Metal |
| Al/SiC (20%) | 140–165 | 16.4 | 300 | MMC |
| Cu/W (80%W) | 180–200 | 7.0–9.0 | 600 | MMC |
| C/C Composite | 150–400* | 1.0–2.0 | 3000 (inert) | CMC |
| Steel 4140 | 42.6 | 12.3 | 400 | Metal |
| SS 316 | 16.3 | 16.0 | 870 | Metal |
| Ti-6Al-4V | 7.2 | 8.6 | 315 | Metal |
| Inconel 718 | 11.4 | 13.0 | 704 | Metal |
| CFRP (fiber dir.) | 5–7* | 0–2 | 180 | PMC |
| GFRP | 0.3–0.4 | 12–20 | 120 | PMC |
| SiC/SiC CMC | 20–30 | 4.0–5.0 | 1400 | CMC |

*Anisotropic — value depends on direction

---

### 4.3 Manufacturing Process Compatibility

| Material | Machining | Welding | Casting | Forming | 3D Print | Key Tooling |
|---|---|---|---|---|---|---|
| Carbon Steel | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅ (WAAM) | HSS / Carbide |
| Stainless Steel | ✅ | ✅ | ✅ | ✅ | ✅ (LPBF) | Carbide, TiN coated |
| Al alloys | ✅✅ | ✅ | ✅✅ | ✅✅ | ✅ (LPBF) | HSS / Uncoated carbide |
| Ti-6Al-4V | ⚠️ | ⚠️ (inert gas) | ⚠️ | ⚠️ | ✅ (LPBF/EBM) | Carbide, low speed, flood cool |
| Inconel | ⚠️ | ✅ | ✅ | ⚠️ | ✅ (LPBF) | Carbide, low speed |
| CFRP (laminate) | ✅ | ❌ | ❌ | ✅ (prepreg) | ✅ (Markforged) | PCD / Diamond, DRY only |
| GFRP (laminate) | ✅ | ❌ | ❌ | ✅ (hand layup) | ❌ | Carbide (short life) |
| CF-PA66 (inj.) | ✅ | ❌ | ❌ | ✅✅ (inj. mold) | ✅ (FDM-CF) | Carbide |
| Al/SiC MMC | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | PCD ONLY |
| C/C Composite | ✅ | ❌ | ❌ | ❌ | ⚠️ | Diamond |

---

## 5. Material Selection Framework

### Decision Flowchart

```
START
  │
  ├─ Temp > 700°C? ──YES──► Nickel superalloy (Inconel) or CMC
  │
  ├─ Temp 300–700°C? ─YES─► Steel 4140 / SS 316 / Ti-6Al-4V
  │
  ├─ Weight critical?
  │    ├─ Budget HIGH ──► CFRP or Ti-6Al-4V
  │    ├─ Budget MED  ──► Al 7075 or GFRP
  │    └─ Budget LOW  ──► Al 6061
  │
  ├─ Corrosive environment?
  │    ├─ Salt/Marine ──► SS 316 or GFRP
  │    ├─ Chemical    ──► SS 316L or GFRP/CFRP
  │    └─ General     ──► SS 304
  │
  ├─ High wear + lightweight?
  │    └──► Al/SiC MMC
  │
  ├─ Complex shape + moderate load?
  │    └──► Al die cast or CF-PA66 (injection)
  │
  └─ Cost is top priority?
       └──► Carbon steel (1018/4140) or GFRP (CSM)
```

### Performance Indices (Ashby)

| Objective | Performance Index | Formula |
|---|---|---|
| Min weight (stiffness, beam) | E^½ / ρ | √(Modulus) / Density |
| Min weight (stiffness, panel) | E^⅓ / ρ | ∛(Modulus) / Density |
| Min weight (strength, rod) | σ_y / ρ | Yield Strength / Density |
| Min cost (strength) | σ_y / (ρ × C_m) | Strength / (Density × $/kg) |

---

## 6. Cost Index Reference

*Relative cost — Carbon Steel 1018 machined part = 1.0*

| Material | Cost Index | Notes |
|---|---|---|
| Carbon Steel 1018 | 1.0 | **Reference** |
| Carbon Steel 4140 | 1.2–1.8 | |
| Cast Iron (gray) | 0.6–0.9 | |
| Stainless 304 | 3.0–4.0 | |
| Stainless 316 | 4.0–5.5 | |
| Aluminum 6061-T6 | 2.0–3.0 | |
| Aluminum 7075-T6 | 4.5–6.5 | |
| Titanium Grade 2 | 15–25 | |
| Ti-6Al-4V | 25–40 | |
| Inconel 718 | 80–120 | |
| GFRP laminate (E-glass/epoxy) | 5–15 | Depends on geometry |
| CFRP laminate (T700/epoxy) | 50–200 | Depends on process |
| CF-PA66 (injection molded part) | 8–20 | High volume = lower cost |
| Al/SiC MMC | 20–40 | |
| C/C Composite | 200–1000 | Extreme applications only |
| SiC/SiC CMC | 500–2000 | Aerospace only |

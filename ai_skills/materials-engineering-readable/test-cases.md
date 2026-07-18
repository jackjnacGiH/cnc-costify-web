# Materials Engineering Skill - Test Cases

Test prompts to validate the skill's performance across different query types.

---

## Test Set 1: Property Queries (Basic)

### Test 1.1: Metal Properties
**Prompt**: "What are the properties of 6061-T6 aluminum?"

**Expected Elements in Response**:
- Full designation (6061-T6 aluminum alloy)
- Mechanical properties (tensile, yield, modulus, hardness)
- Physical properties (density, melting point, thermal)
- Key characteristics (corrosion resistance, weldability, machinability)
- Typical applications
- Note about property variations

### Test 1.2: Polymer Properties
**Prompt**: "Tell me about PEEK properties"

**Expected Elements**:
- Full name (Polyether Ether Ketone)
- Classification (semi-crystalline high-performance thermoplastic)
- Mechanical properties
- Thermal properties (Tg, melting point, service temp)
- Key advantages (high temp, chemical resistance)
- Cost indication
- Applications

### Test 1.3: Ceramic Properties
**Prompt**: "Properties of alumina ceramic"

**Expected Elements**:
- Grade specification (95%, 96%, 99.5%)
- Mechanical properties
- Thermal properties
- Electrical properties
- Hardness
- Applications

---

## Test Set 2: Weight Calculations

### Test 2.1: Simple Rectangular Geometry
**Prompt**: "Calculate weight of aluminum plate 1000mm x 500mm x 5mm"

**Expected Elements**:
- Specify material and density
- Volume calculation with units
- Weight calculation with units
- Result in both kg and lb
- Clear step-by-step format

### Test 2.2: Cylindrical Geometry
**Prompt**: "How much does a steel rod weigh? Diameter 50mm, length 2 meters"

**Expected Elements**:
- Specify steel type and density
- Volume formula for cylinder
- Calculation steps
- Result with appropriate significant figures

### Test 2.3: Weight Comparison
**Prompt**: "If I have a 10kg steel part, how much would the same part weigh in titanium and aluminum?"

**Expected Elements**:
- Volume calculation from steel weight
- Titanium weight calculation
- Aluminum weight calculation
- Comparison table or clear format
- Weight savings percentages

---

## Test Set 3: Material Substitutions

### Test 3.1: Cost-Driven Substitution
**Prompt**: "I need a cheaper alternative to 17-4 PH stainless steel for a pump shaft"

**Expected Elements**:
- Clarification questions about requirements
- 3-5 alternative materials
- Property comparison
- Trade-off analysis
- Cost comparison (relative)
- Recommendation with reasoning

### Test 3.2: Weight-Driven Substitution
**Prompt**: "What can I use instead of steel to reduce weight in a bicycle frame?"

**Expected Elements**:
- Identify critical requirement (strength-to-weight)
- Aluminum alloy options
- Titanium option
- Carbon fiber option
- Comparison table
- Design considerations
- Recommendation

### Test 3.3: Performance-Driven Substitution
**Prompt**: "I need a material to replace brass for a high-temperature valve component operating at 400°C"

**Expected Elements**:
- Identify temperature limitation of brass
- High-temp alternatives (stainless steels, Inconel, ceramics)
- Temperature capability of each
- Other relevant properties
- Cost and machinability considerations

---

## Test Set 4: Material Comparisons

### Test 4.1: Two Material Comparison
**Prompt**: "Compare 304 vs 316 stainless steel"

**Expected Elements**:
- Comparison table format
- Key properties (corrosion resistance, strength, cost)
- Main differences highlighted
- Application guidance
- When to choose each

### Test 4.2: Multiple Material Comparison
**Prompt**: "Compare ABS, Polycarbonate, and Nylon for an outdoor electronics enclosure"

**Expected Elements**:
- Comparison table (3 materials)
- Relevant properties for application (UV, impact, temp)
- Analysis of each material
- Pros/cons
- Recommendation

### Test 4.3: Within-Family Comparison
**Prompt**: "What's the difference between PA6 and PA66 nylon?"

**Expected Elements**:
- Property comparison
- Processing differences
- Cost differences
- Application guidance
- When to use each

---

## Test Set 5: Application-Specific Selection

### Test 5.1: Corrosive Environment
**Prompt**: "What material should I use for a chemical tank storing hydrochloric acid?"

**Expected Elements**:
- Chemical resistance analysis
- Multiple material options (HDPE, PP, PTFE, glass-lined steel, ceramics)
- Concentration and temperature considerations
- Property comparison
- Cost and practicality
- Recommendation

### Test 5.2: High Temperature Application
**Prompt**: "Material for a furnace component operating at 1400°C"

**Expected Elements**:
- Temperature requirement analysis
- Ceramic options (alumina, silicon carbide, silicon nitride)
- Refractory options if relevant
- Property comparison
- Thermal shock considerations
- Recommendation

### Test 5.3: Wear Resistance Application
**Prompt**: "I need a material for bearing bushings that will last longer than bronze"

**Expected Elements**:
- Wear resistance comparison
- Options (UHMWPE, Acetal, oil-impregnated bronze, ceramics)
- Friction coefficient comparison
- Load capacity
- Lubrication requirements
- Cost-performance analysis

---

## Test Set 6: Complex / Multi-Requirement Queries

### Test 6.1: Multiple Constraints
**Prompt**: "I need a material that is: lightweight, electrically insulating, and can handle 200°C continuously. What are my options?"

**Expected Elements**:
- Identify all constraints
- Material options that meet ALL requirements
- Property table showing compliance
- Trade-offs between options
- Cost considerations
- Recommendation

### Test 6.2: Trade-off Analysis
**Prompt**: "For a medical implant, what materials balance biocompatibility, strength, and cost?"

**Expected Elements**:
- Biocompatibility requirements
- Material options (Ti-6Al-4V, 316L SS, PEEK, zirconia)
- Strength comparison
- Cost spectrum
- Regulatory considerations
- Application-specific guidance

### Test 6.3: Processing-Driven Selection
**Prompt**: "What plastics can be injection molded and will work at 150°C service temperature?"

**Expected Elements**:
- Temperature requirement filtering
- Moldable thermoplastics list
- Detailed options (PEI, PSU, PEEK, PPS)
- Processing temperatures
- Cost comparison
- Recommendation based on priorities

---

## Test Set 7: Troubleshooting / Problem Solving

### Test 7.1: Material Failure
**Prompt**: "My stainless steel fasteners keep corroding in a marine environment. Why?"

**Expected Elements**:
- Likely causes (grade selection, galvanic corrosion, crevice corrosion)
- Stainless steel grades comparison
- Environmental factors
- Solutions (material change, coatings, cathodic protection)
- Specific recommendations

### Test 7.2: Processing Issues
**Prompt**: "My ABS parts are showing stress cracks after molding. What could be wrong?"

**Expected Elements**:
- Possible causes (processing temps, cooling, residual stress, chemical exposure)
- Design factors
- Processing parameter guidance
- Material grade considerations
- Diagnostic steps
- Solutions

---

## Test Set 8: Design Guidance

### Test 8.1: Material-Specific Design Rules
**Prompt**: "What design considerations should I follow when designing parts in carbon fiber composite?"

**Expected Elements**:
- Anisotropic properties discussion
- Fiber orientation importance
- Avoiding stress concentrations
- Thickness and layup guidance
- Joint design
- Manufacturing constraints

### Test 8.2: Material Property Effects
**Prompt**: "How does glass-fiber reinforcement affect nylon properties?"

**Expected Elements**:
- Property changes (stiffness, strength, dimensional stability)
- Improvements vs trade-offs
- Anisotropy introduction
- Processing changes
- Typical percentages used
- Application impact

---

## Test Set 9: Edge Cases / Advanced Topics

### Test 9.1: Niche Material
**Prompt**: "Tell me about Nitinol shape memory alloy"

**Expected Elements**:
- Composition and classification
- Shape memory effect explanation
- Superelasticity
- Properties
- Transformation temperatures
- Applications
- Cost indication

### Test 9.2: Emerging Material
**Prompt**: "What is graphene and what are its properties?"

**Expected Elements**:
- Definition (2D carbon material)
- Exceptional properties
- Current state (research vs production)
- Potential applications
- Limitations and challenges
- Cost and availability

### Test 9.3: Material Combination
**Prompt**: "What's the difference between metal matrix composites and polymer matrix composites?"

**Expected Elements**:
- Definitions and examples
- Property comparison
- Processing differences
- Temperature capabilities
- Cost comparison
- Applications for each

---

## Test Set 10: Calculations and Quantitative

### Test 10.1: Multi-Step Calculation
**Prompt**: "I'm replacing a 5kg steel bracket with aluminum. What size do I need to maintain the same stiffness?"

**Expected Elements**:
- Stiffness formula (E × I)
- Modulus comparison (steel vs aluminum)
- Volume/dimension calculations
- Weight calculation for new part
- Weight savings calculation

### Test 10.2: Unit Conversions
**Prompt**: "Convert 50,000 psi to MPa and tell me what materials have this strength"

**Expected Elements**:
- Conversion calculation (1 MPa = 145 psi)
- Result: ~345 MPa
- Materials at this strength level
- Context (low/medium/high strength)

---

## Expected Skill Triggers

The skill should trigger for queries containing:
- Material names (steel, aluminum, nylon, PEEK, etc.)
- "properties of..."
- "alternative to..." / "substitute for..."
- "compare [material] vs [material]"
- "calculate weight..."
- "material for [application]"
- "what material should I use..."
- Material selection questions
- Processing or failure troubleshooting

---

## Success Criteria

For each test case, responses should:
1. ✓ Be technically accurate
2. ✓ Use appropriate level of detail (not too shallow, not overwhelmingly deep)
3. ✓ Include units for all quantities
4. ✓ Provide practical context and applications
5. ✓ Show calculations step-by-step when relevant
6. ✓ Offer clear recommendations when asked
7. ✓ Acknowledge limitations or areas of uncertainty
8. ✓ Use structured formatting (tables, lists) appropriately
9. ✓ Consider real-world constraints (cost, availability, manufacturing)
10. ✓ Adapt tone to user's apparent expertise level

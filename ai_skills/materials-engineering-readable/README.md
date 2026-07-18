# Materials Engineering Agent Skill

A comprehensive skill for Claude that enables expert-level materials engineering consultation across metals & alloys, polymers & plastics, ceramics & glass, and composites & advanced materials.

## Overview

This skill transforms Claude into a materials engineering consultant capable of:
- Providing detailed material properties and specifications
- Recommending material substitutions with trade-off analysis
- Performing engineering calculations (weight, density, dimensions)
- Comparing materials across multiple properties
- Guiding material selection for specific applications
- Troubleshooting material-related issues

## Target Users

- **Academic**: Students, researchers, professors
- **Industry**: Manufacturing engineers, production managers, quality engineers
- **R&D**: Product developers, prototyping engineers, material scientists

## Material Coverage

### Metals & Alloys
- Carbon steels (1018, 1045, 4140)
- Stainless steels (304, 316, 17-4 PH, 410)
- Tool steels (D2, A2, M2)
- Aluminum alloys (6061, 7075, 2024)
- Titanium alloys (Ti-6Al-4V, CP titanium)
- Copper alloys (brass, bronze)
- Nickel alloys (Inconel 718, Monel 400)

### Polymers & Plastics
- Commodity thermoplastics: HDPE, LDPE, PP, PVC, ABS, PS
- Engineering thermoplastics: Nylon (PA6, PA66, PA12), PC, POM, PBT, PET
- High-performance: PEEK, PEI/Ultem, PSU, PPS, PTFE
- Thermosets: Epoxy, phenolic, polyurethane
- Elastomers: NR, silicone, EPDM, NBR, Viton

### Ceramics & Glass
- Technical ceramics: Alumina, zirconia, silicon carbide, silicon nitride
- Glass: Soda-lime, borosilicate, fused silica
- Refractories

### Composites & Advanced Materials
- Carbon fiber/epoxy
- Glass fiber/polyester
- Aramid/epoxy
- Carbon fiber/PEEK
- Shape memory alloys (Nitinol)
- Piezoelectric ceramics
- Aerogels
- Graphene

## Core Capabilities

### 1. Material Properties & Specifications
Provides comprehensive technical data including:
- Mechanical properties (tensile, yield, modulus, hardness, impact, fatigue)
- Physical properties (density, melting point, thermal conductivity, expansion)
- Chemical properties (corrosion resistance, chemical compatibility)
- Thermal properties (service temperature, Tg, HDT)
- Manufacturing properties (machinability, weldability, formability)
- Standard specifications (ASTM, ISO, DIN, SAE, UNS)

### 2. Material Substitution Recommendations
- Identifies viable alternatives (3-5 options)
- Analyzes critical requirements
- Provides trade-off analysis (pros/cons)
- Considers cost, availability, performance
- Flags processing changes or compatibility issues

### 3. Engineering Calculations
- Weight and density calculations for various geometries
- Unit conversions (metric ↔ imperial)
- Strength-to-weight ratio analysis
- Volume and dimension calculations
- Material cost comparisons

### 4. Material Comparisons
- Side-by-side property comparisons (tabular format)
- Relative strengths and weaknesses
- Application-specific performance analysis
- Cost-performance trade-offs
- Processing and manufacturing considerations

## File Structure

```
materials-engineering/
├── SKILL.md                              # Main skill instructions
├── README.md                             # This file
├── examples.md                           # Detailed usage examples
├── test-cases.md                         # Test prompts and expected outputs
└── references/
    ├── metals-alloys.md                  # Detailed metal properties
    ├── polymers-plastics.md              # Detailed polymer properties
    └── ceramics-glass-composites.md      # Ceramics, glass, composites data
```

## Usage Examples

### Example 1: Property Query
**User**: "What are the properties of 316 stainless steel?"

**Claude** will provide:
- Full designation and classification
- Complete mechanical and physical properties
- Key characteristics and features
- Typical applications
- Comparison with related materials
- Notes on property variations

### Example 2: Material Substitution
**User**: "I need a cheaper alternative to titanium for a bike frame"

**Claude** will:
- Clarify requirements (strength-to-weight ratio critical)
- Suggest 3-5 alternatives (7075-T6 Al, 6061-T6 Al, carbon fiber, high-strength steel)
- Compare properties in table format
- Discuss trade-offs (weight vs cost vs durability)
- Provide recommendation with reasoning

### Example 3: Weight Calculation
**User**: "Calculate weight of steel plate 500mm × 300mm × 10mm"

**Claude** will:
- Specify material and density (7.85 g/cm³)
- Show volume calculation with units
- Show weight calculation step-by-step
- Provide result in kg and lb
- Offer comparisons with other materials if helpful

### Example 4: Material Comparison
**User**: "Compare ABS vs PC for electronics enclosure"

**Claude** will:
- Create property comparison table
- Analyze key differences (impact resistance, temperature, cost)
- Discuss application-specific considerations
- Provide clear recommendation with reasoning
- Suggest follow-up questions or design guidance

## When to Use This Skill

The skill should trigger for queries involving:
- "What are the properties of [material]?"
- "Alternative to [material]" or "substitute for [material]"
- "Compare [material A] vs [material B]"
- "Calculate weight of [material object]"
- "Material for [application]"
- "What material should I use for..."
- Material selection guidance
- Processing or troubleshooting questions
- Any mention of specific materials (steel, aluminum, nylon, PEEK, etc.)

## Technical Depth Guidelines

The skill adapts responses based on context:

**Academic Context**:
- Detailed explanations of material science principles
- Microstructural considerations
- References to phase diagrams, crystal structures
- Testing standards and methodologies
- Encourages critical thinking

**Industry Context**:
- Practical, actionable information
- Manufacturing and supply chain focus
- Cost-performance trade-offs
- Industry standards and specifications
- Production volume impacts

**R&D Context**:
- Balance of detail with practical constraints
- Experimental approaches when data limited
- Scalability considerations
- Emerging materials when relevant
- Iterative selection guidance

## Key Features

✓ **Comprehensive Coverage**: 100+ materials across 4 major categories  
✓ **Detailed Property Data**: Mechanical, physical, thermal, chemical, electrical  
✓ **Practical Recommendations**: Real-world constraints (cost, availability, processing)  
✓ **Engineering Calculations**: Weight, density, conversions with step-by-step solutions  
✓ **Trade-off Analysis**: Balanced pros/cons for material decisions  
✓ **Application Context**: Typical uses and design considerations  
✓ **Standard References**: ASTM, ISO, DIN, SAE, UNS designations  
✓ **Adaptive Depth**: Matches technical level to user expertise  

## Data Sources & Accuracy

Material property data is based on:
- Industry standard databases (MatWeb, ASM Handbook, CAMPUS Plastics)
- Material supplier datasheets
- ASTM and ISO standards
- Engineering handbooks and textbooks

**Important Notes**:
- Properties are typical values; actual properties vary with specific grade, heat treatment, and manufacturing process
- Always verify critical properties with manufacturer datasheets
- For safety-critical applications, consult certified material test reports
- Standards and specifications should be confirmed for latest revisions

## Installation

1. Copy the entire `materials-engineering` folder to your skills directory
2. The skill will be automatically available in Claude
3. Verify installation by asking: "What are the properties of aluminum 6061?"

## Testing

Run test cases from `test-cases.md` to verify skill performance:
- Basic property queries
- Weight calculations
- Material substitutions
- Comparisons
- Application-specific selection
- Troubleshooting scenarios

Expected pass rate: >90% on core functionality tests

## Version History

**v1.0** (Current)
- Initial release
- Coverage: 100+ materials across 4 categories
- Capabilities: Properties, substitutions, calculations, comparisons
- Reference files: 3 comprehensive material databases
- Examples: 6 detailed usage patterns
- Test cases: 30+ validation prompts

## Contributing

To improve this skill:
1. Add more materials to reference files
2. Expand application-specific examples
3. Add regional material standards (JIS, GB)
4. Include more calculation types
5. Add manufacturing process guidance
6. Expand troubleshooting scenarios

## Support & Feedback

For issues, questions, or suggestions:
- Check examples.md for usage patterns
- Review test-cases.md for expected behavior
- Consult reference files for material data
- Verify skill triggers in SKILL.md description

## License

This skill is created for use with Claude and follows Anthropic's usage guidelines.

---

**Created**: March 2026  
**For**: Claude AI (Anthropic)  
**Context**: Academic + Industry + R&D Materials Engineering  
**Coverage**: Metals, Polymers, Ceramics, Composites

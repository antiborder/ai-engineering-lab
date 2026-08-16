# Small demo corpus spanning distinct topics, so retrieval results are
# visibly meaningful for different queries rather than arbitrary — a query
# about bread should clearly outrank the one about Mount Everest.
DEMO_DOCUMENTS: list[tuple[str, str]] = [
    (
        "Sourdough Bread",
        (
            "Sourdough bread gets its rise from a wild yeast starter instead of "
            "commercial yeast. The starter is a mix of flour and water left to "
            "ferment over several days, capturing wild yeast and lactobacilli "
            "from the air and the flour itself. Feeding the starter daily with "
            "fresh flour and water keeps the yeast active. A well-fed starter "
            "should roughly double in size within four to six hours and smell "
            "pleasantly tangy. Baking sourdough requires patience: bulk "
            "fermentation can take four to twelve hours depending on room "
            "temperature, and a long cold proof in the refrigerator overnight "
            "develops more flavor and makes the dough easier to score before "
            "baking in a very hot oven, often inside a preheated Dutch oven."
        ),
    ),
    (
        "Solar Panels",
        (
            "Solar panels convert sunlight into electricity using photovoltaic "
            "cells made mostly of silicon. When photons strike the silicon, "
            "they knock electrons loose, creating a flow of current. Panels "
            "are wired together into arrays and connected to an inverter that "
            "converts the direct current they produce into the alternating "
            "current used by homes and the electrical grid. Panel efficiency "
            "has improved steadily, with many residential panels now "
            "converting over twenty percent of incoming sunlight into usable "
            "electricity. Orientation, tilt angle, and shading all "
            "significantly affect how much energy a given installation "
            "produces over a year."
        ),
    ),
    (
        "Cat Behavior",
        (
            "Cats are obligate carnivores and natural hunters, and much of "
            "their everyday behavior traces back to hunting instincts even in "
            "well-fed house cats. Stalking, pouncing on toys, and kneading "
            "with their paws are all rooted in kitten and predatory behaviors. "
            "Cats communicate through body language more than vocalization: a "
            "slow blink is often a sign of trust, while a puffed tail signals "
            "fear or aggression. Purring usually indicates contentment but can "
            "also occur when a cat is anxious or in pain, since the vibration "
            "may have a self-soothing or even healing effect on bones and "
            "tissue."
        ),
    ),
    (
        "Python Programming",
        (
            "Python is a dynamically typed, interpreted programming language "
            "known for readable syntax and a large standard library. It "
            "supports multiple programming paradigms, including procedural, "
            "object-oriented, and functional styles. Python's package "
            "ecosystem, distributed largely through PyPI, covers everything "
            "from web frameworks like Django and FastAPI to data science "
            "libraries like NumPy and pandas. Because Python is interpreted "
            "rather than compiled to native machine code, it is generally "
            "slower than languages like C or Rust for CPU-bound work, which is "
            "why performance-critical libraries are often implemented in C or "
            "Rust underneath a Python interface."
        ),
    ),
    (
        "Mount Everest",
        (
            "Mount Everest, on the border of Nepal and Tibet, is Earth's "
            "highest mountain above sea level at 8,849 meters. Most climbers "
            "attempt the summit via the South Col route from Nepal or the "
            "North Col route from Tibet, typically during a narrow weather "
            "window in May before the summer monsoon arrives. Above 8,000 "
            "meters, the so-called death zone has so little oxygen that the "
            "human body cannot acclimatize, and most climbers use supplemental "
            "bottled oxygen. Sherpa guides, many from the Khumbu region of "
            "Nepal, do much of the load-carrying and route-fixing that makes "
            "modern commercial expeditions possible."
        ),
    ),
    (
        "Coffee Brewing",
        (
            "Coffee flavor depends heavily on grind size, water temperature, "
            "and brew time, which together control extraction — how much of "
            "the ground coffee's soluble compounds end up in the cup. Water "
            "just off the boil, around 90 to 96 degrees Celsius, is standard "
            "for most brewing methods. Too fine a grind or too long a brew "
            "time over-extracts and tastes bitter; too coarse a grind or too "
            "short a brew time under-extracts and tastes sour or weak. Pour-"
            "over methods give more control over these variables than "
            "automatic drip machines, which is why many enthusiasts prefer "
            "them despite the extra manual effort."
        ),
    ),
]

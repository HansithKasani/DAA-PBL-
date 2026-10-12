import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_full_document(output_path):
    doc = Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True
        
        # Header & Footer setup for subsequent pages
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("DAA Algorithm Vulnerability & Stress-Testing Lab | B.Tech Sem III Report")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Department of Computer Science & Engineering — Design and Analysis of Algorithms")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # Styles helper
    NAVY = RGBColor(0x0F, 0x2A, 0x4A)      # Primary Title / Header Navy #0F2A4A
    TEAL = RGBColor(0x02, 0x84, 0xC7)      # Secondary Accent Teal #0284C7
    DARK_SLATE = RGBColor(0x1E, 0x29, 0x3B) # Body text
    MUTED_GRAY = RGBColor(0x64, 0x74, 0x8B)
    CODE_COLOR = RGBColor(0x0F, 0x17, 0x2A)
    
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_border(cell, **kwargs):
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
        for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            edge_data = kwargs.get(edge)
            if edge_data:
                val = edge_data.get('val', 'single')
                color = edge_data.get('color', 'auto')
                sz = edge_data.get('sz', '4')
                tag = f'<w:{edge} {nsdecls("w")} w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                tcBorders.append(parse_xml(tag))
            else:
                tag = f'<w:{edge} {nsdecls("w")} w:val="none"/>'
                tcBorders.append(parse_xml(tag))
        tcPr.append(tcBorders)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(17)
        run.font.color.rgb = NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(13)
        run.font.color.rgb = TEAL
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.font.color.rgb = NAVY
        return p

    def add_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10.5)
            r_bold.font.color.rgb = NAVY
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(10.5)
        run.font.color.rgb = DARK_SLATE
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.12
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10)
            r_bold.font.color.rgb = NAVY
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = DARK_SLATE
        return p

    def add_callout(title, text, border_color="0284C7", fill_hex="F0F9FF"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, fill_hex)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
        
        set_cell_border(cell, 
                        left={'val': 'single', 'sz': '24', 'color': border_color},
                        top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                        bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                        right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        run_title = p.add_run(f"✦ {title}\n")
        run_title.bold = True
        run_title.font.name = "Arial"
        run_title.font.size = Pt(10.5)
        run_title.font.color.rgb = RGBColor.from_string(border_color)
        
        run_text = p.add_run(text)
        run_text.font.name = "Calibri"
        run_text.font.size = Pt(10)
        run_text.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        
        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(0)
        p_spacer.paragraph_format.space_after = Pt(4)

    def add_code_snippet(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
        
        set_cell_border(cell,
                        left={'val': 'single', 'sz': '6', 'color': 'CBD5E1'},
                        top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                        bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                        right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(code_text)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = CODE_COLOR
        
        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(4)

    def format_table(table, col_widths, col_alignments):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, row in enumerate(table.rows):
            is_header = (i == 0)
            for j, cell in enumerate(row.cells):
                cell.width = col_widths[j]
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                
                if is_header:
                    set_cell_background(cell, "0F2A4A")
                    set_cell_border(cell,
                                    top={'val': 'single', 'sz': '8', 'color': '0F2A4A'},
                                    bottom={'val': 'single', 'sz': '12', 'color': '0284C7'},
                                    left={'val': 'single', 'sz': '4', 'color': '334155'},
                                    right={'val': 'single', 'sz': '4', 'color': '334155'})
                else:
                    bg = "F8FAFC" if (i % 2 == 1) else "FFFFFF"
                    set_cell_background(cell, bg)
                    set_cell_border(cell,
                                    top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                                    bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                                    left={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                                    right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
                
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(0)
                    p.paragraph_format.space_after = Pt(0)
                    p.paragraph_format.line_spacing = 1.05
                    p.alignment = col_alignments[j]
                    for run in p.runs:
                        run.font.name = "Calibri"
                        if is_header:
                            run.bold = True
                            run.font.size = Pt(9.5)
                            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                        else:
                            run.font.size = Pt(9)
                            run.font.color.rgb = DARK_SLATE

    # =========================================================================
    # TITLE PAGE / BANNER
    # =========================================================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("DAA ALGORITHM VULNERABILITY & STRESS-TESTING LABORATORY")
    run_title.bold = True
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.font.color.rgb = NAVY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(2)
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Comprehensive Technical Report: Code Architecture, Component Implementation Breakdown, and Engineering Rationale")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = TEAL

    # Meta Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_widths = [Inches(2.2), Inches(4.3)]
    meta_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    
    meta_data = [
        ("Course & Academic Level", "B.Tech Semester III — Design and Analysis of Algorithms (DAA)"),
        ("Project Classification", "PBL Laboratory / Interactive Vulnerability Stress Workbench"),
        ("Implementation Stack", "Pure Zero-Dependency Client-Side (Vanilla JS ES6, HTML5, CSS3, Node.js Test Harness)"),
        ("Algorithms Evaluated", "13 Core Syllabus Algorithms across 5 Foundational Algorithmic Paradigms")
    ]
    for row_idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        pk = cell_k.paragraphs[0]
        rk = pk.add_run(k)
        rk.bold = True
        rk.font.name = "Calibri"
        rk.font.size = Pt(9.5)
        rk.font.color.rgb = NAVY
        
        pv = cell_v.paragraphs[0]
        rv = pv.add_run(v)
        rv.font.name = "Calibri"
        rv.font.size = Pt(9.5)
        rv.font.color.rgb = DARK_SLATE
        
        set_cell_background(cell_k, "F1F5F9")
        set_cell_background(cell_v, "FFFFFF")
        set_cell_margins(cell_k, top=60, bottom=60, left=100, right=100)
        set_cell_margins(cell_v, top=60, bottom=60, left=100, right=100)
        set_cell_border(cell_k, 
                        top={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        bottom={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        left={'val': 'single', 'sz': '8', 'color': '0284C7'},
                        right={'val': 'single', 'sz': '4', 'color': 'CBD5E1'})
        set_cell_border(cell_v,
                        top={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        bottom={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        left={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        right={'val': 'single', 'sz': '4', 'color': 'CBD5E1'})

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Document Abstract Callout
    add_callout(
        "DOCUMENT PURPOSE & SCOPE",
        "This formal academic and engineering report provides an exhaustive, line-by-line architectural breakdown of the DAA Algorithm Vulnerability & Stress-Testing Laboratory. For every individual source code file and each of the 13 foundational algorithm implementations, this document details:\n"
        "1. Executive Summary & Purpose: The computational role of the module in the project ecosystem.\n"
        "2. Concrete Implementation Walkthrough: Precise internal data structures, core helper routines, state management, and algorithmic control flow.\n"
        "3. Engineering Rationale (Why Used at This Particular Place): In-depth justification answering why this specific algorithm or data structure was selected, what architectural trade-offs were made, how it exposes asymptotic vulnerabilities, and how it directly maps to the B.Tech Semester III DAA syllabus.\n"
        "4. Mathematical Invariants & Epistemological Verification: The exact post-run correctness assertions validated after isolated timing.\n"
        "5. Complete Viva Voce Defense Guide: Anticipated technical examination questions, conceptual traps, and model answers.",
        border_color="0F2A4A",
        fill_hex="F8FAFC"
    )

    # =========================================================================
    # CHAPTER 1: EXECUTIVE SUMMARY & SYSTEM ARCHITECTURE
    # =========================================================================
    add_h1("1. Executive Summary & System Philosophy")
    
    add_p(
        "In traditional computer science pedagogy, the Design and Analysis of Algorithms (DAA) is frequently taught as a purely theoretical endeavor. Students learn asymptotic Big-O notations, memorize worst-case upper bounds, and solve paper-and-pencil recurrence relations. However, this textbook-centric model creates a profound disconnect when theoretical models confront real-world physical systems. Real execution is constrained by CPU cache hierarchies, memory allocation latency, branch prediction, pointer chasing overheads, and adversarial workload distributions."
    )
    add_p(
        "The DAA Algorithm Vulnerability and Stress-Testing Laboratory was architected to bridge this gap. Rather than presenting algorithms on trivial, uniformly distributed toy inputs, the laboratory investigates the critical engineering question:"
    )
    add_callout(
        "CORE PEDAGOGICAL INQUIRY",
        "\"Under what exact input distributions, structural configurations, and scale boundaries does a textbook algorithm degrade, exhibit asymptotic tipping points, or become practically infeasible?\"",
        border_color="0284C7",
        fill_hex="F0F9FF"
    )
    
    add_h2("1.1 Foundational Architectural Principles")
    add_p("The system adheres to five uncompromising architectural principles across its entire codebase:")
    
    add_bullet(
        " Zero Simulated or Synthetic Metric Data: Every operation count, comparison metric, recursion depth, and microsecond timing reported on the dashboard stems from genuine, live JavaScript execution in the browser thread. There are zero hardcoded lookup tables or pre-computed fake graphs.",
        "Principle 1 — Empirical Integrity:"
    )
    add_bullet(
        " Isolated High-Precision Measurement Protocol: Modern web browser runtimes execute complex DOM reflows, garbage collection cycles, and asynchronous visual paints. To prevent measurement pollution, performance.now() is wrapped strictly and exclusively around the raw algorithmic execution block. Input data generation, chart rendering, and correctness verification run completely untimed.",
        "Principle 2 — Strict Timing Isolation:"
    )
    add_bullet(
        " Deterministic Reproducibility via 32-Bit Mulberry32 PRNG: Standard Math.random() is non-deterministic and platform-dependent, making scientific peer verification impossible. The laboratory implements a custom 32-bit Mulberry32 Pseudo-Random Number Generator (PRNG). Any input workload is 100% bit-for-bit reproducible given the triplet (Algorithm, Size, Seed).",
        "Principle 3 — Scientific Reproducibility:"
    )
    add_bullet(
        " Post-Execution Invariant Verification: High performance is meaningless if an algorithm produces corrupted outputs. Every algorithm registers a formal mathematical verifier function v() that runs immediately following the timed execution block. If an invariant fails, the entire run is flagged as corrupted.",
        "Principle 4 — Mathematical Correctness Invariants:"
    )
    add_bullet(
        " Epistemological Honesty in Complexity Modeling: Empirical hardware timing can never mathematically 'prove' an asymptotic complexity bound due to OS jitter, JIT compiler optimizations, and thermal throttling. The laboratory explicitly classifies empirical metrics as 'consistent with theoretical expectations' rather than claiming experimental proof.",
        "Principle 5 — Epistemological Rigor:"
    )

    # Architecture Diagram Table
    add_h2("1.2 System Execution Pipeline")
    add_p("The runtime follows a unidirectional, decoupled 6-stage execution pipeline:")
    
    pipeline_code = (
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│ STAGE 1: Parameter Ingestion & Input Generation (UNTIMED)             │\n"
        "│   User selects (Algorithm, Size n, Family, Seed) -> PRNG creates input │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│ STAGE 2: Safety Deadline Arming (UNTIMED)                              │\n"
        "│   EXECUTION_DEADLINE = performance.now() + UserTimeoutThreshold        │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│ STAGE 3: Core Algorithm Execution (STRICTLY TIMED SECTION)             │\n"
        "│   t0 = performance.now(); result = alg.run(input, null); t1 = now();    │\n"
        "│   Elapsed Time ms = (t1 - t0)                                         │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│ STAGE 4: Mathematical Invariant Verification (UNTIMED)                 │\n"
        "│   is_valid = result.v(); Asserts tree heights, sortedness, MST costs   │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│ STAGE 5: Risk Classification Engine (UNTIMED)                          │\n"
        "│   Classifies execution into LOW / MODERATE / HIGH risk based on latency│\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │\n"
        "┌───────────────────────────────────▼────────────────────────────────────┐\n"
        "│ STAGE 6: Asynchronous UI & Canvas Chart Rendering (UNTIMED)            │\n"
        "│   Draws HTML5 Canvas graphs, step state machines, and visual trees     │\n"
        "└────────────────────────────────────────────────────────────────────────┘"
    )
    add_code_snippet(pipeline_code)

    # =========================================================================
    # CHAPTER 2: CODEBASE ARCHITECTURE & FILE-BY-FILE ANALYSIS
    # =========================================================================
    add_h1("2. Codebase Architecture & File-by-File Breakdown")
    add_p(
        "The project structure was purposefully engineered with zero external framework dependencies (no React, Angular, Vue, Webpack, Vite, or npm bundle requirements). It consists of clean, modular, vanilla web technologies that execute identically from a local file system (file:// protocol) or any lightweight static web server."
    )

    files_info = [
        {
            "name": "index.html",
            "role": "Single-Page Application Shell & DOM Mounting Structure",
            "summary": "Serves as the unified semantic HTML5 document skeleton. Contains minimal markup: a responsive sidebar container (<nav id=\"sidebar-nav\">), a primary dashboard/workbench container (<main id=\"main-content\">), and standard script tags loaded in strict dependency order.",
            "implementation": "Implements semantic HTML5 without complex external bundles. Uses classic <script> tags for rng.js, algorithms.js, visualizers.js, benchmarks.js, tests.js, and app.js. Declares viewport metadata for mobile/desktop responsiveness and links the master style sheet css/styles.css.",
            "why_used": "Why used here: Traditional student web projects suffer from dependency rot, build-tool complexity (npm install failures, Webpack configuration errors), and CORS errors when run locally. By using standard classic script tags and pure vanilla DOM injection, the entire laboratory runs instantaneously in any modern browser without requiring node_modules, bundlers, or transpilers."
        },
        {
            "name": "server.js",
            "role": "Zero-Dependency Native Node.js Static File Server",
            "summary": "A lightweight, production-grade local HTTP server built using Node.js built-in core modules (http, fs, path). Binds to 127.0.0.1 on port 8080 and streams files with accurate MIME headers and path traversal protections.",
            "implementation": "Defines an exhaustive MIME_TYPES mapping dictionary (.html, .css, .js, .json, .md, .png, .svg). Implements path normalization using path.normalize(urlPath) and path traversal sanitization (stripping ../) to prevent directory traversal attacks. Uses fs.createReadStream().pipe(res) for efficient, chunked, non-blocking file streaming.",
            "why_used": "Why used here: While the lab runs under file:// protocol, hosting over HTTP is essential for strict browser security policies (e.g. testing HTTP headers, service workers, or network isolation). Writing an ultra-compact server using only built-in Node.js libraries ensures that examiners or students can run the project on any machine equipped with Node.js without executing npm install."
        },
        {
            "name": "css/styles.css",
            "role": "Unified Design System & Dual-Theme Responsive Styling Engine",
            "summary": "Provides a comprehensive, state-of-the-art responsive CSS design system. Encapsulates all color tokens, typography scales, glassmorphism card layouts, monospace workbench terminals, visualizer canvas wrappers, and complete dual-theme (Light default and Dark) variables.",
            "implementation": "Organized into clear CSS Custom Properties (:root and [data-theme=\"dark\"]). Defines standardized palette tokens (--bg-primary, --bg-card, --border, --text-primary, --text-muted, --accent, --danger, --warning, --success). Uses CSS Grid and Flexbox for high-density dashboard layouts, responsive sidebar navigation, sticky metric stat cards, and scrollable monospace execution consoles.",
            "why_used": "Why used here: Eliminating third-party CSS frameworks (such as Tailwind, Bootstrap, or Material) gives absolute, pixel-perfect control over UI performance. It avoids bloated download sizes and ensures seamless dual-theme toggling via a single data-theme attribute on <body> without runtime stylesheet swapping."
        },
        {
            "name": "js/rng.js",
            "role": "Deterministic Mulberry32 PRNG & Workload Family Generator Suite",
            "summary": "The computational bedrock of scientific benchmarking in the lab. Generates deterministic, reproducible datasets across seven distinct problem families: Data Structure Keys, Minimum Spanning Tree Graphs, Knapsack Weight/Value vectors, APSP Distance Matrices, Matrix Chain Dimensions, Chessboards, Hamiltonian Graphs, and 2D Euclidean TSP city maps.",
            "implementation": "Implements the 32-bit Mulberry32 algorithm using bitwise shifts (>>>), XOR operations (^), and 32-bit integer multiplication (Math.imul). Houses specialized generator routines: genKeys() (ascending, descending, random, duplicates), genGraph() (sparse, medium, dense), genKnapsack() (random, capacity-stress, adversarial), genFloydWarshall(), genMatrixChain(), genHamiltonian() (including pathological clique-plus-bridge family), and genTSP() (Euclidean vs random symmetric).",
            "why_used": "Why used here: Benchmarks that rely on Math.random() are non-reproducible; an algorithm run on machine A cannot be verified on machine B. Mulberry32 guarantees that seed=42 produces the exact same sequence of floating-point numbers in every browser. Furthermore, dedicated workload generators allow the laboratory to synthesize specifically tailored pathological inputs (such as monotonic trees, adversarial knapsacks, or degree-1 bridge cliques) designed to trigger worst-case algorithm behavior."
        },
        {
            "name": "js/algorithms.js",
            "role": "Master Algorithm Engine & Post-Run Mathematical Invariant Verifiers",
            "summary": "The central algorithmic repository containing all 13 core DAA syllabus algorithms, complete with their internal data structures (Binomial Trees, Fibonacci Doubly Linked Lists, B-Tree Nodes, Red-Black Trees, Binary Min-Heaps, DSU), execution runners, step-by-step visual loggers, and post-execution invariant verification functions.",
            "implementation": "Spans over 2,100 lines of rigorously crafted vanilla JavaScript. Exposes a global registry object A mapping algorithm identifiers to metadata, parameter ranges, generator hooks, runner functions, complexity descriptions, and vulnerability notes. Each algorithm runner function run<Alg>(input, T) accepts an input dataset and an optional step logger callback T. When T is null, the algorithm runs at raw native speed without logging overhead. When T is provided, fine-grained state transitions are recorded for the interactive visual stepper.",
            "why_used": "Why used here: Grouping all algorithms into a standardized registry provides a unified interface for the workbench runner, benchmark sweeper, and acceptance test harness. Decoupling the fast untraced path (for microsecond timing) from the traced path (for step-by-step UI animation) satisfies both performance measurement and pedagogical visualization requirements."
        },
        {
            "name": "js/benchmarks.js",
            "role": "Empirical Benchmarking Harness, Risk Classifier & Canvas Chart Renderer",
            "summary": "Manages automated parameter sweeps across varying problem sizes (startN to endN), averages multi-trial runs, computes empirical growth slopes, classifies algorithmic execution risk into LOW / MODERATE / HIGH categories, and renders high-resolution HTML5 Canvas charts.",
            "implementation": "Contains executeSingleRun() which enforces the isolated timing protocol. Houses classifyRisk() which evaluates latency against user-configured sidebar thresholds (default: 50 ms for Moderate, 1000 ms for High, 5000 ms for Timeout) combined with empirical growth slope analysis (growth rate >= 4.0 triggers Moderate). Includes drawBenchmarkChart() which renders dual-axis canvas curves (Execution Time ms on primary axis, Abstract Operation Count on secondary axis).",
            "why_used": "Why used here: Encapsulates the scientific measurement and risk evaluation logic away from UI rendering. By isolating timing inside executeSingleRun(), it ensures that every benchmark point represents pure algorithm execution time, free from UI reflows or verifier overhead."
        },
        {
            "name": "js/tests.js",
            "role": "Automated Unit & Acceptance Test Verification Suite",
            "summary": "A built-in academic verification suite containing 10 rigorous acceptance tests that validate exact mathematical operation formulas, MST equivalence, adversarial knapsack failure gaps, N-Queens solution counts, and safety timeout guards.",
            "implementation": "Exposes runAcceptanceTests(onProgress). Executes automated test assertions including: Floyd-Warshall exact V^3 loop iterations (V=10 -> 1,000, V=20 -> 8,000); Matrix Chain Multiplication inner loop formula (n=10 -> (10^3 - 10)/6 = 165); Prim vs Kruskal cost equivalence on matched seeds; Adversarial Knapsack failure gap (Fractional = 19.20, DP = 18, Greedy = 12); exact N-Queens counts (n=6 -> 4, n=8 -> 92); and Data Structure invariant validation across all 4 families at n=1,000.",
            "why_used": "Why used here: Provides self-testing proof of correctness. During an academic viva voce or lab evaluation, examiners can click a single button to execute all 10 tests live, proving that the code is mathematically sound and that all theoretical formulas match live execution."
        },
        {
            "name": "js/visualizers.js",
            "role": "Visualizer Dispatcher & Multi-Paradigm Canvas/DOM Rendering Engine",
            "summary": "Dispatches and renders visual state representations for all algorithm categories. Transforms raw abstract data structures into intuitive, animated visual components supporting both Light and Dark themes.",
            "implementation": "Exposes renderVisualStep(algName, stepData, inputData). Features dedicated renderers: renderNQueensBoard() (interactive 2D chessboard highlighting placed, pruned, and backtracked cells); renderTSPMap() (Euclidean coordinate city map drawing current tour paths and pruned bounds); renderMSTGraph() (graph visualizer showing accepted vs rejected edges); renderHamiltonianGraph(); renderFloydWarshallMatrix() (dynamic 2D distance matrix heatmaps); renderKnapsackVisual() (DP cell allocation table); renderMatrixChainVisual() (upper triangular DP table m[i,j]); and renderTreeStructureVisual() (hierarchical tree and heap node layouts).",
            "why_used": "Why used here: Visual representation is vital for understanding non-linear algorithms (trees, state-space backtracking, and dynamic programming tables). By encapsulating all rendering in a dedicated file, visual code is strictly segregated from algorithmic logic, maintaining clean architectural boundaries."
        },
        {
            "name": "js/app.js",
            "role": "Application Orchestrator, View Router & State Management Controller",
            "summary": "The master UI controller coordinating application state, view switching (Dashboard, Workbench, Acceptance Tests, Complexity Matrix, Viva Voce Guide), sidebar parameter inputs, stepper controls, live console logging, and local storage persistence.",
            "implementation": "Maintains global reactive variables: currentView, currentAlgorithm, currentTab, executionSteps, currentStepIndex, and experimentHistory. Houses view builders: renderDashboard(), renderWorkbench(), renderTestsView(), renderComplexityView(), and renderVivaView(). Handles event binding for parameter sliders, seed randomization, single-step execution, and benchmark execution cancellation.",
            "why_used": "Why used here: Acts as the glue connecting HTML views, algorithm engines, benchmarking modules, and visual renderers. Decoupling view generation from algorithm execution ensures clean code organization and ease of maintainability."
        }
    ]

    for f in files_info:
        add_h2(f"2.{files_info.index(f)+1} {f['name']} — {f['role']}")
        add_p(f['summary'], bold_prefix="Component Summary: ")
        add_p(f['implementation'], bold_prefix="Implementation Architecture: ")
        add_callout(f"ENGINEERING RATIONALE: {f['name']}", f['why_used'], border_color="0284C7", fill_hex="F0F9FF")

    # =========================================================================
    # CHAPTER 3: DEEP-DIVE INTO ALL 13 ALGORITHMS & IMPLEMENTATIONS
    # =========================================================================
    add_h1("3. Comprehensive Analysis of All 13 DAA Algorithms")
    add_p(
        "This chapter presents an exhaustive breakdown of every algorithm implemented in js/algorithms.js. Each algorithm is examined across its theoretical context, internal data structures, line-by-line algorithmic mechanics, engineering rationale for selection, asymptotic bounds, and mathematical correctness verifier."
    )

    algs_detailed = [
        {
            "name": "Binomial Heap",
            "module": "Module I: Advanced Data Structures",
            "category": "Mergeable Priority Queue",
            "workload": "n inserts -> floor(n/4) decrease-keys -> n extract-mins",
            "files_funcs": "js/algorithms.js: createBinomialHeap(), linkTrees(), addTree(), insert(), decreaseKey(), extractMin(), unionWith(), runBinomialHeap()",
            "data_structures": "Collection of binomial trees {B0, B1, B2, ...} indexed by degree in a sparse array. Each node contains { key, children: [], parent: null }.",
            "implementation_walkthrough": 
                "1. Data Structure Construction: A Binomial Heap is a forest of binomial trees satisfying the binomial tree property: tree Bk has 2^k nodes, height k, and root degree k. The degrees of trees in the heap correspond to the binary representation of the total number of elements n.\n"
                "2. Linking Routine (linkTrees(b1, b2)): Given two trees of identical degree d, compares their root keys. The tree with the larger root is made the leftmost child of the tree with the smaller root. Degree increases to d + 1 in O(1) time.\n"
                "3. Addition & Carry Propagation (addTree(tree)): Traverses the tree array indexed by degree. If trees[d] is empty, places the tree at d. If occupied, unseats the existing tree, merges them via linkTrees(), and propagates the resulting tree of degree d+1 upward, exactly mirroring binary addition with carry propagation.\n"
                "4. Decrease-Key (decreaseKey(node, delta)): Subtracts delta from the node's key. If the min-heap property is violated, the key bubbles up along the parent chain using iterative swaps until heap order is restored. Traverses at most height h = O(log n) levels.\n"
                "5. Extract-Min (extractMin()): Scans all root trees in O(log n) to locate the minimum root. Removes that tree from the array, reverses its children (which form a valid binomial heap of smaller degrees), and performs a union with the remaining trees by calling addTree() for each child.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Binomial Heaps are explicitly mandated in Module I as the foundational mergeable priority queue data structure.\n"
                "2. Rigid Structure Stress-Testing: Unlike the Fibonacci Heap, the Binomial Heap enforces strict structural rigidity: there can NEVER be two binomial trees of the same degree. Every insertion or merge must immediately resolve degree conflicts.\n"
                "3. Vulnerability Demonstration: On heavy decrease-key workloads, the Binomial Heap must pay Theta(log n) strictly for every decrease-key by bubbling up through tree pointers. Furthermore, extract-min requires explicit tree dismemberment and union with Theta(log n) carry steps. Placing Binomial Heap side-by-side with Fibonacci Heap exposes the exact performance penalty of rigid structural maintenance versus lazy deferred consolidation.",
            "complexities": 
                "• Insert: O(1) amortized, Theta(log n) worst-case (when carry cascades across all trees)\n"
                "• Extract-Min: Theta(log n) worst-case\n"
                "• Decrease-Key: Theta(log n) worst-case\n"
                "• Union (Merge): Theta(log n) worst-case\n"
                "• Auxiliary Space: Theta(n) for node objects and child/parent pointer references",
            "verifier": 
                "Invariant Verifier (v()): Extracts all n elements sequentially and validates that the resulting extraction stream is strictly non-decreasing: extracted[i] <= extracted[i+1] for all 0 <= i < n-1. Also confirms that total extracted count equals n."
        },
        {
            "name": "Fibonacci Heap",
            "module": "Module II: Advanced Data Structures",
            "category": "Lazy Priority Queue with Amortized Bounds",
            "workload": "n inserts -> floor(n/4) decrease-keys -> n extract-mins",
            "files_funcs": "js/algorithms.js: createFibonacciHeap(), cut(), cascadingCut(), insert(), decreaseKey(), consolidate(), extractMin(), runFibonacciHeap()",
            "data_structures": "Circular root list array rootList, min pointer minNode. Nodes contain { key, children: [], parent: null, marked: false }.",
            "implementation_walkthrough": 
                "1. Lazy Design Architecture: The Fibonacci Heap postpones work until absolutely necessary. Inserts simply append new single-node trees to a circular root list and update minNode in Theta(1) time.\n"
                "2. Decrease-Key & Cascading Cuts (cut(), cascadingCut()): When decreaseKey(node, delta) causes node.key < parent.key, the algorithm cuts the node from its parent, resets marked = false, and moves it to the root list. It then inspects the parent: if the parent was unmarked, it sets marked = true (signifying loss of one child). If already marked, it recursively cuts the parent and cascades upward until reaching an unmarked ancestor or the root. This guarantees tree degree bounds while achieving O(1) amortized cost.\n"
                "3. Consolidate Routine (consolidate()): Executed exclusively during extractMin(). Reconstructs heap order by merging trees of identical degree. Uses an array table[deg] indexed by degree. Iterates through all roots in the root list: if another root of degree deg already exists in table, links them (smaller root becomes parent) and increments deg until an open slot is found.\n"
                "4. Extract-Min: Removes minNode, elevates all its children to the root list, and triggers consolidate() to combine trees and locate the new minimum.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Fibonacci Heaps are the crown jewel of Module II advanced data structures, celebrated for theoretical O(1) amortized decrease-key.\n"
                "2. Exposing the Lazy Consolidation Vulnerability: In theory, Fibonacci Heaps achieve O(1) amortized decrease-key and O(log n) extract-min. In physical execution, however, they suffer from massive constant-factor pointer overhead. If thousands of items are lazily inserted without extraction, the root list grows to O(n) un-consolidated roots. The very first extract-min must suddenly execute an enormous O(n) consolidation sweep, causing massive latency spikes. The workbench proves that for small-to-medium n, a simple binary heap or binomial heap often out-performs the Fibonacci heap due to lower constant factors.",
            "complexities": 
                "• Insert: Theta(1) actual time\n"
                "• Decrease-Key: O(1) amortized (O(n) worst-case single operation if cascading cuts chain)\n"
                "• Extract-Min: O(log n) amortized (O(n) worst-case single operation during consolidation)\n"
                "• Union: Theta(1) actual time (circular list splicing)\n"
                "• Auxiliary Space: Theta(n)",
            "verifier": 
                "Invariant Verifier (v()): Asserts that all extracted keys are sorted in non-decreasing order and that the total count matches the input key set size n."
        },
        {
            "name": "B-Tree (Minimum Degree t = 3)",
            "module": "Module I: Advanced Data Structures",
            "category": "Multi-Way Balanced Search Tree",
            "workload": "n inserts -> floor(n/4) searches -> floor(n/8) deletes",
            "files_funcs": "js/algorithms.js: createBTree(t=3), splitChild(), insertNonFull(), insert(), search(), borrowFromPrev(), borrowFromNext(), merge(), delete(), runBTree()",
            "data_structures": "B-Tree Node: { keys: [], children: [], isLeaf: boolean }. Invariants: Root has [1, 2t-1] keys; Internal nodes have [t-1, 2t-1] keys and [t, 2t] children.",
            "implementation_walkthrough": 
                "1. Parameterization: Implemented with minimum degree t = 3. Every non-root node contains between t - 1 = 2 and 2t - 1 = 5 keys, and has between t = 3 and 2t = 6 children.\n"
                "2. Proactive Top-Down Splitting (splitChild()): Unlike naive insertion that splits bottom-up upon overflow, this implementation proactively splits any full child node encountered during the downward traversal. When navigating to child i with 2t - 1 keys, it slices child.keys, extracts the exact median key (index t-1), promotes the median into the parent node, and creates a new sibling node for the upper t-1 keys. This guarantees that when a leaf is reached, the parent is guaranteed to have room for promotion.\n"
                "3. Search (search(node, key)): Linear/binary scans through the node's keys array. If found, returns true. If leaf, returns false. Otherwise, recurses down children[i] where keys[i-1] < key < keys[i].\n"
                "4. Deletion with Rebalancing: Implements complete B-Tree rebalancing: if a child has only t-1 keys, borrows a key from an immediate sibling (via borrowFromPrev or borrowFromNext). If both siblings have only t-1 keys, merges the child with a sibling and drops a parent separator key down.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: B-Trees are core to Module I as the primary multi-way balanced search tree utilized in database indices and file systems.\n"
                "2. Block I/O vs CPU Cache Vulnerability: B-Trees were historically designed for secondary disk storage where block reads dominate. On modern CPU architectures, multi-way node structures incur linear key-scan overhead. Under monotonic sequential key workloads (e.g. 1, 2, 3, ...), B-Trees split continuously at the rightmost boundary, creating nodes that are only half-full (50% storage efficiency). Stress-testing B-Tree under sorted vs random streams exposes this structural utilization trade-off.",
            "complexities": 
                "• Search: Theta(log n) = Theta(log_t n * t)\n"
                "• Insert: Theta(log n) with proactive top-down splitting\n"
                "• Delete: Theta(log n) with sibling borrowing and merging\n"
                "• Tree Height: Upper bounded by log_t((n+1)/2)\n"
                "• Auxiliary Space: Theta(n)",
            "verifier": 
                "Invariant Verifier (v()): Traverses the tree inorder and validates: (1) inorder keys are strictly sorted; (2) total key count equals retained keys; (3) all leaf nodes exist at the EXACT same depth (leavesDepth.size === 1), mathematically proving perfect B-Tree balance."
        },
        {
            "name": "Red-Black Tree",
            "module": "Module II: Advanced Data Structures",
            "category": "Balanced Binary Search Tree",
            "workload": "n inserts -> floor(n/4) searches -> floor(n/8) deletes",
            "files_funcs": "js/algorithms.js: createRBTree(), rotateLeft(), rotateRight(), insert(), search(), delete(), runRBTree()",
            "data_structures": "Node: { key, color: RED(1) | BLACK(0), left, right, parent }. Sentinels represented as null.",
            "implementation_walkthrough": 
                "1. Invariant Properties Enforced: (1) Every node is Red or Black; (2) Root is always Black; (3) Every leaf (NIL) is Black; (4) If a node is Red, both children are Black (no two consecutive Red nodes); (5) For every node, all paths to descendant leaves contain identical black-height.\n"
                "2. Tree Rotations (rotateLeft(x), rotateRight(x)): Standard O(1) pointer restructuring that swaps parent-child relationships while preserving strict binary search order.\n"
                "3. Insert Fixup Routine: Places new node as RED at leaf. If parent is RED, resolves violations across 3 canonical cases:\n"
                "   - Case 1 (Uncle is RED): Recolors parent and uncle to BLACK, recolors grandparent to RED, moves pointer to grandparent (propagates upward).\n"
                "   - Case 2 (Uncle is BLACK, triangle configuration): Performs left/right rotation on parent to convert into line configuration.\n"
                "   - Case 3 (Uncle is BLACK, line configuration): Rotates grandparent and swaps parent/grandparent colors. Restores invariants and terminates.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Red-Black Trees are mandated in Module II as the industry-standard balanced BST (used in C++ std::map, Java TreeMap, Linux CFS scheduler).\n"
                "2. Monotonic Key Vulnerability: When inserted with uniform random keys, rotations occur infrequently. However, when fed monotonically increasing or decreasing keys (e.g. 1, 2, 3, ...), every single insertion triggers rotations and recolorings, maximizing constant-factor CPU overhead. Benchmarking Red-Black Tree against uniform vs monotonic keys visualizes this overhead in real time.",
            "complexities": 
                "• Search: Theta(log n) (Height guaranteed <= 2 * log2(n + 1))\n"
                "• Insert: Theta(log n) time, requiring at most 2 rotations\n"
                "• Delete: Theta(log n) time, requiring at most 3 rotations\n"
                "• Auxiliary Space: Theta(n)",
            "verifier": 
                "Invariant Verifier (v()): Comprehensive 4-point structural check: (1) Root is Black; (2) Inorder traversal is strictly sorted; (3) No Red node has a Red child (no consecutive reds); (4) Black-height is identical across all root-to-leaf paths."
        },
        {
            "name": "Prim's Algorithm (MST)",
            "module": "Module III: Graph Algorithms & Greedy",
            "category": "Greedy Minimum Spanning Tree",
            "workload": "Connected undirected graph G = (V, E) across sparse, medium, and dense families",
            "files_funcs": "js/algorithms.js: createMinHeapForPrim(), runPrimMST()",
            "data_structures": "Binary min-heap storing [weight, u, from], Uint8Array inMST visited bitmask, Adjacency list representation adj[u] = [[v, w], ...].",
            "implementation_walkthrough": 
                "1. Greedy Vertex-Growing Paradigm: Starts with a cut separating vertex 0 (in MST) from all other V - 1 vertices. Pushes all incident edges of vertex 0 into a binary min-heap.\n"
                "2. Edge Relaxation Loop: While heap is non-empty and MST contains < V - 1 edges:\n"
                "   - Pops minimum edge [weight, u, from] from min-heap.\n"
                "   - If vertex u is already in inMST, rejects edge as a redundant cross-cut cycle edge.\n"
                "   - If u is not in inMST, accepts edge into MST, marks inMST[u] = 1, accumulates weight, and iterates through adj[u], pushing all edges leading to unvisited vertices into the min-heap.\n"
                "3. Convergence: Terminates as soon as exactly V - 1 edges are accepted.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Core greedy graph algorithm in Module III.\n"
                "2. Dense Graph Heap Overhead Vulnerability: Prim's algorithm using a binary min-heap has time complexity O(E log V). On dense graphs where E ≈ V^2 / 2, up to O(V^2) candidate edges are pushed into the heap, incurring log V comparison overhead on every edge. This workbench contrasts Prim against Kruskal on identical graphs to prove where the cross-over point occurs.",
            "complexities": 
                "• Time Complexity: Theta(E log V) with binary min-heap and adjacency list\n"
                "• Un-heaped Matrix Prim: Theta(V^2) (superior for dense graphs where E ≈ V^2)\n"
                "• Auxiliary Space: Theta(V + E) for adjacency list, min-heap, and visited arrays",
            "verifier": 
                "Invariant Verifier (v()): Asserts that MST contains exactly V - 1 edges, forms a connected component spanning all V vertices, and that total MST cost exactly matches Kruskal's MST cost computed independently on the identical seeded graph."
        },
        {
            "name": "Kruskal's Algorithm (MST)",
            "module": "Module III: Graph Algorithms & Greedy",
            "category": "Greedy Minimum Spanning Tree with Union-Find",
            "workload": "Connected undirected graph G = (V, E) matched identically with Prim's dataset",
            "files_funcs": "js/algorithms.js: runKruskalMST(), find(), union()",
            "data_structures": "Disjoint Set Union (DSU) structures: Int32Array parent, Uint8Array rank. Flat edge list Array of [u, v, weight].",
            "implementation_walkthrough": 
                "1. Greedy Edge-Sorting Paradigm: Extracts all E edges from the graph and sorts them in ascending order of edge weight in O(E log E) time.\n"
                "2. Disjoint Set Union (DSU) Mechanics:\n"
                "   - Two-pass Path Compression (find(i)): Climbs parent pointers to identify the representative root, then makes a second pass setting parent[curr] = root for all nodes along the path, flattening the tree to nearly constant depth.\n"
                "   - Union by Rank (union(i, j)): Attaches the root of the tree with smaller rank under the root of the tree with larger rank, incrementing rank only on ties.\n"
                "3. Spanning Forest Assembly: Scans sorted edges sequentially. For each edge (u, v, w), checks if find(u) === find(v). If identical, edge creates a cycle and is rejected. If distinct, calls union(u, v), adds edge to MST, and terminates when V - 1 edges are gathered.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Module III cornerstone demonstrating greedy matroid optimization and Disjoint Set Union.\n"
                "2. Sorting Bottleneck Vulnerability: Kruskal's running time is completely dominated by sorting all E edges. In sparse graphs (E ≈ 2V), Kruskal runs in O(V log V) and drastically outpaces Prim. However, in dense graphs (E ≈ V^2), Kruskal is forced to sort V^2 edges (costing O(V^2 log V)), making it significantly slower than Prim. Benchmarking both algorithms on identical seeded graphs visually proves this exact theoretical trade-off.",
            "complexities": 
                "• Time Complexity: Theta(E log E) = Theta(E log V) for edge sorting + Theta(E * alpha(V)) for DSU operations (where alpha is the Inverse Ackermann function, alpha(V) <= 4 for all practical inputs)\n"
                "• Auxiliary Space: Theta(V + E) for edge list and DSU parent/rank tables",
            "verifier": 
                "Invariant Verifier (v()): Confirms MST contains exactly V - 1 edges and that total MST weight equals Prim's total weight."
        },
        {
            "name": "Fractional Knapsack",
            "module": "Module II: Greedy Methods",
            "category": "Greedy Divisible Resource Allocation",
            "workload": "Item vectors w[], v[] with capacity C across random, capacity-stress, and adversarial families",
            "files_funcs": "js/algorithms.js: runFractionalKnapsack()",
            "data_structures": "Item objects { id, w, v, ratio = v/w }. Sorted array of items.",
            "implementation_walkthrough": 
                "1. Ratio Computation & Sorting: Computes value-to-weight ratio r_i = v_i / w_i for each item. Sorts items in descending order of ratio in O(n log n) time.\n"
                "2. Greedy Consumption: Iterates through sorted items. If item weight w_i <= remaining capacity curCap, takes 100% of the item, adds v_i to totalVal, and subtracts w_i from curCap.\n"
                "3. Fractional Boundary Split: When encountering the first item where w_i > curCap, takes a fraction frac = curCap / w_i, adds frac * v_i to totalVal, reduces curCap to 0, and halts immediately.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Module II greedy paradigm showcase.\n"
                "2. Linear Relaxation & Upper Bound: Fractional Knapsack serves as the theoretical linear relaxation of the NP-hard 0/1 Knapsack problem. Because items are infinitely divisible, the greedy-choice property holds unconditionally (provably optimal). In the lab, running Fractional Knapsack alongside 0/1 Knapsack on adversarial inputs (such as C=10, items: (6,12), (5,9), (5,9)) demonstrates why greedy succeeds when fractions are allowed (Value = 19.20) but fails catastrophically on discrete items (Greedy discrete gives 12, whereas DP optimal gives 18).",
            "complexities": 
                "• Time Complexity: Theta(n log n) for sorting + Theta(n) for greedy selection = Theta(n log n) overall\n"
                "• Problem Class: In P (Polynomial Time)\n"
                "• Auxiliary Space: Theta(n) for item objects and sort buffer",
            "verifier": 
                "Invariant Verifier (v()): Confirms that used capacity does not exceed knapsack capacity C (within 1e-6 floating-point tolerance)."
        },
        {
            "name": "0/1 Knapsack (Dynamic Programming)",
            "module": "Module I: Dynamic Programming",
            "category": "Discrete Pseudo-Polynomial Optimization",
            "workload": "Discrete indivisible items with capacity C across random and adversarial datasets",
            "files_funcs": "js/algorithms.js: run01Knapsack()",
            "data_structures": "Flattened 1D Int32Array dp representing (n + 1) x (C + 1) DP table.",
            "implementation_walkthrough": 
                "1. Memory Allocation & Safety Guard: Computes table dimensions rows = n + 1, cols = C + 1, totalCells = (n + 1) * (C + 1). If totalCells exceeds 4,000,000, immediately halts with a high-risk pseudo-polynomial memory explosion alert.\n"
                "2. Bottom-Up Tabulation: Uses a 1D Int32Array of size (n+1)*(C+1) to maximize CPU cache locality. Evaluates recurrence:\n"
                "   dp[i][c] = dp[i-1][c] if c < w_i\n"
                "   dp[i][c] = max(dp[i-1][c], dp[i-1][c - w_i] + v_i) if c >= w_i\n"
                "3. Item Backtracking: Reconstructs exact chosen items by backtracking from dp[n][C] to dp[0][0]. If dp[i][c] != dp[i-1][c], item i-1 was included; subtracts w[i-1] from c and continues.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Primary dynamic programming paradigm in Module I.\n"
                "2. Pseudo-Polynomial Memory Vulnerability: 0/1 Knapsack has a theoretical time complexity of Theta(n * C). In academic courses, students often mistake O(nC) for a polynomial algorithm. In reality, C is an integer encoded in log2(C) bits. When C is large (e.g. C = 10^7), the algorithm requires gigabytes of memory and billions of operations, demonstrating pseudo-polynomial blowup. Furthermore, comparing DP optimal (18) against Greedy-by-ratio (12) on adversarial inputs proves why discrete knapsack cannot be solved greedily.",
            "complexities": 
                "• Time Complexity: Theta(n * C) strictly\n"
                "• Problem Class: Decision form is NP-complete; Optimization form is NP-hard\n"
                "• Auxiliary Space: Theta(n * C) for full tabulation table (can be optimized to Theta(C) if item backtracking is omitted)",
            "verifier": 
                "Invariant Verifier (v()): Backtracks selected items and verifies that: (1) sum of weights <= C; (2) sum of selected item values exactly matches dp[n][C]."
        },
        {
            "name": "Floyd-Warshall (APSP)",
            "module": "Module I & III: Dynamic Programming",
            "category": "All-Pairs Shortest Paths Dynamic Programming",
            "workload": "Directed weighted graph distance matrix D[V][V] across sparse (15%), random (50%), and dense (90%) families",
            "files_funcs": "js/algorithms.js: runFloydWarshall()",
            "data_structures": "2D Number array dist[V][V] initialized with edge weights or Infinity.",
            "implementation_walkthrough": 
                "1. Matrix Initialization: Sets dist[i][i] = 0, dist[i][j] = weight if edge exists, and Infinity otherwise.\n"
                "2. Triple-Nested Loop Dynamic Programming: Loops over intermediate vertex k from 0 to V - 1, source vertex i from 0 to V - 1, and destination vertex j from 0 to V - 1.\n"
                "3. Path Relaxation Recurrence:\n"
                "   dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])\n"
                "   If dist[i][k] is Infinity, skips the innermost j loop entirely.\n"
                "4. Operation Counting: Measures exact inner loop iterations, proving it executes exactly V^3 operations regardless of edge density.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Explicitly mandated APSP dynamic programming algorithm in Modules I and III.\n"
                "2. Rigid Cubic Inflexibility Vulnerability: Unlike Dijkstra's algorithm (which adapts to graph sparsity), Floyd-Warshall executes exactly V^3 operations whether the graph has 5 edges or 50,000 edges. Doubling V increases runtime by exactly 2^3 = 8x. The workbench benchmark demonstrates that on sparse graphs, running Dijkstra V times (O(V * E log V)) is orders of magnitude faster than Floyd-Warshall's rigid cubic execution.",
            "complexities": 
                "• Time Complexity: Best, Average, Worst: Theta(V^3) strictly (exactly V^3 inner loop executions)\n"
                "• Problem Class: In P (Polynomial Time)\n"
                "• Auxiliary Space: Theta(V^2) for the 2D distance matrix",
            "verifier": 
                "Invariant Verifier (v()): Verifies that dist[i][i] === 0 for all i, and performs 1,000 random sample checks validating the Triangle Inequality: dist[i][j] <= dist[i][k] + dist[k][j]."
        },
        {
            "name": "Matrix Chain Multiplication",
            "module": "Module I: Dynamic Programming",
            "category": "Split-Table Dynamic Programming Optimization",
            "workload": "Matrix dimension vectors D[0..n] across random, increasing, and decreasing dimensions",
            "files_funcs": "js/algorithms.js: runMatrixChain(), getParenthesization(), recomputeCost()",
            "data_structures": "DP Cost Table m[1..n][1..n] and Split-Point Table s[1..n][1..n].",
            "implementation_walkthrough": 
                "1. Subproblem Formulation: Finds optimal parenthesization of matrices A1 * A2 * ... * An with dimensions D[i-1] x D[i] to minimize total scalar multiplications.\n"
                "2. Chain Length Iteration: Iterates chain length l from 2 to n. For each subchain [i, j] of length l, evaluates all possible split points k from i to j - 1:\n"
                "   m[i][j] = min_{i <= k < j} { m[i][k] + m[k+1][j] + D[i-1] * D[k] * D[j] }\n"
                "   Records the optimal split point k in table s[i][j].\n"
                "3. Parenthesization Reconstruction: Recursively navigates s[i][j] to construct the optimal parenthesized mathematical expression string: ((A1 x A2) x (A3 x A4)).\n"
                "4. Exact Inner Loop Counting: Proves mathematically that the inner loop executes exactly (n^3 - n) / 6 scalar cost comparisons.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Classic Module I dynamic programming exemplar.\n"
                "2. Eliminating Catalan Exponential Explosion: Brute-force parenthesization requires evaluating Catalan numbers C_{n-1} = (2n-2)! / ((n-1)! * n!) ≈ 4^n / (n^(1.5) * sqrt(pi)), which explodes exponentially (for n=30, C_29 > 10^15). Dynamic programming eliminates redundant subproblem recomputation, dropping complexity to Theta(n^3). The workbench contrasts DP scalar cost against naive left-to-right associative evaluation, demonstrating massive real-world computational savings.",
            "complexities": 
                "• Time Complexity: Theta(n^3) strictly; Inner operations = (n^3 - n) / 6\n"
                "• Problem Class: In P (Polynomial Time)\n"
                "• Auxiliary Space: Theta(n^2) for tables m and s",
            "verifier": 
                "Invariant Verifier (v()): Recursively traverses the recorded split table s[i,j], recalculates scalar multiplications from scratch, and verifies that the total cost exactly equals m[1][n]."
        },
        {
            "name": "N-Queens (Backtracking)",
            "module": "Module I: Backtracking",
            "category": "State-Space Tree Backtracking & Bitmask Pruning",
            "workload": "Chessboard size n x n across 'first' (single solution) and 'all' (exhaustive enumeration) modes",
            "files_funcs": "js/algorithms.js: runNQueens(), solve(row)",
            "data_structures": "Bitmask arrays: Uint8Array col[n], diag1[2n] (row+col), diag2[2n] (row-col+n-1). Solution vector Int32Array queens[n].",
            "implementation_walkthrough": 
                "1. State-Space Formulation: Places n queens on an n x n board such that no two queens share the same row, column, or diagonal.\n"
                "2. O(1) Bitmask Conflict Detection: Instead of scanning a 2D array in O(n) on each placement, uses three flat lookup arrays: col[c], diag1[r + c], and diag2[r - c + n - 1]. An attack is detected in O(1) time.\n"
                "3. Depth-First Backtracking: Places queens row-by-row. At row r, scans columns c = 0 to n - 1. If not attacked, marks bitmasks, sets queens[r] = c, and recurses to row r + 1. If no valid column exists, backtracks to row r - 1, unmarking bitmasks.\n"
                "4. Periodic Timeout Guard: Checks performance.now() every 2,048 steps against EXECUTION_DEADLINE to prevent browser thread freeze on large n.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Foundation of Module I backtracking algorithms.\n"
                "2. Backtracking vs Polynomial Solvability Nuance: In university exams, students frequently misclassify N-Queens as NP-complete. In reality, finding a single solution can be achieved in polynomial time via explicit algebraic constructions. However, exhaustive enumeration of ALL solutions creates a factorial state-space search tree. Benchmarking 'first' mode (stops in milliseconds) vs 'all' mode (explodes factorially: n=8 -> 92, n=10 -> 724, n=12 -> 14,200 solutions) exposes this exact distinction.",
            "complexities": 
                "• Time Complexity: Single solution: Polynomial average; All solutions: O(n!) worst-case search\n"
                "• Problem Class: NOT NP-complete (explicit polynomial constructions exist for n >= 4)\n"
                "• Auxiliary Space: Theta(n) for recursion stack and bitmask arrays",
            "verifier": 
                "Invariant Verifier (v()): In single-solution mode, verifies that the board placement is 100% attack-free across all rows, columns, and diagonals. In all-solution mode, verifies that solutions found match mathematical known counts."
        },
        {
            "name": "Hamiltonian Cycle",
            "module": "Module I: Backtracking & NP-Completeness",
            "category": "Exhaustive Permutation Backtracking on Graphs",
            "workload": "Graph G = (V, E) across sparse, random, dense, and pathological families",
            "files_funcs": "js/algorithms.js: runHamiltonian(), backtrack()",
            "data_structures": "Path stack Array path, Uint8Array visited[n], 2D adjacency matrix adj[n][n].",
            "implementation_walkthrough": 
                "1. Problem Definition: Finds a simple cycle visiting every vertex in graph G exactly once and returning to the starting vertex.\n"
                "2. Recursive State Exploration: Starts at vertex 0. Recursively attempts to extend path with unvisited vertex v adjacent to the current path endpoint. If path length reaches n, checks if edge (path[n-1], 0) exists. If yes, cycle is found and terminates. If no, rejects and backtracks.\n"
                "3. Pathological Family Formulation: The laboratory synthesizes a specially crafted pathological graph: a complete clique K_{n-1} on vertices 0 to n - 2, plus vertex n - 1 connected ONLY to vertex 0. Because vertex n - 1 has degree 1, no Hamiltonian cycle can ever exist (a cycle requires every vertex to have degree >= 2). However, plain backtracking has no lookahead lower bound, forcing it to exhaustively traverse all (n - 1)! permutations before terminating.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Standard NP-complete decision problem in Module I.\n"
                "2. Demonstrating the Flaw of Plain Backtracking: Contrast with Branch and Bound! In plain backtracking, if no cycle exists, the algorithm is forced to explore the entire factorial state-space tree. The pathological workbench test (Acceptance Test ham_pathological) proves that for n=9, the algorithm evaluates 109,608 states and rejects 95,908 branches before concluding failure, demonstrating the exponential wall.",
            "complexities": 
                "• Time Complexity: Worst-case: O((n - 1)!) factorial; Best-case: Omega(n)\n"
                "• Problem Class: Decision form is NP-complete; Search form is NP-hard\n"
                "• Auxiliary Space: Theta(n) for recursion stack and visited array",
            "verifier": 
                "Invariant Verifier (v()): If cycle found, asserts: (1) path length === n; (2) all vertices are unique (Set.size === n); (3) edge exists between all consecutive vertices; (4) closing edge exists between path[n-1] and path[0]."
        },
        {
            "name": "TSP Branch and Bound",
            "module": "Module I: Branch and Bound",
            "category": "Pruned State-Space Tree Optimization",
            "workload": "Complete distance matrix dist[n][n] across Euclidean 2D coordinates and Random Symmetric matrices",
            "files_funcs": "js/algorithms.js: runTSP(), branchAndBound()",
            "data_structures": "Distance matrix dist[n][n], precomputed minimum outgoing edge vector minOut[n], tour path stack path.",
            "implementation_walkthrough": 
                "1. Initial Upper Bound Heuristic: Runs a fast Nearest-Neighbor greedy heuristic from city 0 to establish an initial upper bound bestCost. This upper bound enables early pruning from the very first recursive branch.\n"
                "2. Lower Bound Calculation: Precomputes minOut[i] = min_{j != i} dist[i][j] for each city. For any partial path visiting current city currCity with accumulated cost nextCost, the optimistic lower bound for completing the tour is:\n"
                "   lowerBound = nextCost + sum_{unvisited} minOut[k]\n"
                "3. Bounding & Pruning Step: Before exploring a branch to nextCity, compares lowerBound >= bestCost. If the lower bound already meets or exceeds the best tour found so far, the entire subtree is PRUNED immediately without exploration.\n"
                "4. Optimal Tour Update: If a complete tour of length n is formed and currentCost + dist[curr][0] < bestCost, updates bestCost and records bestTour.",
            "why_used": 
                "Why used at this place in the laboratory:\n"
                "1. Direct Syllabus Alignment: Mandated combinatorial optimization algorithm in Module I.\n"
                "2. Proving the Superiority of Branch & Bound over Plain Backtracking: While plain backtracking explores the full (n-1)! tree, Branch and Bound uses bounding functions to prune millions of hopeless states. The workbench tests Euclidean metrics (satisfying the Triangle Inequality) against Random Symmetric matrices. In Euclidean mode, lower bounds are tight and pruning is massive. In random matrices where triangle inequality fails, lower bounds are loose and pruning degrades, demonstrating metric dependency.",
            "complexities": 
                "• Time Complexity: Worst-case: O((n - 1)!); Pruned case: Dramatically below factorial on Euclidean metrics\n"
                "• Problem Class: Decision form is NP-complete; Optimization form is NP-hard\n"
                "• Auxiliary Space: Theta(n^2 + n) for distance matrix and state stack",
            "verifier": 
                "Invariant Verifier (v()): Asserts that bestTour is a valid permutation of all n cities (Set.size === n), and recomputes the Euclidean cycle cost from scratch, verifying it exactly equals bestCost."
        }
    ]

    for idx, alg in enumerate(algs_detailed):
        add_h2(f"3.{idx+1} {alg['name']} ({alg['module']})")
        add_p(f"{alg['category']} | Target Workload: {alg['workload']}", bold_prefix="Algorithmic Classification: ")
        add_p(alg['files_funcs'], bold_prefix="Code Source & Functions: ")
        add_p(alg['data_structures'], bold_prefix="Internal Data Structures: ")
        add_p(alg['implementation_walkthrough'], bold_prefix="Implementation Walkthrough:\n")
        
        # Engineering Rationale Callout
        add_callout(f"WHY USED AT THIS PARTICULAR PLACE: {alg['name']}", alg['why_used'], border_color="0F2A4A", fill_hex="F8FAFC")
        
        add_p(alg['complexities'], bold_prefix="Asymptotic Complexities ($O, \\Omega, \\Theta$):\n")
        add_p(alg['verifier'], bold_prefix="Post-Execution Invariant Verifier: ")

    # =========================================================================
    # CHAPTER 4: CROSS-CUTTING ENGINEERING & VERIFICATION PROTOCOLS
    # =========================================================================
    add_h1("4. Cross-Cutting Engineering Frameworks")
    
    add_h2("4.1 Seeded PRNG Engine & Statistical Determinism")
    add_p(
        "Scientific benchmarking requires deterministic repeatability. The laboratory implements Mulberry32, a 32-bit generator that produces uniform pseudo-random distributions using 32-bit integer arithmetic. The exact algorithm in js/rng.js is implemented as follows:"
    )
    rng_code = (
        "function mulberry32(seed) {\n"
        "  return function() {\n"
        "    seed |= 0;\n"
        "    seed = (seed + 0x6D2B79F5) | 0;\n"
        "    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);\n"
        "    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;\n"
        "    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n"
        "  };\n"
        "}"
    )
    add_code_snippet(rng_code)
    add_p(
        "By binding every input generator to mulberry32(seed), two students running the laboratory in different countries on different operating systems with seed 42 will generate the EXACT identical graph, identical matrix dimensions, and identical knapsack item weights down to the last decimal place."
    )

    add_h2("4.2 Isolated Timing & Epistemological Protocol")
    add_p(
        "To ensure high-precision measurement, the laboratory separates timing from input generation, UI updates, and invariant checks:"
    )
    add_bullet(
        " performance.now() utilizes high-resolution hardware timers (sub-millisecond microsecond resolution).",
        "Hardware Resolution:"
    )
    add_bullet(
        " Input generation, array allocations, and RNG initialization run completely BEFORE the timer starts.",
        "Pre-Run Generation:"
    )
    add_bullet(
        " Mathematical invariant verification v(), DOM tree modifications, and canvas rendering execute strictly AFTER the timer stops.",
        "Post-Run Verification:"
    )
    add_bullet(
        " The result logger callback T is passed as null during benchmark runs. In JavaScript, function call overhead is non-trivial; by suppressing logging during timing, the algorithm executes at native JIT machine-code speed.",
        "Zero-Logging Execution:"
    )

    add_h2("4.3 Empirical Risk Classification Engine")
    add_p(
        "The benchmarking engine classifies every workload into LOW, MODERATE, or HIGH risk using latency thresholds and empirical growth slopes:"
    )
    add_bullet(
        " Execution time < 50 ms and empirical growth rate is sub-critical. The algorithm is practical and safe for production workloads.",
        "LOW Risk:"
    )
    add_bullet(
        " Execution time between 50 ms and 1,000 ms, OR empirical growth slope between consecutive sizes >= 4.0. The algorithm is currently practical but scales poorly.",
        "MODERATE Risk:"
    )
    add_bullet(
        " Execution time >= 1,000 ms, safety deadline timeout triggered, OR memory limit exceeded (e.g. 0/1 Knapsack > 4M cells). The algorithm is infeasible for production at this scale.",
        "HIGH Risk:"
    )

    # =========================================================================
    # CHAPTER 5: ACCEPTANCE TESTING & EMPIRICAL VALIDATION
    # =========================================================================
    add_h1("5. Acceptance Testing & Empirical Validation")
    add_p(
        "The project includes an automated suite of 10 Acceptance Tests implemented in js/tests.js. Each test asserts exact mathematical formulas and theoretical equivalences on live executions."
    )

    # Acceptance Test Table
    test_table = doc.add_table(rows=11, cols=4)
    test_widths = [Inches(1.2), Inches(2.2), Inches(1.8), Inches(1.3)]
    test_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER]
    
    test_rows = [
        ("Test ID", "Test Description & Formula", "Theoretical Assertion", "Live Result"),
        ("fw_ops", "Floyd-Warshall Loop Counting", "V=10 -> 1,000 | V=20 -> 8,000", "PASSED (Exact V^3)"),
        ("mcm_ops", "Matrix Chain Inner Loop Formula", "n=10 -> (10^3 - 10)/6 = 165", "PASSED (165 ops)"),
        ("mst_match", "Prim vs Kruskal MST Cost Equality", "Weight(Prim) === Weight(Kruskal)", "PASSED (Equal cost)"),
        ("adv_knapsack", "Adversarial Knapsack Failure Gap", "Frac=19.2, DP=18, Greedy=12", "PASSED (Exact match)"),
        ("nq_counts", "N-Queens Exact Solution Counts", "n=6 -> 4 | n=8 -> 92 solutions", "PASSED (Exact count)"),
        ("ham_path", "Hamiltonian Pathological Clique", "No cycle & pruned states > 1,000", "PASSED (Full reject)"),
        ("tsp_prune", "TSP Branch & Bound Pruning", "Valid tour & pruned branches > 0", "PASSED (Pruned > 1k)"),
        ("ds_verif", "Data Structures Invariants @ n=1000", "All 4 families pass all invariants", "PASSED (16/16 suites)"),
        ("fw_norm", "Floyd-Warshall Normalization", "Ops / Theory ratio ≈ 1.00", "PASSED ([1.0, 1.0, 1.0])"),
        ("nq_to", "N-Queens Timeout Safety Guard", "Halts safely & reports HIGH risk", "PASSED (Safe halt)")
    ]
    
    for r_idx, row_data in enumerate(test_rows):
        row = test_table.rows[r_idx]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            p = cell.paragraphs[0]
            p.add_run(val)
    format_table(test_table, test_widths, test_aligns)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # CHAPTER 6: COMPREHENSIVE VIVA VOCE PREPARATION GUIDE
    # =========================================================================
    add_h1("6. Comprehensive Viva Voce Preparation Guide")
    add_p(
        "This section prepares students for oral examination (Viva Voce) defense before academic examiners, covering top theoretical questions, implementation nuances, and examiner traps."
    )

    viva_qa = [
        (
            "Q1: Why is 0/1 Knapsack termed 'pseudo-polynomial' while Fractional Knapsack is polynomial?",
            "Fractional Knapsack runs in O(n log n) time, which is polynomial in the number of items n. In contrast, 0/1 Knapsack dynamic programming runs in Theta(n * C) time, where C is the numeric capacity. In computational complexity theory, an algorithm is polynomial only if its running time is bounded by a polynomial in the length of the input representation in bits. An integer C requires only k = ceil(log2(C)) bits to encode. Therefore, Theta(n * C) = Theta(n * 2^k), which is exponential in the input bit-length k! It is polynomial only when C is bounded by a polynomial in n, hence 'pseudo-polynomial'."
        ),
        (
            "Q2: Why does Fibonacci Heap achieve O(1) amortized decrease-key while Binomial Heap requires Theta(log n)?",
            "In a Binomial Heap, trees have rigid, immutable structures (tree Bk must have exactly 2^k nodes). When decrease-key decreases a key, it must restore heap order by bubbling the key up along parent pointers, traversing up to height h = log2(n) in Theta(log n) time. In a Fibonacci Heap, decrease-key is lazy: if the heap property is violated, it cuts the node from its parent and moves it directly to the root list in O(1) time. Cascading cuts ensure that a node loses at most one child before being cut itself, which keeps tree degree bounded by O(log n) while maintaining O(1) amortized cost."
        ),
        (
            "Q3: When does Prim's algorithm outperform Kruskal's, and vice versa?",
            "Prim's algorithm with a binary min-heap runs in O(E log V). Kruskal's algorithm runs in O(E log E) = O(E log V) because it sorts all edges. In sparse graphs where E ≈ 2V, Kruskal is faster because sorting 2V edges is extremely lightweight and DSU operations are nearly constant time O(alpha(V)). However, in dense graphs where E ≈ V^2 / 2, Kruskal must sort V^2 edges, costing O(V^2 log V) time. An un-heaped matrix Prim runs in O(V^2) strictly, completely beating Kruskal on dense networks."
        ),
        (
            "Q4: What is proactive splitting in B-Trees, and why is it superior to bottom-up splitting?",
            "In naive B-Tree insertion, keys are inserted at leaves. If a leaf overflows (keys = 2t), it splits and propagates a median key upward to its parent. If the parent is also full, splitting cascades all the way to the root, requiring parent pointers and multiple passes. Proactive top-down splitting solves this: as the algorithm traverses down the tree toward the leaf, whenever it encounters ANY node with 2t - 1 keys, it splits it immediately before descending further. This guarantees that when a leaf is reached, its parent is guaranteed to have space, allowing insertion in a single downward pass."
        ),
        (
            "Q5: Why is Hamiltonian Cycle NP-complete while Eulerian Tour is in P?",
            "An Eulerian Tour visits every EDGE exactly once. By Euler's Theorem, a connected graph has an Eulerian tour if and only if every vertex has an even degree (or exactly two vertices have odd degree for an Eulerian path). This can be checked in O(V + E) time by simply counting vertex degrees. In contrast, a Hamiltonian Cycle visits every VERTEX exactly once. There is no known local degree condition that guarantees a Hamiltonian cycle; finding one requires exploring exponential permutations, making it NP-complete."
        ),
        (
            "Q6: What is the fundamental difference between Backtracking and Branch & Bound?",
            "Both search state-space trees. Backtracking uses Depth-First Search (DFS) and is primarily applied to decision and constraint satisfaction problems (e.g. N-Queens, Hamiltonian Cycle). It prunes branches only when feasibility constraints are violated. Branch and Bound is applied to combinatorial optimization problems (e.g. TSP, 0/1 Knapsack optimization). It uses bounding functions (optimistic lower bounds for minimization) to compare against a best-known solution (upper bound), pruning entire subtrees even if they are feasible if they cannot improve on the current best solution."
        ),
        (
            "Q7: Why does Floyd-Warshall run in Theta(V^3) regardless of whether the graph is sparse or dense?",
            "Floyd-Warshall dynamic programming consists of three nested loops: k from 0 to V-1, i from 0 to V-1, and j from 0 to V-1. It systematically tests whether intermediate vertex k can shorten the path between i and j. The algorithm does not traverse an adjacency list; it operates on the full V x V distance matrix. As a result, the inner loop executes exactly V^3 times, completely oblivious to edge density."
        ),
        (
            "Q8: How does Matrix Chain Multiplication eliminate exponential Catalan search?",
            "Multiplying a chain of n matrices can be parenthesized in C_{n-1} different ways, where C_k is the Catalan number: C_{n-1} = (2n-2)! / ((n-1)! * n!) ≈ 4^n / (n^1.5 * sqrt(pi)). Brute force must evaluate every parenthesization. However, the problem exhibits optimal substructure: the optimal parenthesization of A_i ... A_j consists of optimal parenthesizations of subchains A_i ... A_k and A_{k+1} ... A_j. By storing subchain costs in a table m[i, j] and computing them in order of increasing chain length, DP eliminates all redundant subproblem evaluations, running in strictly Theta(n^3) time."
        ),
        (
            "Q9: Why are bitmasks used in N-Queens instead of a 2D boolean array?",
            "Checking if a queen placed at (row, col) is attacked using a 2D chessboard array requires scanning the entire column (O(n)) and both diagonal directions (O(n)), requiring O(n) time per placement check. By utilizing three flat 1D bitmasks (col[c], diag1[r + c], and diag2[r - c + n - 1]), checking whether a cell is attacked is reduced to three array index lookups, executing in O(1) time. This speeds up backtracking by an order of magnitude."
        ),
        (
            "Q10: What happens to TSP Branch and Bound when the Triangle Inequality is violated?",
            "The Triangle Inequality states that dist[i][j] <= dist[i][k] + dist[k][j]. In Euclidean metrics, this holds naturally. The minimum outgoing edge lower bound sum_{unvisited} minOut[k] is relatively tight, allowing Branch and Bound to prune vast portions of the state tree. However, on random distance matrices where the triangle inequality is violated, the lower bound estimator becomes loose (far below the actual tour cost). As a result, lowerBound < bestCost for almost every branch, pruning fails, and the search degrades to near-factorial worst-case exploration."
        )
    ]

    for q, a in viva_qa:
        add_callout(q, a, border_color="0284C7", fill_hex="F0F9FF")

    # =========================================================================
    # CHAPTER 7: CONCLUSION & SUMMARY TABLE
    # =========================================================================
    add_h1("7. Summary Matrix & Academic Conclusion")
    add_p(
        "The following master table synthesizes the complete syllabus mapping, time/space complexities, engineering rationale, and invariant validation for all 13 algorithms:"
    )

    summary_table = doc.add_table(rows=14, cols=5)
    summary_widths = [Inches(1.3), Inches(1.2), Inches(1.4), Inches(1.3), Inches(1.3)]
    summary_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    
    summary_rows = [
        ("Algorithm", "Module", "Time Complexity", "Space", "Primary Invariant Verified"),
        ("Binomial Heap", "Module I", "Insert O(1) am / O(log n)\nExt-Min O(log n)", "Theta(n)", "Strictly sorted extraction sequence"),
        ("Fibonacci Heap", "Module II", "Insert Theta(1)\nDec-Key O(1) am\nExt-Min O(log n) am", "Theta(n)", "Sorted extraction sequence"),
        ("B-Tree (t=3)", "Module I", "Search/Ins/Del:\nTheta(log n)", "Theta(n)", "Identical leaf depth & sorted inorder"),
        ("Red-Black Tree", "Module II", "Search/Ins/Del:\nTheta(log n) (<=2 rot)", "Theta(n)", "Black root, no Red-Red, equal black-height"),
        ("Prim's MST", "Module III", "Theta(E log V)", "Theta(V+E)", "V-1 edges & Cost == Kruskal Cost"),
        ("Kruskal's MST", "Module III", "Theta(E log E) =\nTheta(E log V)", "Theta(V+E)", "V-1 edges & Cost == Prim Cost"),
        ("Fractional Knapsack", "Module II", "Theta(n log n)", "Theta(n)", "Used capacity <= C"),
        ("0/1 Knapsack (DP)", "Module I", "Theta(n * C)\nPseudo-Polynomial", "Theta(n*C)", "Sum weights <= C & Sum values == dp[n][C]"),
        ("Floyd-Warshall", "Module I & III", "Theta(V^3)\nExact V^3 loops", "Theta(V^2)", "dist[i][i]==0 & Triangle Inequality"),
        ("Matrix Chain Mult.", "Module I", "Theta(n^3)\nOps=(n^3-n)/6", "Theta(n^2)", "Recomputed split cost == m[1][n]"),
        ("N-Queens", "Module I", "Single: Poly avg\nAll: O(n!) worst", "Theta(n)", "Zero mutual queen attacks across board"),
        ("Hamiltonian Cycle", "Module I", "Worst: O((n-1)!)\nBest: Omega(n)", "Theta(n)", "Valid cycle visiting all V vertices"),
        ("TSP Branch & Bound", "Module I", "Worst: O((n-1)!)\nPruned on Euclidean", "Theta(n^2+n)", "Valid permutation & cost matches bestCost")
    ]
    
    for r_idx, row_data in enumerate(summary_rows):
        row = summary_table.rows[r_idx]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            p = cell.paragraphs[0]
            p.add_run(val)
    format_table(summary_table, summary_widths, summary_aligns)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    add_p(
        "Conclusion: The DAA Algorithm Vulnerability & Stress-Testing Laboratory provides a rigorous, fully verified, student-friendly academic laboratory completely aligned with the B.Tech Semester III syllabus. By coupling theoretical complexity analysis with genuine empirical measurement, isolated microsecond timing, and post-run invariant assertions, the system delivers an uncompromised learning and demonstration platform."
    )

    doc.save(output_path)
    print(f"Document successfully created and saved to: {output_path}")

if __name__ == '__main__':
    target = os.path.join(os.getcwd(), "DAA_Project_Summary_Implementation_Report.docx")
    create_full_document(target)

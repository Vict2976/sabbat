# Evaluation knowledge base: sabbat

Additive, grounded documentation produced as PR #0. No existing code was modified beyond inserting
comment identifiers; everything else lives here under `.eval/`, apart from the files listed under
"Outside .eval/".

## Contents (30 file(s) added)

- [`CLAUDE.md`](CLAUDE.md): Repo-specific orientation for AI agents (build, identifiers, conventions).
- [`INDEX.md`](INDEX.md): This index: every file this pull request adds.
- [`architecture/Architecture.md`](architecture/Architecture.md): System overview, module table (with [AI] markers), dependency graph.
- [`architecture/guidelines.md`](architecture/guidelines.md): Coding conventions, each backed by ≥2 verbatim code examples.
- [`architecture/modules/api.md`](architecture/modules/api.md): Summary of the `api` module, with the files it names.
- [`architecture/modules/root.md`](architecture/modules/root.md): Summary of the `root` module, with the files it names.
- [`architecture/modules/src-components.md`](architecture/modules/src-components.md): Summary of the `src-components` module, with the files it names.
- [`architecture/modules/src-contexts.md`](architecture/modules/src-contexts.md): Summary of the `src-contexts` module, with the files it names.
- [`architecture/modules/src-hooks.md`](architecture/modules/src-hooks.md): Summary of the `src-hooks` module, with the files it names.
- [`architecture/modules/src-integrations.md`](architecture/modules/src-integrations.md): Summary of the `src-integrations` module, with the files it names.
- [`architecture/modules/src-lib.md`](architecture/modules/src-lib.md): Summary of the `src-lib` module, with the files it names.
- [`architecture/modules/src-routes.md`](architecture/modules/src-routes.md): Summary of the `src-routes` module, with the files it names.
- [`architecture/modules/src.md`](architecture/modules/src.md): Summary of the `src` module, with the files it names.
- [`business/BusinessRules.md`](business/BusinessRules.md): Business rules, sourced, marked verifiable (yes/no), linked to @uxid.
- [`business/USPs.md`](business/USPs.md): Unique selling propositions, sourced to docs, mapped to @uxid.
- [`design-system/components.md`](design-system/components.md): The component inventory: every @uxid with its file, flow and type, coverage per flow, then each component’s variant axes, values and states.
- [`design-system/design.json`](design-system/design.json): The whole extracted design system as one record: theme sources, token groups, scales, component variants, composition, disagreements.
- [`design-system/kit.json`](design-system/kit.json)
- [`design-system/playbook.html`](design-system/playbook.html): The design system as one self-contained page. Open it from the checkout; nothing serves it.
- [`design-system/playbook.md`](design-system/playbook.md): The readable playbook: where the theme is declared, the palette and scales, the primitives, and where the app disagrees with itself.
- [`design-system/tokens.json`](design-system/tokens.json): Design tokens: role, family, light/dark pair, utility name, usage count, and every declaration site.
- [`design-system/tokens.md`](design-system/tokens.md): The token catalogue, grouped by the job each token does.
- [`design-system/typography.json`](design-system/typography.json): Fonts, @font-face rules and the type scale, as declared.
- [`knowledge/company.md`](knowledge/company.md): What the company is and sells, in its own sourced words.
- [`knowledge/customers.md`](knowledge/customers.md): Who uses the product, and the outcome each segment came for.
- [`knowledge/glossary.md`](knowledge/glossary.md): Terms the company uses in a specific way, as its material defines them.
- [`knowledge/goals.md`](knowledge/goals.md): What "good" means to this company, each goal with its source.
- [`pipeline.yaml`](pipeline.yaml): Detected stack, the install/build/analyze/test commands, and whether each was run.
- [`product-map.json`](product-map.json): The product in four floors: pages, API actions, the code doing the work, its data.
- [`trace-map.json`](trace-map.json): Every component, element and prompt the scan found, with its id and route.

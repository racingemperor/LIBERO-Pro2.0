# LIBERO-Pro2.0 Website

A static website for the LIBERO-Pro2.0 benchmark: 42 perturbation types across six domains, with eight evaluation tasks and 32 training tasks.

[Website](https://racingemperor.github.io/LIBERO-Pro2.0/) · [Benchmark code](https://github.com/LIBERO-Pro-Team/LIBERO-Pro2.0)

## Pages

| Page | Features |
| --- | --- |
| Home | Moving task background, benchmark overview, news, overview film, task galleries, model previews and citations. |
| Document | Task instructions, success conditions, perturbation designs, support coverage and training-data demonstrations. |
| Leaderboard | Model comparison charts, domain and perturbation rankings, model profiles and task-level videos for 18 models. |
| Report | LIBERO-Pro2.0, LIBERO-Pro and LIBERO-Gen papers with previews and resource links. |
| Community | Community invitations, QR codes and platform links. |

Shared features include light/dark themes, responsive layouts, video galleries and navigation without full-page reloads.

## Local preview

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open [localhost:8765](http://127.0.0.1:8765/). No frontend dependencies or build step are required.

## Project layout

- Root HTML files: page entry points.
- `assets/`: styles, scripts, fonts, images and local videos.
- `data/`: public display data and media references.
- `scripts/`: data checks and asset preparation tools.

## Data and media

The site publishes display scores and demonstration videos; internal evaluation records are excluded. Additional videos are hosted in [LIBERO-Pro-media](https://github.com/racingemperor/LIBERO-Pro-media). The overview film plays on click; demonstration galleries support muted autoplay.

## Credits

Template attribution: [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Layout and interaction reference: [RoboDojo](https://robodojo-benchmark.com/).

Asset sources and licenses: [icons](assets/icons/README.md), [institution marks](assets/institutions/README.md), [task demonstrations](assets/rollouts/base/README.md), [model imagery](data/model-assets.json) and [Lato fonts](assets/fonts/OFL-Lato.txt). Third-party marks belong to their owners.

## Deployment

GitHub Pages serves the repository root from `site-framework-experiment`.

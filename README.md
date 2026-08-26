# ComfyUI-PlagueKind-Nodes_experimental

Experimental fork of
[PlagueKind/ComfyUI-PlagueKind-Nodes](https://github.com/PlagueKind/ComfyUI-PlagueKind-Nodes),
currently based on PlagueKind v1.3.8.

This fork keeps the original node pack but changes MiniMax H3 SLA Attention. It
adds precise language/audio protection and an optional, independently tunable
visual-reference quota. The other PlagueKind nodes are inherited unchanged.

> [!CAUTION]
> Do **not** install this fork and the original PlagueKind repository at the
> same time. Both packages register the same ComfyUI node identifiers. Keeping
> both folders in `ComfyUI/custom_nodes` can cause duplicate registration,
> unpredictable import order, or the wrong implementation being loaded.
> Install exactly one version, then restart ComfyUI.

## What differs from PlagueKind v1.3.8

### Precise language and audio protection

The original `protect_audio` implementation broadly protected every packed
block before target video. With large image/video references, that also made
all visual-reference blocks mandatory for every attention query.

This fork identifies the packed MiniMax H3 segments. With audio protection set
to its default `True`, it guarantees only:

- actual language tokens;
- reference-audio blocks;
- target-audio blocks.

Qwen vision tokens and image/video-reference blocks are not removed. With
reference protection set to `Off`, they return to ordinary score-based sparse
top-k selection instead of being mandatory.

Motion-stabilization history is limited to target-video query rows. Video
stabilization continues to work, while text and audio routing is recalculated
for each denoising step.

### Protect Audio / Language

The former Boolean `protect_audio` control now has three modes. It covers the
actual language-token, reference-audio, and target-audio ranges together:

| Mode | Behaviour | Typical use |
| --- | --- | --- |
| `True` | Guarantees every language and audio block. | Safest audio behaviour and the default. |
| `Manual` | Guarantees a score-selected fraction inside each language/audio range. | Experiment with lower overhead while retaining an audio minimum. |
| `Off` | Adds no dedicated language/audio quota; those blocks still compete in global top-k. | LightX2V-style uniform sparsity and maximum speed. |

When `Manual` is selected, the node reveals `Audio Sparsity Ratio`:

- `0.80` skips 80% and guarantees the best-scoring 20% of each language,
  reference-audio, and target-audio range;
- `0.90` skips 90% and guarantees the best-scoring 10%;
- `0.00` guarantees all language/audio blocks.

The Manual quota is additive and does not evict ordinary video selections.
Existing workflows that stored the old Boolean remain compatible: `true` maps
to `True`, while `false` maps to `Off`.

### Protect Video/Image Reference

The H3 SLA Attention node adds a three-mode control named
`Protect Video/Image Reference`:

| Mode | Behaviour | Typical use |
| --- | --- | --- |
| `Off` | No dedicated reference quota. References still compete in ordinary global top-k. | Fastest option and the default. |
| `Manual` | Guarantees a score-selected fraction of every visual-reference range. | Balance reference adherence against speed. |
| `True` | Guarantees every Qwen vision and visual-reference block. | Maximum reference protection, similar to the broad legacy behaviour. |

When `Manual` is selected, the node reveals `Reference Sparsity Ratio`:

- `0.80` skips 80% and guarantees the best-scoring 20% of each reference
  range per query;
- `0.90` skips 90% and guarantees the best-scoring 10%;
- `0.00` guarantees all reference blocks;
- setting it equal to the main `sparsity_ratio` gives references the same
  nominal keep percentage as global sparse attention.

The manual reference quota is additive. Guaranteed reference blocks are added
on top of normal global top-k, so enabling the quota does not evict video
blocks that SLA would otherwise select. Consequently, stronger reference
protection increases attention work and may reduce the speed gain.

The numeric reference-sparsity control is used only in `Manual` mode and is
hidden in the ComfyUI node for `Off` and `True`.

## Suggested starting points

- Safest audio behaviour: audio `True`.
- Experimental partial audio protection: audio `Manual`, `0.80`.
- LightX2V-style audio routing: audio `Off`.
- No visual reference or maximum speed: `Off`.
- Reference image/video with a cautious speed compromise: `Manual`, `0.80`.
- Lighter protection: `Manual`, `0.90`.
- A/B comparison against broad prefix protection: `True`.

These modes are experimental. Reference adherence, identity, motion, speech,
and audio/video synchronization should be compared with identical seeds and
settings before choosing a default for production workflows.

## Installation

First remove or move the original repository out of `custom_nodes`. Then:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/lukas-9936/ComfyUI-PlagueKind-Nodes_experimental.git
```

Restart ComfyUI. If updating an existing installation, pull the latest `main`
and refresh ComfyUI's frontend/node definitions so the conditional Manual
slider script is reloaded.

## Compatibility and requirements

- Based on PlagueKind v1.3.8.
- Requires the same dependencies as the upstream node pack.
- H3 SLA Attention requires Triton and a supported GPU; unsupported setups
  fall back safely as in upstream.
- Existing workflows remain compatible: legacy audio Booleans are accepted,
  and both numeric Manual controls were appended to the node inputs.

## Upstream and license

All original node-pack work belongs to the upstream project and its
contributors. See
[PlagueKind/ComfyUI-PlagueKind-Nodes](https://github.com/PlagueKind/ComfyUI-PlagueKind-Nodes)
for the original documentation and project history.

THIS IS NOT A PERMANENTLY MAINTAINED FORK, IT IS ONLY FOR TESTING A QUICKER AUDIO IMPLEMENTATION!

This fork remains under the repository's MIT License.

# ComfyUI-PlagueKind-Nodes_experimental

Experimental fork of
[PlagueKind/ComfyUI-PlagueKind-Nodes](https://github.com/PlagueKind/ComfyUI-PlagueKind-Nodes),
currently based on PlagueKind v1.3.8.

This fork keeps the original node pack but changes MiniMax H3 SLA Attention. It
adds precise language/audio protection and a simple visual-reference protection
control based on local quality and speed testing. The other PlagueKind nodes are
inherited unchanged.

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

This fork identifies the packed MiniMax H3 segments. With `protect_audio`
enabled, it guarantees only:

- actual language tokens;
- reference-audio blocks;
- target-audio blocks.

Qwen vision tokens and image/video-reference blocks are controlled separately.
Motion-stabilization history is also limited to target-video query rows, so
language and audio routing remains step-local.

`protect_audio` is deliberately an all-or-nothing Boolean again. Testing found
that partially sparsifying audio produced occasional noise, pronunciation, and
stability failures for little measurable speed benefit. Keep it enabled unless
you explicitly want LightX2V-style uniform sparsity.

### Protect Image/Video Reference

The H3 SLA Attention node has three visual-reference modes. They cover every
detected visual-conditioning range: Qwen vision tokens, conditioning/image
reference blocks, and video-reference blocks.

| Mode | Behaviour | Typical use |
| --- | --- | --- |
| `True` | Guarantees every Qwen vision and image/video-reference block. | Maximum reference protection; slowest. |
| `Light` | Uses fixed 0.85 sparsity independently inside each detected visual-reference range, guaranteeing its best-scoring 15%. | Audited speed/quality compromise. |
| `Off` | Adds no dedicated reference quota; references still participate in ordinary global top-k. | Fastest, but least protected. |

The `Light` quota is additive: its selected reference blocks are added on top
of normal global top-k and do not evict video blocks SLA would otherwise keep.
Consequently, measured overall sparsity will be lower than requested global
sparsity whenever reference protection is enabled.

The visual quota also includes the fix for the old `protected_ranges` variable
name error. Without that fix, enabling visual protection could silently make SLA
fall back to dense attention.

## Suggested configuration

- Keep `protect_audio` enabled for stable speech and audio/video sync.
- Use the main `sparsity_ratio` as the primary target-video speed control.
- For image or video references, start with visual protection `Light`.
- Use visual protection `True` only when maximum reference adherence is worth
  the additional attention work.
- Use visual protection `Off` for maximum speed or when no reference is present.

Workflows saved during the earlier experimental PR remain fail-safe: an old
audio `Manual` value maps to fully protected audio, while an old visual
`Manual` value maps to the fixed `Light` preset.

## Installation

First remove or move the original repository out of `custom_nodes`. Then:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/lukas-9936/ComfyUI-PlagueKind-Nodes_experimental.git
```

Restart ComfyUI after installing or updating so its frontend and node schema are
reloaded.

## Compatibility and requirements

- Based on PlagueKind v1.3.8.
- Requires the same dependencies as the upstream node pack.
- H3 SLA Attention requires Triton and a supported GPU; unsupported setups
  fall back safely as in upstream.
- The original Boolean audio workflow values remain compatible.

## Upstream and license

All original node-pack work belongs to the upstream project and its
contributors. See
[PlagueKind/ComfyUI-PlagueKind-Nodes](https://github.com/PlagueKind/ComfyUI-PlagueKind-Nodes)
for the original documentation and project history.

THIS IS NOT A PERMANENTLY MAINTAINED FORK. IT EXISTS FOR EXPERIMENTAL H3 SLA
TESTING.

This fork remains under the repository's MIT License.

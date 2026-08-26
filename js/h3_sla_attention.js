import { app } from "../../scripts/app.js";

const NODE_TYPE = "H3SLAAttention";

app.registerExtension({
    name: "PlagueKind.H3SLAAttention.ProtectionModes",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalOnNodeCreated?.apply(this, arguments);
            const node = this;

            function normalizeLegacyBoolean(widget) {
                if (widget?.value === true) widget.value = "True";
                if (widget?.value === false) widget.value = "Off";
            }

            function applyProtectionModes() {
                const referenceMode = node.widgets?.find(
                    widget => widget.name === "reference_protection"
                );
                const referenceRatio = node.widgets?.find(
                    widget => widget.name === "reference_sparsity_ratio"
                );
                const audioMode = node.widgets?.find(
                    widget => widget.name === "protect_audio"
                );
                const audioRatio = node.widgets?.find(
                    widget => widget.name === "audio_sparsity_ratio"
                );

                normalizeLegacyBoolean(audioMode);

                if (referenceMode && referenceRatio) {
                    referenceMode.label = "Protect Video/Image Reference";
                    referenceRatio.label = "Reference Sparsity Ratio";
                    referenceRatio.hidden = referenceMode.value !== "Manual";
                }
                if (audioMode && audioRatio) {
                    audioMode.label = "Protect Audio / Language";
                    audioRatio.label = "Audio Sparsity Ratio";
                    audioRatio.hidden = audioMode.value !== "Manual";
                }

                const computed = node.computeSize();
                node.setSize([node.size[0], computed[1]]);
                node.graph?.setDirtyCanvas(true, true);
            }

            for (const name of ["reference_protection", "protect_audio"]) {
                const mode = node.widgets?.find(widget => widget.name === name);
                if (!mode) continue;
                const originalCallback = mode.callback;
                mode.callback = function (...args) {
                    const callbackResult = originalCallback?.apply(this, args);
                    applyProtectionModes();
                    return callbackResult;
                };
            }

            requestAnimationFrame(applyProtectionModes);
            return result;
        };
    },
});

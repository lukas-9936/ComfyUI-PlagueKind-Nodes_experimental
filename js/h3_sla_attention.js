import { app } from "../../scripts/app.js";

const NODE_TYPE = "H3SLAAttention";

app.registerExtension({
    name: "PlagueKind.H3SLAAttention.ReferenceProtection",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalOnNodeCreated?.apply(this, arguments);
            const node = this;

            function applyReferenceMode() {
                const mode = node.widgets?.find(
                    widget => widget.name === "reference_protection"
                );
                const ratio = node.widgets?.find(
                    widget => widget.name === "reference_sparsity_ratio"
                );
                if (!mode || !ratio) return;

                mode.label = "Protect Video/Image Reference";
                ratio.label = "Reference Sparsity Ratio";
                ratio.hidden = mode.value !== "Manual";

                const computed = node.computeSize();
                node.setSize([node.size[0], computed[1]]);
                node.graph?.setDirtyCanvas(true, true);
            }

            const mode = node.widgets?.find(
                widget => widget.name === "reference_protection"
            );
            if (mode) {
                const originalCallback = mode.callback;
                mode.callback = function (...args) {
                    const callbackResult = originalCallback?.apply(this, args);
                    applyReferenceMode();
                    return callbackResult;
                };
            }

            requestAnimationFrame(applyReferenceMode);
            return result;
        };
    },
});

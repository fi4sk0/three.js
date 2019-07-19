/**
 *  @author scrubs / https://www.mecabricks.com
 */

import { TempNode } from '../threejs/r106/examples/jsm/nodes/core/TempNode.js';
import { FunctionNode } from '../threejs/r106/examples/jsm/nodes/core/FunctionNode.js';

class MixNormalNode extends TempNode {
    constructor(n1, n2, method) {
        super('v3');

        this.n1 = n1;
        this.n2 = n2;

        this.method = method || MixNormalNode.UDN;
    }

    generate(builder, output) {
        // Normal blending from https://blog.selfshadow.com/publications/blending-in-detail/
        let mixingIntructions;
        switch(this.method) {
            // Linear Blending
            case MixNormalNode.LINEAR:
                mixingIntructions = 'n = normalize(n1 + n2);';
                break;

            // Overlay Blending
            case MixNormalNode.OVERLAY:
                mixingIntructions  = 'n = lessThan(n1, vec3(0.5)) == bvec3(true, true, true) ? 2.0 * n1 * n2 : 1.0 - 2.0 * (1.0 - n1) * (1.0 - n2);';
                mixingIntructions += 'n = normalize(n * 2.0 - 1.0);';
                break;

            // Partial Derivatives
            case MixNormalNode.PDERIVATIVE:
                mixingIntructions  = 'vec2 pd = n1.xy * n2.z + n2.xy * n1.z;';
                mixingIntructions += 'n = normalize(vec3(pd, n1.z * n2.z));';
                break;

            // Whiteout
            case MixNormalNode.WHITEOUT:
                mixingIntructions = 'n = normalize(vec3(n1.xy + n2.xy, n1.z * n2.z));';
                break;

            // Unreal Developer Network
            case MixNormalNode.UDN:
                mixingIntructions = 'n = normalize(vec3(n1.xy + n2.xy, n1.z));';
                break;

            // Unity
            case MixNormalNode.UNITY:
                mixingIntructions  = `mat3 nBasis = mat3(vec3(n1.z, n1.y, -n1.x),
                    vec3(n1.x, n1.z, -n1.y),
                    vec3(n1.x, n1.y, n1.z));`;
                mixingIntructions += 'n = normalize(n2.x * nBasis[0] + n2.y * nBasis[1] + n2.z * nBasis[2]);';
                break;
        }

        let mixing = new FunctionNode([
            'vec3 mix_normal(vec3 n1, vec3 n2) {',
            '   vec3 n;',
            mixingIntructions,
            '   return n;',
            '}'
        ].join('\n'), null, {derivatives: true});

        return builder.format(builder.include(mixing) +
            '( ' + this.n1.build(builder, 'v3') + ', ' + this.n2.build(builder, 'v3') + ' )'
            , this.getType(builder), output
        );
    }
}

MixNormalNode.LINEAR = 'linear';
MixNormalNode.OVERLAY = 'overlay';
MixNormalNode.PDERIVATIVE = 'partial derivative';
MixNormalNode.WHITEOUT = 'whiteout';
MixNormalNode.UDN = 'udn';
MixNormalNode.UNITY = 'unity';

export { MixNormalNode };

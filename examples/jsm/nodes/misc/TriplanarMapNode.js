/**
 *  @author scrubs / https://www.mecabricks.com
 */

import { TempNode } from '../threejs/r106/examples/jsm/nodes/core/TempNode.js';
import { FunctionNode } from '../threejs/r106/examples/jsm/nodes/core/FunctionNode.js';
import { NormalNode } from '../threejs/r106/examples/jsm/nodes/accessors/NormalNode.js';
import { PositionNode } from '../threejs/r106/examples/jsm/nodes/accessors/PositionNode.js';

class TriplanarMapNode extends TempNode {
    constructor(texture, scale) {
        super('v4');

        this.texture = texture;
        this.scale = scale;
    }

    generate(builder, output) {
        let mapping = new FunctionNode([
            'vec4 triplanar_mapping(sampler2D texture, vec3 normal, vec3 position, float scale) {',

            // Asymmetric Triplanar Blend
            // https://medium.com/@bgolus/normal-mapping-for-a-triplanar-shader-10bf39dca05a
            '   vec3 blend = vec3(0.0);',
            '   vec2 xzBlend = abs(normalize(normal.xz));',
            '   blend.xz = max(vec2(0.0), xzBlend - 0.67);',
            '   blend.xz /= dot(blend.xz, vec2(1.0));',

            '   blend.y = clamp((abs(normal.y) - 0.675) * 80.0, 0.0, 1.0);',
            '   blend.xz *= (1.0 - blend.y);',

			// Triplanar mapping
			'	vec2 tx = position.yz * scale;',
			'	vec2 ty = position.zx * scale;',
			'	vec2 tz = position.xy * scale;',

			// Base color
			'	vec4 cx = texture2D(texture, tx) * blend.x;',
			'	vec4 cy = texture2D(texture, ty) * blend.y;',
			'	vec4 cz = texture2D(texture, tz) * blend.z;',
			'	return cx + cy + cz;',
			'}'
        ].join('\n'), null, {derivatives: true});

        let inputs = [
            this.texture.build(builder, 'sampler2D'),
            new NormalNode(NormalNode.LOCAL).build(builder, 'v3'),
            new PositionNode(PositionNode.LOCAL).build(builder, 'v3'),
            this.scale.build(builder, 'f')
        ];

        return builder.format(builder.include(mapping) + '(' + inputs.join(', ') + ')',
            this.getType(builder), output
        );
    }
}

export { TriplanarMapNode };

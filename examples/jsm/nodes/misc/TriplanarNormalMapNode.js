/**
 *  @author scrubs / https://www.mecabricks.com
 */

import { TempNode } from '../core/TempNode.js';
import { FunctionNode } from '../core/FunctionNode.js';
import { NormalNode } from '../accessors/NormalNode.js';
import { PositionNode } from '../accessors/PositionNode.js';

class TriplanarNormalMapNode extends TempNode {
    constructor(texture, scale, strength) {
        super('v3');

        this.texture = texture;
        this.scale = scale;
        this.strength = strength;
    }

    generate(builder, output) {
        let blend = [
            '   vec3 blend = vec3(0.0);',
            '   vec2 xzBlend = abs(normalize(localNormal.xz));',
            '   blend.xz = max(vec2(0.0), xzBlend - 0.67);',
            '   blend.xz /= dot(blend.xz, vec2(1.0));',

            '   blend.y = clamp((abs(localNormal.y) - 0.675) * 80.0, 0.0, 1.0);',
            '   blend.xz *= (1.0 - blend.y);'
        ];

        let uvs = [
            '   vec2 uvx = localPosition.yz * textureScale;',
            '   vec2 uvy = localPosition.zx * textureScale;',
            '   vec2 uvz = localPosition.xy * textureScale;'
        ];

        let perturbNormal2Arb = [
            '	vec3 q0 = vec3(dFdx(eyePosition.x), dFdx(eyePosition.y), dFdx(eyePosition.z));',
            '	vec3 q1 = vec3(dFdy(eyePosition.x), dFdy(eyePosition.y), dFdy(eyePosition.z));'
        ];

        let normals = [
            '   vec2 st0, st1;',
            '   float scale;',
            '   vec3 S, T, N;',
            '   mat3 tsn;'
        ];

        ['x', 'y', 'z'].forEach(axis => {
            let normal = [
                '	st0 = dFdx(uv' + axis + '.st);',
                '	st1 = dFdy(uv' + axis + '.st);',

                '	scale = sign(st1.t * st0.s - st0.t * st1.s);',

                '	S = normalize((q0 * st1.t - q1 * st0.t) * scale);',
                '	T = normalize((- q0 * st1.s + q1 * st0.s) * scale);',
                '	N = normalize(eyeNormal);',
                '	tsn = mat3(S, T, N);',

                '	vec3 map' + axis + ' = texture2D(texture, uv' + axis + ').xyz * 2.0 - 1.0;',

                '	map' + axis + '.xy *= normalScale;',
                '	map' + axis + '.xy *= (float(gl_FrontFacing) * 2.0 - 1.0);',

                '	vec3 normal' + axis + ' = normalize(tsn * (map' + axis + ' * blend.' + axis + '));'
            ];

            normals = normals.concat(normal);
        });

        perturbNormal2Arb = perturbNormal2Arb.concat(normals);

        let nodeFunction = blend.concat(uvs, perturbNormal2Arb);
        nodeFunction.unshift('vec3 normal_mapping(sampler2D texture, float textureScale, vec3 eyeNormal, vec3 localNormal, vec3 eyePosition, vec3 localPosition, vec2 normalScale) {');
        nodeFunction = nodeFunction.concat(['    return normalize(normalx + normaly + normalz);', '}']);

        let normalMapping = new FunctionNode(nodeFunction.join('\n'), null, {derivatives: true});

        let inputs = [
            this.texture.build(builder, 'sampler2D'),
            this.scale.build(builder, 'f'),
            new NormalNode(NormalNode.VIEW).build(builder, 'v3'),
            new NormalNode(NormalNode.LOCAL).build(builder, 'v3'),
            new PositionNode(PositionNode.VIEW).build(builder, 'v3'),
            new PositionNode(PositionNode.LOCAL).build(builder, 'v3'),
            this.strength.build(builder, 'v2')
        ];

        return builder.format(builder.include(normalMapping) + '(' + inputs.join(', ') + ')',
            this.getType(builder), output
        );
    }
}

export { TriplanarNormalMapNode };

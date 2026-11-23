import * as T from 'three';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
// FXAA consumes sRGB after OutputPass. Grade and apply contrast-adaptive micro-sharpening
// in the same fullscreen pass rather than allocating extra render targets.
const output='gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );';
if(!FXAAShader.fragmentShader.includes(output))throw new Error('Unsupported FXAA shader revision');
export const ultraOutputShader={
  uniforms:{...FXAAShader.uniforms,time:{value:0},strength:{value:0},clarity:{value:.16},texel:{value:new T.Vector2(1/1280,1/720)}},
  vertexShader:FXAAShader.vertexShader,
  fragmentShader:'uniform float clarity;\n'+FXAAShader.fragmentShader.replace(output,`
    vec4 aa=ApplyFXAA(tDiffuse,resolution.xy,vUv);
    vec3 c=aa.rgb;
    vec3 nN=texture2D(tDiffuse,vUv+vec2(0.,resolution.y)).rgb;
    vec3 nS=texture2D(tDiffuse,vUv-vec2(0.,resolution.y)).rgb;
    vec3 nE=texture2D(tDiffuse,vUv+vec2(resolution.x,0.)).rgb;
    vec3 nW=texture2D(tDiffuse,vUv-vec2(resolution.x,0.)).rgb;
    vec3 avg=(nN+nS+nE+nW)*.25;
    vec3 sharp=c+(c-avg)*clamp(clarity*2.4,0.,.42);
    float luminance=dot(sharp,vec3(.2126,.7152,.0722));
    vec3 contrast=clamp((sharp-.5)*1.06+.5,0.,1.);
    vec3 split=vec3(-.006,.004,.011)*(1.-luminance)+vec3(.012,.005,-.005)*luminance;
    float vig=1.-dot(vUv-.5,vUv-.5)*.14;
    c=mix(c,clamp((contrast+split)*vig,0.,1.),clamp(clarity*3.,0.,1.));
    gl_FragColor=vec4(c,aa.a);`),
};

import * as T from 'three';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
// FXAA consumes sRGB after OutputPass. Grade the antialiased result in the same
// fullscreen pass rather than copying another 33 million pixels for 8K film.
const output='gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );';
if(!FXAAShader.fragmentShader.includes(output))throw new Error('Unsupported FXAA shader revision');
export const ultraOutputShader={
  uniforms:{...FXAAShader.uniforms,time:{value:0},strength:{value:0},clarity:{value:.16},texel:{value:new T.Vector2(1/1280,1/720)}},
  vertexShader:FXAAShader.vertexShader,
  fragmentShader:'uniform float clarity;\n'+FXAAShader.fragmentShader.replace(output,`
    vec4 aa=ApplyFXAA(tDiffuse,resolution.xy,vUv);
    vec3 c=aa.rgb;
    float luminance=dot(c,vec3(.2126,.7152,.0722));
    vec3 contrast=clamp((c-.5)*1.045+.5,0.,1.);
    vec3 split=vec3(-.005,.004,.009)*(1.-luminance)+vec3(.01,.004,-.004)*luminance;
    c=mix(c,clamp(contrast+split,0.,1.),clamp(clarity*3.,0.,1.));
    gl_FragColor=vec4(c,aa.a);`),
};

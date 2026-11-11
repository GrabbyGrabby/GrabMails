<template>
  <div class="gradient-forms-viewport" aria-hidden="true">
    <canvas ref="canvasRef" class="gradient-forms-canvas" />
    <div class="grain-overlay" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const canvasRef = ref(null);

const FORMS = [
  { name: "Dusk Signal", edge: "#FFD6E6", warm: "#FF4F7A", cool: "#3A1BD0" },
  { name: "Ember Plume", edge: "#FFE9B8", warm: "#FF8A1F", cool: "#B8102C" },
  { name: "Tidewater", edge: "#D6FFF3", warm: "#26DDBC", cool: "#0A36B5" },
  { name: "Acid Fold", edge: "#F2FFC2", warm: "#B9EE18", cool: "#0B7A50" },
  { name: "Cobalt Crest", edge: "#E3E8FF", warm: "#6C88FF", cool: "#170E5C" },
];

const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

const COLORS = FORMS.map(f => ({
  edge: rgb(f.edge),
  warm: rgb(f.warm),
  cool: rgb(f.cool),
}));

const VERTEX = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAGMENT = `precision highp float;
uniform vec2 res;
uniform vec2 off;
uniform float t;
uniform float f0;
uniform float f1;
uniform float mx;
uniform float fade;
uniform vec3 e0; uniform vec3 a0; uniform vec3 b0;
uniform vec3 e1; uniform vec3 a1; uniform vec3 b1;

float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);
}
float F(float i,vec2 q){
  if(i<.5) return q.x-(.04+.32*sin(q.y*1.8+.5));
  if(i<1.5) return (-.6+1.1*exp(-(q.x+.12)*(q.x+.12)*2.2)) - q.y*.9;
  if(i<2.5) return q.y-(.04+.28*sin(q.x*2.3+1.1));
  if(i<3.5) return -(q.x+q.y)*.72+.12+.24*sin((q.x-q.y)*2.1);
  return -q.x-.12+.5*exp(-(q.y-.08)*(q.y-.08)*2.6);
}
void main(){
  vec2 fc=gl_FragCoord.xy-off;
  vec2 uv=fc/res;
  vec2 p=uv*2.-1.;
  vec2 w=vec2(vn(p*.9+vec2(0.,t*.12)),vn(p*.9+vec2(5.2,1.3)-t*.1))-.5;
  vec2 q=p+w*.28;
  float f=mix(F(f0,q),F(f1,q),mx);
  vec3 e=mix(e0,e1,mx),a=mix(a0,a1,mx),b=mix(b0,b1,mx);
  float g=clamp(.5+.8*(q.y*.75-q.x*.35)+(vn(q*1.1+t*.05)-.5)*.4,0.,1.);
  vec3 body=mix(b,a,smoothstep(0.,1.,g));
  vec3 inside=mix(mix(body,e,.82),body,smoothstep(-.04,.7,f));
  float al=smoothstep(-.26,.16,f);
  vec3 dark=vec3(.016,.018,.026)+b*.035;
  vec3 col=mix(dark,inside,al);
  float gn=h(fc+fract(t*7.13)*vec2(91.,37.))-.5;
  float lum=dot(col,vec3(.3,.59,.11));
  col+=gn*(.075+.22*lum*(1.-lum));
  col*=fade;
  gl_FragColor=vec4(col,1.);
}`;

let animId = 0;
let gl = null;
let program = null;
let buffer = null;
let uniforms = {};

const HOLD = 1700;
const MORPH = 1000;
const INTRO = 900;
const CYCLE = HOLD + MORPH;

const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function initGL() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const names = ['res', 'off', 't', 'f0', 'f1', 'mx', 'fade', 'e0', 'a0', 'b0', 'e1', 'a1', 'b1'];
  uniforms = Object.fromEntries(names.map(n => [n, gl.getUniformLocation(program, n)]));

  resize();
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas || !gl) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  // Use lower DPR on huge displays for lightning fast 60fps
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
}

let start = -1;
function loop(now) {
  if (start < 0) start = now;
  const el = now - start;

  const k = Math.floor(el / CYCLE);
  const r = el - k * CYCLE;
  const i0 = k % FORMS.length;
  const i1 = (k + 1) % FORMS.length;
  const mx = r < HOLD ? 0 : io((r - HOLD) / MORPH);
  const fade = io(Math.min(1, el / INTRO));
  const t = el / 1000;

  if (gl && program && uniforms.res) {
    const canvas = canvasRef.value;
    gl.uniform2f(uniforms.res, canvas.width, canvas.height);
    gl.uniform2f(uniforms.off, 0, 0);
    gl.uniform1f(uniforms.t, t);
    gl.uniform1f(uniforms.f0, i0);
    gl.uniform1f(uniforms.f1, i1);
    gl.uniform1f(uniforms.mx, mx);
    gl.uniform1f(uniforms.fade, fade);

    const from = COLORS[i0];
    const to = COLORS[i1];
    gl.uniform3fv(uniforms.e0, from.edge);
    gl.uniform3fv(uniforms.a0, from.warm);
    gl.uniform3fv(uniforms.b0, from.cool);
    gl.uniform3fv(uniforms.e1, to.edge);
    gl.uniform3fv(uniforms.a1, to.warm);
    gl.uniform3fv(uniforms.b1, to.cool);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  animId = requestAnimationFrame(loop);
}

onMounted(() => {
  initGL();
  window.addEventListener('resize', resize);
  animId = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  if (animId) cancelAnimationFrame(animId);
  if (gl) {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  }
});
</script>

<style scoped>
.gradient-forms-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  background: #050608;
}

.gradient-forms-canvas {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0.88;
}

.grain-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
}
</style>

import { HEAD, type HairGeometry, type V3 } from './model';

/**
 * WebGL2 renderer for the 3D hair: a midnight-blue studio backdrop with a soft light behind the head, a dark bust
 * caught by a cool rim light, and the strands lit with two Kajiya-Kay highlights (a sharp white one and a softer one in
 * the hair's own colour), darker roots and inner layers, a blue rim, and a slow sway when animated.
 */

const BG_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const BG_FS = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform vec3 u_top;
uniform vec3 u_bottom;
uniform vec3 u_glow;
uniform vec3 u_warm;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec3 c = mix(u_bottom, u_top, smoothstep(0.0, 1.0, uv.y));
  vec2 d = (uv - vec2(0.46, 0.7)) * vec2(u_res.x / u_res.y, 1.0);
  c += u_glow * exp(-dot(d, d) * 2.6) * 0.18;
  vec2 w = (uv - vec2(0.95, 0.35)) * vec2(u_res.x / u_res.y, 1.0);
  c += u_warm * exp(-dot(w, w) * 4.0) * 0.22;
  vec2 q = uv - 0.5;
  c *= 1.0 - dot(q, q) * 0.35;
  o = vec4(c, 1.0);
}`;

const BODY_VS = `#version 300 es
precision highp float;
in vec3 a_pos;
in vec3 a_nrm;
uniform mat4 u_vp;
uniform vec3 u_eye;
uniform vec3 u_key;
uniform vec3 u_keyCol;
uniform vec3 u_rimCol;
uniform vec3 u_skin;
out vec3 v_col;
void main() {
  vec3 V = normalize(u_eye - a_pos);
  float ndl = max(0.0, dot(a_nrm, u_key));
  float rim = pow(1.0 - max(0.0, dot(a_nrm, V)), 3.0);
  v_col = u_skin * (0.32 + ndl * 0.62) * u_keyCol + u_rimCol * rim * 0.25;
  gl_Position = u_vp * vec4(a_pos, 1.0);
}`;
const BODY_FS = `#version 300 es
precision highp float;
in vec3 v_col;
out vec4 o;
void main() { o = vec4(v_col, 1.0); }`;

const HAIR_VS = `#version 300 es
precision highp float;
in vec3 a_pos;
in vec3 a_tan;
in vec4 a_attr;
uniform mat4 u_vp;
uniform vec3 u_eye;
uniform float u_time;
uniform float u_wind;
uniform vec3 u_root;
uniform vec3 u_mid;
uniform vec3 u_ends;
uniform vec3 u_key;
uniform vec3 u_keyCol;
uniform vec3 u_rim;
uniform vec3 u_rimCol;
uniform float u_streak;
out vec4 v_col;
float kk(vec3 T, vec3 V, vec3 L, float e) {
  vec3 H = normalize(L + V);
  float th = dot(T, H);
  return pow(sqrt(max(0.0, 1.0 - th * th)), e) * smoothstep(-1.0, 0.0, th);
}
void main() {
  float t = a_attr.x;
  float tone = a_attr.y;
  float layer = a_attr.z;
  float streak = a_attr.w;
  vec3 p = a_pos;
  float sway = u_wind * t * t;
  p += vec3(sin(u_time * 1.15 + p.y * 8.0 + tone) * 0.012, 0.0, cos(u_time * 0.85 + p.y * 6.0) * 0.007) * sway;
  vec3 T = normalize(a_tan);
  vec3 N = normalize(p * vec3(1.0, 0.65, 1.0) + vec3(0.0, 0.02, 0.0));
  vec3 V = normalize(u_eye - p);
  vec3 c = t < 0.4 ? mix(u_root, u_mid, smoothstep(0.0, 0.4, t)) : mix(u_mid, u_ends, smoothstep(0.4, 1.0, t));
  c = mix(c, min(vec3(1.0), u_ends * 1.18 + 0.05), streak * smoothstep(0.06, 0.32, t) * u_streak);
  c *= 1.0 + tone * 0.24;
  float diff = 0.3 + 0.7 * sqrt(max(0.0, 1.0 - pow(dot(T, u_key), 2.0)));
  float s1 = kk(normalize(T + N * (-0.08 + tone * 0.05)), V, u_key, 70.0);
  float s2 = kk(normalize(T + N * 0.16), V, u_key, 18.0);
  float rim = pow(1.0 - abs(dot(V, N)), 2.2);
  float rimSpec = kk(T, V, u_rim, 10.0);
  float ao = mix(0.16, 1.0, layer * layer) * mix(0.38, 1.0, smoothstep(0.0, 0.3, t));
  vec3 col = c * (0.06 + diff * 0.7) * u_keyCol * ao;
  col += mix(u_keyCol, c * 1.7 + 0.1, 0.3) * s1 * 0.75 * ao;
  col += c * s2 * 0.9 * ao;
  col += u_rimCol * (rim * 0.1 + rimSpec * 0.16) * (0.35 + layer * 0.65);
  col = col / (1.0 + col * 0.18);
  float a = (0.38 + layer * 0.52) * (1.0 - smoothstep(0.8, 1.0, t) * 0.8);
  v_col = vec4(col * a, a);
  gl_Position = u_vp * vec4(p, 1.0);
}`;
const HAIR_FS = `#version 300 es
precision mediump float;
in vec4 v_col;
out vec4 o;
void main() { o = v_col; }`;

// ------------------------------------------------------------------------------------------------- small maths

function perspective(fovDeg: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(eye: V3, target: V3, up: V3 = [0, 1, 0]): Float32Array {
  const z = norm([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}

function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return out;
}

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const rgb = (hex: string): V3 => {
  const p = parseInt(hex.slice(1), 16);
  // Into linear-ish light for the lighting maths, then the tonemap brings it back.
  const f = (v: number) => Math.pow(v / 255, 1.6);
  return [f((p >> 16) & 255), f((p >> 8) & 255), f(p & 255)];
};

/** An ellipsoid as triangles with normals. */
function ellipsoid(c: V3, r: V3, lat = 22, lon = 32) {
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= lat; i++) {
    const th = (i / lat) * Math.PI;
    for (let j = 0; j <= lon; j++) {
      const ph = (j / lon) * Math.PI * 2;
      const u: V3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      pos.push(c[0] + u[0] * r[0], c[1] + u[1] * r[1], c[2] + u[2] * r[2]);
      const n = norm([u[0] / r[0], u[1] / r[1], u[2] / r[2]]);
      nrm.push(n[0], n[1], n[2]);
    }
  }
  for (let i = 0; i < lat; i++)
    for (let j = 0; j < lon; j++) {
      const a = i * (lon + 1) + j;
      const b = a + lon + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return { pos, nrm, idx };
}

export type Look3D = { root: string; mid: string; ends: string; streaks: number; glow: string };
export type View3D = { eye: V3; target: V3; fov: number };

export class HairRenderer {
  readonly gl: WebGL2RenderingContext;
  private bg: WebGLProgram;
  private body: WebGLProgram;
  private hair: WebGLProgram;
  private bodyVao: WebGLVertexArrayObject;
  private bodyCount = 0;
  private hairVao: WebGLVertexArrayObject | null = null;
  private hairBuffers: WebGLBuffer[] = [];
  private hairCount = 0;
  private look: Look3D = { root: '#2A140A', mid: '#B4531F', ends: '#F4B562', streaks: 0, glow: '#3B5BFF' };
  private loc = new Map<string, WebGLUniformLocation | null>();

  constructor(readonly canvas: HTMLCanvasElement, options: { preserve?: boolean } = {}) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, premultipliedAlpha: true, preserveDrawingBuffer: !!options.preserve });
    if (!gl) throw new Error('WebGL2 is not available');
    this.gl = gl;
    this.bg = this.program(BG_VS, BG_FS);
    this.body = this.program(BODY_VS, BODY_FS);
    this.hair = this.program(HAIR_VS, HAIR_FS);
    // The bust: head (just inside the hair), neck and shoulders.
    const parts = [
      ellipsoid([0, 0, 0], [HEAD.r[0] * 0.98, HEAD.r[1] * 0.98, HEAD.r[2] * 0.98]),
      ellipsoid([0, -0.15, -0.012], [0.05, 0.09, 0.048]),
      ellipsoid([0, -0.33, 0.0], [0.198, 0.128, 0.113]),
    ];
    const pos: number[] = [];
    const nrm: number[] = [];
    const idx: number[] = [];
    for (const part of parts) {
      const base = pos.length / 3;
      pos.push(...part.pos);
      nrm.push(...part.nrm);
      idx.push(...part.idx.map((i) => i + base));
    }
    this.bodyVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.bodyVao);
    this.attribute(this.body, 'a_pos', new Float32Array(pos), 3);
    this.attribute(this.body, 'a_nrm', new Float32Array(nrm), 3);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
    this.bodyCount = idx.length;
    gl.bindVertexArray(null);
  }

  private program(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    return p;
  }

  private attribute(program: WebGLProgram, name: string, data: Float32Array, size: number): WebGLBuffer {
    const gl = this.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const at = gl.getAttribLocation(program, name);
    if (at >= 0) {
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
    }
    return buffer;
  }

  private u(program: WebGLProgram, name: string) {
    const key = `${this.hair === program ? 'h' : this.body === program ? 'b' : 'g'}:${name}`;
    if (!this.loc.has(key)) this.loc.set(key, this.gl.getUniformLocation(program, name));
    return this.loc.get(key)!;
  }

  setHair(geometry: HairGeometry, look: Look3D) {
    const gl = this.gl;
    this.hairBuffers.forEach((b) => gl.deleteBuffer(b));
    if (this.hairVao) gl.deleteVertexArray(this.hairVao);
    this.hairVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.hairVao);
    this.hairBuffers = [
      this.attribute(this.hair, 'a_pos', geometry.positions, 3),
      this.attribute(this.hair, 'a_tan', geometry.tangents, 3),
      this.attribute(this.hair, 'a_attr', geometry.attrs, 4),
    ];
    const ibo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.index, gl.STATIC_DRAW);
    this.hairBuffers.push(ibo);
    this.hairCount = geometry.index.length;
    gl.bindVertexArray(null);
    this.look = look;
  }

  render(view: View3D, opts: { width: number; height: number; time?: number; wind?: number; light?: number }) {
    const gl = this.gl;
    const { width, height } = opts;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    const aspect = width / height;
    // Narrow pictures pull the camera back a little so the whole head still fits.
    const pull = aspect < 0.62 ? 1 + (0.62 - aspect) * 0.9 : 1;
    const eye: V3 = [view.target[0] + (view.eye[0] - view.target[0]) * pull, view.target[1] + (view.eye[1] - view.target[1]) * pull, view.target[2] + (view.eye[2] - view.target[2]) * pull];
    const vp = multiply(perspective(view.fov, aspect, 0.05, 10), lookAt(eye, view.target));
    const angle = (opts.light ?? 0) * 0.5;
    // The key light comes from just above the camera, so every wave catches a band of shine; the rim light sits
    // behind the subject and draws a cool edge.
    const key = norm([-0.28 + Math.sin(angle) * 0.35, 0.3, -1]);
    const rim = norm([0.62, 0.42, 0.8]);
    const keyCol: V3 = [1.06, 1.0, 0.94];
    const rimCol: V3 = rgb('#B9C6FF');

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(this.bg);
    gl.uniform2f(this.u(this.bg, 'u_res'), width, height);
    // A soft daylight studio: white at the top, a cool blue-grey below, a bright patch behind the head.
    gl.uniform3fv(this.u(this.bg, 'u_top'), rgb('#F7F8FF'));
    gl.uniform3fv(this.u(this.bg, 'u_bottom'), rgb('#C9D3EE'));
    gl.uniform3fv(this.u(this.bg, 'u_glow'), rgb('#9FB2FF'));
    gl.uniform3fv(this.u(this.bg, 'u_warm'), rgb(this.look.glow));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.body);
    gl.uniformMatrix4fv(this.u(this.body, 'u_vp'), false, vp);
    gl.uniform3fv(this.u(this.body, 'u_eye'), eye);
    gl.uniform3fv(this.u(this.body, 'u_key'), key);
    gl.uniform3fv(this.u(this.body, 'u_keyCol'), keyCol);
    gl.uniform3fv(this.u(this.body, 'u_rimCol'), rimCol);
    gl.uniform3fv(this.u(this.body, 'u_skin'), rgb('#B98466'));
    gl.bindVertexArray(this.bodyVao);
    gl.drawElements(gl.TRIANGLES, this.bodyCount, gl.UNSIGNED_INT, 0);

    if (this.hairVao) {
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.hair);
      gl.uniformMatrix4fv(this.u(this.hair, 'u_vp'), false, vp);
      gl.uniform3fv(this.u(this.hair, 'u_eye'), eye);
      gl.uniform1f(this.u(this.hair, 'u_time'), opts.time ?? 0);
      gl.uniform1f(this.u(this.hair, 'u_wind'), opts.wind ?? 0);
      gl.uniform3fv(this.u(this.hair, 'u_root'), rgb(this.look.root));
      gl.uniform3fv(this.u(this.hair, 'u_mid'), rgb(this.look.mid));
      gl.uniform3fv(this.u(this.hair, 'u_ends'), rgb(this.look.ends));
      gl.uniform3fv(this.u(this.hair, 'u_key'), key);
      gl.uniform3fv(this.u(this.hair, 'u_keyCol'), keyCol);
      gl.uniform3fv(this.u(this.hair, 'u_rim'), rim);
      gl.uniform3fv(this.u(this.hair, 'u_rimCol'), rimCol);
      gl.uniform1f(this.u(this.hair, 'u_streak'), this.look.streaks > 0 ? 1 : 0);
      gl.bindVertexArray(this.hairVao);
      gl.drawElements(gl.LINES, this.hairCount, gl.UNSIGNED_INT, 0);
      gl.depthMask(true);
    }
    gl.bindVertexArray(null);
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

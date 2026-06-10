/* ============================================================================
   Three.js hero backdrop — floating triangular glass shards.

   A big field of bevel-edged triangular glass prisms in wildly varied sizes,
   from tiny crumbs to large panes. Quality (per the threejs-materials skill):
     • PMREM environment map  → real reflections + refraction in the glass
       (MeshPhysicalMaterial transmission has nothing to bend/reflect without
       an environment; this is the single biggest realism win).
     • ACES Filmic tone mapping + correct exposure → clean, non-blown highlights.
     • Polished MeshPhysicalMaterial: transmission, clearcoat, faint iridescence,
       cool-glass edge tint.
     • Irregular triangles (chunky + sliver) with crisp bevelled edges.

   Loads only when motion is allowed and WebGL works; otherwise the CSS gradient
   fallback stays. Resolves "three" via the import map in index.html.
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('webgl-hero');
  if (!canvas || reduce) return; // CSS gradient fallback stays

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  if (!webglOK()) return;

  import('three').then(function (THREE) {
    var renderer, scene, camera, group, raf, running = true, visible = true, t = 0, autoY = 0, intro = 0;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var isMobile = window.innerWidth < 760;

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return; }
    renderer.setClearColor(0x000000, 0); // transparent — the moving CSS gradient shows through
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
    renderer.setSize(window.innerWidth + 50, window.innerHeight + 50);
    // Filmic tone mapping keeps glass speculars bright but un-clipped.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene(); // no background / no fog: clear glass over the live gradient

    camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 17);

    /* ---------- Procedural environment (drives reflections + refraction) ----------
       A soft equirectangular gradient with a couple of bright "window" blobs.
       Glass needs something to reflect; this is what makes the shards sparkle and
       refract instead of looking like flat tinted plastic. */
    function buildEnvironment() {
      var c = document.createElement('canvas');
      c.width = 512; c.height = 256;
      var x = c.getContext('2d');

      // Vertical sky→deep gradient in the page's blue family.
      var g = x.createLinearGradient(0, 0, 0, c.height);
      g.addColorStop(0.00, '#f4f9ff');
      g.addColorStop(0.35, '#cfe4ff');
      g.addColorStop(0.70, '#5b86c9');
      g.addColorStop(1.00, '#16264a');
      x.fillStyle = g;
      x.fillRect(0, 0, c.width, c.height);

      // Soft light sources the glass edges can catch.
      function blob(cx, cy, r, color, alpha) {
        var rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, color);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = alpha; x.fillStyle = rg;
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
        x.globalAlpha = 1;
      }
      blob(130, 60, 120, '#ffffff', 0.9);   // key window
      blob(400, 50, 90, '#eaf3ff', 0.7);    // secondary
      blob(300, 150, 140, '#bf9bff', 0.22); // faint violet bounce
      blob(60, 200, 110, '#7fd1ff', 0.20);  // cool fill

      var tex = new THREE.Texture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;

      var pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      var envRT = pmrem.fromEquirectangular(tex);
      scene.environment = envRT.texture;
      tex.dispose();
      pmrem.dispose();
    }
    buildEnvironment();

    /* ---------- Lighting: env handles ambient/reflections; these add punch ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    var keyLight = new THREE.DirectionalLight(0xffffff, 2.0); // sharp white edge speculars
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    var coolLight = new THREE.PointLight(0xdbeafe, 1.6, 100); // cool blue fill
    coolLight.position.set(-14, 8, 9);
    scene.add(coolLight);

    var warmLight = new THREE.PointLight(0xf5d0fe, 1.3, 100); // soft violet accent
    warmLight.position.set(12, -10, 8);
    scene.add(warmLight);

    var deepLight = new THREE.PointLight(0x60a5fa, 1.0, 80);  // sapphire from below
    deepLight.position.set(-5, -12, -5);
    scene.add(deepLight);

    group = new THREE.Group();
    scene.add(group);

    var COUNT = isMobile ? 32 : 90;
    var shards = [];

    /* ---------- Triangular glass-shard geometry ----------------------------------
       An irregular triangle (chunky pieces + thin slivers, like real broken
       glass), extruded thin with a small bevel so the edges catch the light as
       crisp glass facets. Flat + bevelled = the cleanest, sharpest shard edges. */
    function makeShardGeometry() {
      // Three corners around the centre, with random angular gaps + radii so
      // each triangle is a different scalene shape; ~40% come out as slivers.
      var a0 = Math.random() * Math.PI * 2;
      var sliver = Math.random() < 0.4;
      var gaps;
      if (sliver) {
        var thin = 0.16 + Math.random() * 0.5;
        var rest = (Math.PI * 2 - thin);
        var split = 0.32 + Math.random() * 0.36;
        gaps = [thin, rest * split, rest * (1 - split)];
      } else {
        var g1 = 1.3 + Math.random() * 1.3, g2 = 1.3 + Math.random() * 1.3, g3 = 1.3 + Math.random() * 1.3;
        var s = (Math.PI * 2) / (g1 + g2 + g3);
        gaps = [g1 * s, g2 * s, g3 * s];
      }
      var aspectX = 0.6 + Math.random() * 0.9;
      var aspectY = 0.6 + Math.random() * 0.9;
      var ang = a0;
      var shape = new THREE.Shape();
      for (var k = 0; k < 3; k++) {
        var r = 0.5 + Math.random() * 0.8;
        var x = Math.cos(ang) * r * aspectX, y = Math.sin(ang) * r * aspectY;
        if (k === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
        ang += gaps[k];
      }
      shape.closePath();

      // Thin extrusion + sharp little bevel → glassy edge highlight.
      var depth = 0.05 + Math.random() * 0.12;
      var bevel = 0.012 + Math.random() * 0.022;
      var geo = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel * 0.9,
        bevelSegments: 1,
        curveSegments: 1
      });
      geo.center();
      return geo;
    }

    // Cool-glass tint family for subtle, varied edge colouring.
    var TINTS = [0xbfe9ff, 0xa9dcff, 0xd7e9ff, 0xc9e8ec, 0xe3d8ff];

    for (var i = 0; i < COUNT; i++) {
      var geo = makeShardGeometry();
      var tint = TINTS[(Math.random() * TINTS.length) | 0];

      var mat;
      if (isMobile) {
        mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.0,
          roughness: 0.05 + Math.random() * 0.06,
          transparent: true,
          opacity: 0.5 + Math.random() * 0.18,
          transmission: 0.55 + Math.random() * 0.2,
          thickness: 0.3,
          ior: 1.5,
          reflectivity: 0.6,
          clearcoat: 0.7,
          clearcoatRoughness: 0.06,
          envMapIntensity: 1.2,
          attenuationColor: new THREE.Color(tint),
          attenuationDistance: 1.2,
          side: THREE.DoubleSide,
          depthWrite: false
        });
      } else {
        mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.0,
          roughness: 0.02 + Math.random() * 0.05,          // highly polished
          transparent: true,
          opacity: 0.52 + Math.random() * 0.2,             // visible glassy body over the CSS gradient
          transmission: 0.7 + Math.random() * 0.25,        // real light bending
          thickness: 0.35 + Math.random() * 0.5,           // refraction volume
          ior: 1.5,                                        // crown-glass IOR
          reflectivity: 0.9,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02 + Math.random() * 0.04,
          envMapIntensity: 1.35,
          specularIntensity: 1.0,
          attenuationColor: new THREE.Color(tint),         // subtle cool-glass edge tint
          attenuationDistance: 0.6 + Math.random() * 0.8,
          iridescence: 0.06 + Math.random() * 0.14,        // faint tempered-glass sheen
          iridescenceIOR: 1.3,
          iridescenceThicknessRange: [120, 380],
          side: THREE.DoubleSide,
          depthWrite: false
        });
      }

      var mesh = new THREE.Mesh(geo, mat);

      // Very wide size range: heaps of tiny crumbs, plenty of mid pieces,
      // and a few big panes — strong scale contrast across the field.
      var sizeRoll = Math.random();
      var sc;
      if (sizeRoll < 0.50) sc = 0.10 + Math.random() * 0.28;      // tiny crumbs / slivers
      else if (sizeRoll < 0.84) sc = 0.45 + Math.random() * 0.85; // medium fragments
      else sc = 1.7 + Math.random() * 2.0;                        // large panes
      mesh.scale.setScalar(sc);

      mesh.position.set(
        (Math.random() - 0.5) * 32,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 14 - 3
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      mesh.userData = {
        rx: (Math.random() - 0.5) * 0.004,
        ry: (Math.random() - 0.5) * 0.005,
        rz: (Math.random() - 0.5) * 0.003,
        fx: 0.0004 + Math.random() * 0.0007,
        fy: 0.0003 + Math.random() * 0.0007,
        px: Math.random() * Math.PI * 2,
        py: Math.random() * Math.PI * 2,
        ax: 0.2 + Math.random() * 0.6,
        ay: 0.2 + Math.random() * 0.6,
        ps: Math.random() * Math.PI * 2,
        base: sc,
        ox: mesh.position.x,
        oy: mesh.position.y,
        oz: mesh.position.z,
        sx: (Math.random() - 0.5) * 36,
        sy: (Math.random() - 0.5) * 26,
        sz: (Math.random() - 0.5) * 20
      };

      group.add(mesh);
      shards.push(mesh);
    }

    window.addEventListener('resize', function () {
      isMobile = window.innerWidth < 760;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth + 50, window.innerHeight + 50);
    }, { passive: true });

    window.addEventListener('pointermove', function (e) {
      pointer.tx = (e.clientX / window.innerWidth - 0.5);
      pointer.ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    // Pause the loop when the hero is off-screen.
    var hero = document.querySelector('.hero');
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && running) loop();
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) loop();
    });

    function frame() {
      t += 1;
      if (intro < 1) intro = Math.min(1, intro + 1 / 90); // ~1.5s assemble
      var e = 1 - Math.pow(1 - intro, 3); // easeOutCubic
      autoY += 0.0007;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      group.rotation.y = autoY + pointer.x * 0.42;
      group.rotation.x = Math.sin(t * 0.0007) * 0.08 + pointer.y * 0.26;
      group.rotation.z = (1 - e) * 0.4;

      for (var i = 0; i < shards.length; i++) {
        var b = shards[i], u = b.userData;
        b.rotation.x += u.rx;
        b.rotation.y += u.ry;
        b.rotation.z += u.rz;
        b.position.x = u.ox + Math.sin(t * u.fx + u.px) * u.ax + u.sx * (1 - e);
        b.position.y = u.oy + Math.cos(t * u.fy + u.py) * u.ay + u.sy * (1 - e);
        b.position.z = u.oz + u.sz * (1 - e);
        b.scale.setScalar(u.base * (0.35 + 0.65 * e) * (1 + Math.sin(t * 0.01 + u.ps) * 0.045));
      }
      renderer.render(scene, camera);
    }

    function loop() {
      cancelAnimationFrame(raf);
      if (!running || !visible) return;
      frame();
      raf = requestAnimationFrame(loop);
    }

    document.body.classList.add('webgl-on');
    canvas.classList.add('ready');
    loop();
  }).catch(function () { /* CDN unreachable -> CSS gradient fallback remains */ });
})();

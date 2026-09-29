/**
 * Plays a footage frame stream (written by footage_to_webp.py) onto a canvas.
 *
 * A stream stores whole key frames now and then and, for the frames in between, only the
 * tiles that changed, as rectangles to copy out of shared patch sheets. Showing frame n
 * draws the latest key frame at or before it and pastes the patches after it; moving
 * forward from the frame already drawn pastes only the new patches.
 *
 * A stream with a camera track (see PageCamera) is rebuilt off screen at its full size, and
 * the canvas shows the view cut out of it.
 *
 * The images load in the order the frames first need them, a few at a time, and the frames
 * become playable as theirs arrive (playable), so the page can start once the first part is
 * in and load the rest while it plays, rather than wait for the whole stream.
 */
class FrameStream {
  /** Images requested at once while loading. */
  static PARALLEL = 4;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} stream  parsed stream.json
   * @param {string} base    folder holding the stream's images, ending in "/"
   * @param {object} [camera] the chapter's camera phases, for a stream with a camera track
   */
  constructor(canvas, stream, base, camera) {
    this.canvas = canvas;
    this.stream = stream;
    this.base = base;

    this.camera = stream.camera ? new PageCamera(stream, camera || {}) : null;
    this.frame = this.camera ? document.createElement('canvas') : canvas;
    this.frame.width = stream.width;
    this.frame.height = stream.height;
    this.ctx = this.frame.getContext('2d', { alpha: false });

    if (this.camera) {
      const [viewWidth, viewHeight] = stream.camera.view;
      canvas.width = PageCamera.OUTPUT_WIDTH;
      canvas.height = Math.round(PageCamera.OUTPUT_WIDTH * viewHeight / viewWidth);
      this.out = canvas.getContext('2d', { alpha: false });
      this.out.imageSmoothingQuality = 'high';
    }

    this.images = new Array(stream.images.length);
    this.keyOf = new Int32Array(stream.frames.length);
    let key = 0;
    stream.frames.forEach((frame, i) => {
      if (frame.k !== undefined) key = i;
      this.keyOf[i] = key;
    });

    // The last image any frame up to this one needs. The encoder numbers images in the order
    // the frames first use them, so loading them in that order makes the frames playable in
    // order too.
    this.needs = new Int32Array(stream.frames.length);
    let need = 0;
    stream.frames.forEach((frame, i) => {
      if (frame.k !== undefined) need = Math.max(need, frame.k);
      else for (let j = 0; j < frame.p.length; j += 7) need = Math.max(need, frame.p[j]);
      this.needs[i] = need;
    });

    /** How many frames, from the first, can be drawn with the images loaded so far. */
    this.playable = 0;
    this.shown = -1;
  }

  get frameCount() {
    return this.stream.frames.length;
  }

  /**
   * Loads every image of the stream, in order, PARALLEL at a time. Calls
   * onProgress(bytes loaded, frames playable) as each arrives; resolves once all are in.
   */
  async load(onProgress) {
    const names = this.stream.images;
    const sizes = this.stream.sizes || [];
    const arrived = new Uint8Array(names.length);
    let next = 0, loaded = 0, inOrder = 0;

    const worker = async () => {
      while (next < names.length) {
        const i = next++;
        const image = new Image();
        image.decoding = 'async';
        image.src = this.base + names[i] + (this.stream.version ? `?v=${this.stream.version}` : '');
        try {
          await image.decode();
        } catch (error) {
          // decode() can give up on an image that loaded fine (a browser short of memory for
          // decoding ahead, with other chapters open); drawing it still decodes it then.
          if (!image.complete || !image.naturalWidth) throw error;
        }
        this.images[i] = image;
        arrived[i] = 1;
        loaded += sizes[i] || 0;

        while (inOrder < names.length && arrived[inOrder]) inOrder++;
        while (this.playable < this.frameCount && this.needs[this.playable] < inOrder) this.playable++;
        if (onProgress) onProgress(loaded, this.playable);
      }
    };
    await Promise.all(Array.from({ length: FrameStream.PARALLEL }, worker));
  }

  /** Draws frame n (from 0), or the last playable frame before it while n is still loading. */
  show(n) {
    if (this.playable === 0) return;
    n = Math.max(0, Math.min(this.playable - 1, n));
    if (n === this.shown) return;

    const key = this.keyOf[n];
    let from;
    if (this.shown >= key && this.shown < n) {
      from = this.shown + 1;
    } else {
      this.ctx.drawImage(this.images[this.stream.frames[key].k], 0, 0);
      from = key + 1;
    }

    for (let i = from; i <= n; i++) this.patch(this.stream.frames[i].p);
    this.shown = n;

    if (this.camera) {
      const [x, y, w, h] = this.camera.cut(n);
      this.out.drawImage(this.frame, x, y, w, h, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  patch(ops) {
    const ctx = this.ctx;
    for (let j = 0; j < ops.length; j += 7) {
      const w = ops[j + 5];
      const h = ops[j + 6];
      ctx.drawImage(this.images[ops[j]], ops[j + 1], ops[j + 2], w, h, ops[j + 3], ops[j + 4], w, h);
    }
  }
}

/**
 * The game's camera, played on the page over a still recording. The recording holds
 * everything that camera would show along the chapter, and its stream says, in its pixels,
 * how big the game's view is, where it is centred in every frame (on the player), and the
 * shot of the room to open on. Over the chapter's overview phases the page shows that shot;
 * over its zoom phases it glides in to the player; after that it is the game's view,
 * following the player as the camera on the player does in the game. Over its wide phases
 * (a chapter whose game camera rises over the whole map) it shows the whole recording.
 */
class PageCamera {
  static OUTPUT_WIDTH = 1600;

  /**
   * Share of the way to the player the camera closes each frame: the game's CameraParallax
   * lerps by smoothSpeed × deltaTime, 5 at 30 frames a second. (It also leans toward the
   * mouse, by at most half a unit outside aiming, which is left out.)
   */
  static FOLLOW = 5 / 30;

  /**
   * @param {object} stream
   * @param {{overview?: string[], zoom?: string[], wide?: string[]}} phases which phases open on
   *   the room, which glide in to the player, and over which the whole frame is shown
   */
  constructor(stream, phases) {
    const camera = stream.camera;
    this.width = stream.width;
    this.height = stream.height;
    this.view = camera.view;
    this.overview = camera.overview;

    // Following the player with the game camera's lag, worked out once for the whole
    // chapter, so the view at a frame does not depend on the way the reader scrolled.
    const track = camera.track;
    this.centres = [];
    let [x, y] = track[0];
    for (const [px, py] of track) {
      x += (px - x) * PageCamera.FOLLOW;
      y += (py - y) * PageCamera.FOLLOW;
      this.centres.push([x, y]);
    }

    // How far in the camera is at each frame: 0 on the room, 1 on the player.
    this.closeness = new Float32Array(stream.frames.length).fill(1);
    const overview = stream.phases.filter(p => (phases.overview || []).includes(p.name));
    const zoom = stream.phases.filter(p => (phases.zoom || []).includes(p.name));
    if (overview.length || zoom.length) {
      const openUntil = overview.length ? Math.max(...overview.map(p => p.last)) : 0;
      const zoomFrom = zoom.length ? Math.min(...zoom.map(p => p.first)) : openUntil + 1;
      const zoomTo = zoom.length ? Math.max(...zoom.map(p => p.last)) : openUntil;
      for (let i = 0; i < this.closeness.length; i++) {
        const frame = i + 1;
        if (frame < zoomFrom) this.closeness[i] = 0;
        else if (frame <= zoomTo) this.closeness[i] = (frame - zoomFrom + 1) / (zoomTo - zoomFrom + 1);
      }
    }

    // Frames over which the page shows the whole recording, not the game's view.
    this.wide = new Uint8Array(stream.frames.length);
    for (const p of stream.phases.filter(p => (phases.wide || []).includes(p.name)))
      for (let frame = p.first; frame <= p.last; frame++) this.wide[frame - 1] = 1;
  }

  /** The rectangle of the recording to show at frame n: [x, y, width, height]. */
  cut(n) {
    if (this.wide[n]) return [0, 0, this.width, this.height];
    const c = this.closeness[n];
    const t = c * c * (3 - 2 * c);
    const [ox, oy, ow, oh] = this.overview;
    const [vw, vh] = this.view;
    const [px, py] = this.centres[n];

    // Size eased in proportion, so the glide feels even from wide to close.
    const w = Math.min(this.width, ow * Math.pow(vw / ow, t));
    const h = Math.min(this.height, w * vh / vw);
    let x = ox + ow / 2 + (px - ox - ow / 2) * t;
    let y = oy + oh / 2 + (py - oy - oh / 2) * t;
    x = Math.min(Math.max(x, w / 2), this.width - w / 2);
    y = Math.min(Math.max(y, h / 2), this.height - h / 2);
    return [x - w / 2, y - h / 2, w, h];
  }
}

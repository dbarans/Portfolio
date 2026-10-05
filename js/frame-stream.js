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
 *
 * Decoded, a chapter's images take several hundred MB: more than a browser keeps, so left to
 * itself it drops some and decodes them again the moment one is drawn, a stall of a few
 * hundred ms in the middle of playing. So only the images of the frames around the one shown,
 * mostly in the way it is playing, are decoded, ahead of time and off the main thread, and the
 * rest are let go. A frame whose images are not decoded yet waits for them (onImage says when
 * they are in). Where decoding ahead fails, an image is drawn as a plain image instead.
 */
class FrameStream {
  /** Images requested at once while loading. */
  static PARALLEL = 4;

  /** Whether the browser can decode an image ahead of drawing it (createImageBitmap). */
  static BITMAPS = typeof createImageBitmap === 'function';

  /**
   * Frames whose images are kept decoded ahead of the one shown, in the way it plays, and
   * behind it. Counted in frames: a stretch of mostly key frames (the dungeon generator's)
   * would be hundreds of MB decoded at once if counted by the page's steps.
   */
  static AHEAD = 24;
  static BEHIND = 8;

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

    // Per image: the file as loaded, and what drawImage takes (the decoded bitmap, or the
    // image element where the browser cannot decode ahead).
    this.files = new Array(stream.images.length);
    this.images = new Array(stream.images.length);
    this.decoding = new Uint8Array(stream.images.length);
    this.window = [0, FrameStream.AHEAD]; // the frames whose images are kept decoded (keep)
    /** Called when a decoded image comes in, so a frame left waiting for it can be drawn. */
    this.onImage = null;

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

    // The first and last frame drawing each image directly (a key frame, or a patch pasted).
    this.usedFrom = new Int32Array(stream.images.length).fill(stream.frames.length);
    this.usedTo = new Int32Array(stream.images.length).fill(-1);
    const use = (image, i) => {
      this.usedFrom[image] = Math.min(this.usedFrom[image], i);
      this.usedTo[image] = Math.max(this.usedTo[image], i);
    };
    stream.frames.forEach((frame, i) => {
      if (frame.k !== undefined) use(frame.k, i);
      else for (let j = 0; j < frame.p.length; j += 7) use(frame.p[j], i);
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
      while (next < names.length && !this.disposed) {
        const i = next++;
        const url = this.base + names[i] + (this.stream.version ? `?v=${this.stream.version}` : '');
        if (FrameStream.BITMAPS) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Footage image missing: ${url}`);
          this.files[i] = await response.blob();
        } else {
          const image = new Image();
          image.decoding = 'async';
          image.src = url;
          try {
            await image.decode();
          } catch (error) {
            // decode() can give up on an image that loaded fine (a browser short of memory
            // for decoding ahead); drawing it still decodes it then.
            if (!image.complete || !image.naturalWidth) throw error;
          }
          this.images[i] = image;
        }
        if (this.disposed) return;
        arrived[i] = 1;
        this.decodeWindow();
        loaded += sizes[i] || 0;

        while (inOrder < names.length && arrived[inOrder]) inOrder++;
        while (this.playable < this.frameCount && this.needs[this.playable] < inOrder) this.playable++;
        if (onProgress) onProgress(loaded, this.playable);
      }
    };
    await Promise.all(Array.from({ length: FrameStream.PARALLEL }, worker));
  }

  /**
   * Keeps the images of frames first to last decoded and lets every other image go. Drawing
   * a frame takes its key frame's image and the patches since, so the images kept reach back
   * to the key frame before first.
   */
  keep(first, last) {
    this.window = [this.keyOf[Math.max(0, Math.min(first, this.frameCount - 1))], last];
    this.decodeWindow();
  }

  wanted(i) {
    return this.usedFrom[i] <= this.window[1] && this.usedTo[i] >= this.window[0];
  }

  decodeWindow() {
    if (!FrameStream.BITMAPS || this.disposed) return;
    for (let i = 0; i < this.files.length; i++) {
      if (!this.wanted(i)) {
        if (this.images[i]) this.release(i);
      } else if (this.files[i] && !this.images[i] && !this.decoding[i]) {
        this.decoding[i] = 1;
        createImageBitmap(this.files[i])
          // Short of memory for decoding ahead: a plain image, decoded when drawn, as before.
          .catch(() => {
            const image = new Image();
            image.src = URL.createObjectURL(this.files[i]);
            return image.decode().then(() => image, () => image);
          })
          .then(image => {
            this.decoding[i] = 0;
            if (this.disposed || !this.wanted(i)) {
              this.images[i] = image;
              this.release(i); // the page has moved on while it decoded
              return;
            }
            this.images[i] = image;
            if (this.onImage) this.onImage();
          });
      }
    }
  }

  release(i) {
    const image = this.images[i];
    if (image.close) image.close();
    else URL.revokeObjectURL(image.src);
    this.images[i] = null;
  }

  /** Lets go of every image at once (the page closing the chapter). */
  dispose() {
    this.disposed = true;
    if (FrameStream.BITMAPS) this.images.forEach((image, i) => { if (image) this.release(i); });
    this.images.fill(null);
    this.files.fill(null);
  }

  /**
   * Draws frame n (from 0), or, while n is still loading or its images decoding, the last
   * frame on the way to it that can be drawn.
   */
  show(n) {
    if (this.playable === 0) return;
    n = Math.max(0, Math.min(this.playable - 1, n));
    const back = n < this.shown ? FrameStream.AHEAD : FrameStream.BEHIND;
    this.keep(n - back, n + FrameStream.AHEAD + FrameStream.BEHIND - back);
    if (n === this.shown) return;

    const frames = this.stream.frames;
    const key = this.keyOf[n];
    const onward = this.shown >= key && this.shown < n;
    if (!onward && !this.images[frames[key].k]) return;
    let last = onward ? this.shown : key;
    while (last < n && this.decoded(frames[last + 1].p)) last++;
    if (onward && last === this.shown) return;

    if (!onward) this.ctx.drawImage(this.images[frames[key].k], 0, 0);
    for (let i = onward ? this.shown + 1 : key + 1; i <= last; i++) this.patch(frames[i].p);
    this.shown = last;

    if (this.camera) {
      const [x, y, w, h] = this.camera.cut(last);
      this.out.drawImage(this.frame, x, y, w, h, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  decoded(ops) {
    for (let j = 0; j < ops.length; j += 7) if (!this.images[ops[j]]) return false;
    return true;
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

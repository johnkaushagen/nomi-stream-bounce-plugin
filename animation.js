const STREAMCONFIG = {
    width: 1920,
    height: 1080,
    padding: 20,
}

const CONFIG = {
    // Stream dimensions (Set to your OBS canvas size)
    streamWidth: 1920,
    streamHeight: 1080,

    // Character image settings
    characterImage: "character.png",
    characterSize: 80,

    // Movement settings
    hopDistance: 30, // pixels
    hopDuration: 300, // milliseconds
    hopHeight: 40, // arc height

    // Pause behavior
    pauseChancePerHop: 0.08, // 8% chance to pause after each hop
    pauseMinDuration: 800, // Minimum pause duration in ms
    pauseMaxDuration: 2500, // Maximum pause duration in ms

    // Direction reversals
    reverseChancePerHop: 0.05, // 5% chance to reverse direction

    // Idle behavior
    idleChancePerPause: 0.6, // 60% chance to do a short idle animation
    idleBounceHeight: 8,
    idleDuration: 1200,

    // Border offset
    borderOffset: 80, // SET THIS TO characterSIZE
};

// We want a function that takes the characters position on an edge and returns
// the "forward" and "up" vectors for that edge.


class Edge {
    constructor(forward, up, length, start, stop) {
        this.forward = forward;
        this.up = up;
        this.start = start;
        this.stop = stop;
        this.length = Math.hypot(start.x, start.y, stop.x, stop.y);
    }

    getAbsoluteCoords(t) {
        return {
            x: (this.stop.x - this.start.x) * t + this.start.x,
            y: (this.stop.y - this.start.y) * t + this.start.y,
        };
    }
}

const EDGES = [
    // Bottom edge
    new Edge(
        {x: 1, y: 0},
        {x: 0, y: -1},
        CONFIG.streamWidth- 2 * CONFIG.borderOffset,
        {x: CONFIG.borderOffset, y: CONFIG.streamHeight - CONFIG.borderOffset},
        {x: CONFIG.streamWidth - CONFIG.borderOffset, y: CONFIG.streamHeight - CONFIG.borderOffset}
    ),
    // Right edge
    new Edge(
        {x: 0, y: -1},
        {x: -1, y: 0},
        CONFIG.streamHeight - 2 * CONFIG.borderOffset,
        {x: CONFIG.streamWidth - CONFIG.borderOffset, y: CONFIG.streamHeight - CONFIG.borderOffset},
        {x: CONFIG.streamWidth - CONFIG.borderOffset, y: CONFIG.borderOffset}
    ),
    // Top edge
    new Edge(
        {x: -1, y: 0},
        {x: 0, y: 1},
        CONFIG.streamWidth - 2 * CONFIG.borderOffset,
        {x: CONFIG.streamWidth - CONFIG.borderOffset, y: CONFIG.borderOffset},
        {x: CONFIG.borderOffset, y: CONFIG.borderOffset}
    ),
    // Left edge
    new Edge(
        {x: 0, y: 1},
        {x: 1, y: 0},
        CONFIG.streamHeight - 2 * CONFIG.borderOffset,
        {x: CONFIG.borderOffset, y: CONFIG.borderOffset},
        {x: CONFIG.borderOffset, y: CONFIG.streamHeight - CONFIG.borderOffset}
    ),
]

function doubleMod(n, m) {
    return ((n%m) + m) % m;
}

class Character {
    constructor() {
        this.character = document.getElementById('character');
        this.facing = 1; // 1 for right, -1 for left
        this.position = 0; // Relative. 0 is at start, 1 is at end
        this.edges = EDGES;
        this.rotations = [0, Math.PI/2, Math.PI, 3*Math.PI/2]; // Assuming facing = 1
        this.startingEdge = 0;
        this.currentEdge = 0;
        this.isHopping = false;
        this.isPaused = false;
        this.character.style.width = `${CONFIG.characterSize}px`;
        this.character.style.height = `${CONFIG.characterSize}px`;
    }

    easeInOut(t) {
        return 0.5 - 0.5 * Math.cos(Math.PI * t);
    }

    drawCharacter(x, y, squish, rotY=0) {
        const angle = this.rotations[this.currentEdge];//Math.atan2(edgeForward.y, edgeForward.x);
        const scale = -this.facing;
        const rotation = this.facing * angle;
        this.character.style.left = `${x}px`;
        this.character.style.top = `${y}px`;
        this.character.style.transform = `scaleX(${scale}) scaleY(${squish}) rotate(${rotation}rad) rotateY(${rotY}rad)`;
    }

    forward() {
        const edgeOrientation = this.edges[this.currentEdge].forward;
        const characterOrientation = this.facing;
        return {x: edgeOrientation.x * characterOrientation, y: edgeOrientation.y * characterOrientation};
    }

    up() {
        // Up is always up since our character doesn't turn upside down
        return this.edges[this.currentEdge].up;
    }

    getEdgeLength(edge) {
        return edge === 'top' || edge === 'bottom'
            ? STREAMCONFIG.width
            : STREAMCONFIG.height;
    }

    getCoords() {
        const rel = 0.5 * (1 + this.facing * (2 * this.position - 1));
        return this.edges[this.currentEdge].getAbsoluteCoords(rel);
    }

    updateCharacterPosition(progress) {
        const coords = this.getCoords();
        const centerOffset = CONFIG.characterSize / 2;
        const hopOffset = Math.sin(Math.PI * progress) * CONFIG.hopHeight;
        const squishFactor = 1 - 0.1 * Math.sin(Math.PI * progress);
        const x = coords.x - centerOffset + this.up().x * (hopOffset - centerOffset);
        const y = coords.y - centerOffset + this.up().y * (hopOffset - centerOffset);
        this.drawCharacter(x, y, squishFactor, this.rotY);
    }

    // Animation promises
    async animate() {
        while (true) {
            await this.hop();
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    async hop() {
        if (this.isHopping) return;
        this.isHopping = true;
        const hopdist = CONFIG.hopDistance / (this.edges[this.currentEdge].length);
        await this.hopForward(hopdist, CONFIG.hopDuration);
        if (Math.random() < CONFIG.pauseChancePerHop) {
            await new Promise((resolve) => setTimeout(resolve, 150));
            await this.pause();
        }
        if (Math.random() < CONFIG.reverseChancePerHop) {
            await new Promise((resolve) => setTimeout(resolve, 150));
            await this.reverse(CONFIG.reverseTurnDuration);
        }
        this.isHopping = false;
    }

    async pause() {
        this.isPaused = true;
        const pauseDuration = CONFIG.pauseMinDuration +
            Math.random() * (CONFIG.pauseMaxDuration - CONFIG.pauseMinDuration);
        if (Math.random() < CONFIG.idleChancePerPause) {
            await this.idleBounce();
        }
        await new Promise((resolve) => setTimeout(resolve, pauseDuration));
        this.isPaused = false;
    }

    async hopForward(distance, duration) {
        const startEdge = this.currentEdge;
        const nextEdge = doubleMod(startEdge + this.facing, this.edges.length);
        let startTime = null;
        const startPosition = this.position;
        return new Promise((resolve) => {
            const animate = (time) => {
                if (!startTime) startTime = time;
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeInOut(progress);
                if (startPosition + eased*distance >= 1) {
                    this.position = startPosition + eased*distance - 1;
                    this.currentEdge = nextEdge;
                } else {
                    this.position = startPosition + eased*distance;
                }
                this.updateCharacterPosition(eased);
                if (progress < 1) requestAnimationFrame(animate);
                else resolve();
            }
            requestAnimationFrame(animate);
        });
    }

    async reverse(duration) {
        this.facing = this.facing * -1;
        this.position = (1 - this.position);
        return new Promise((resolve) => setTimeout(resolve, duration));
    }

    async idleBounce() {
        const startPos = this.getCoords();
        const duration = CONFIG.idleDuration; // ms
        const height = CONFIG.idleBounceHeight; // px
        
        let startTime = null;
        return new Promise((resolve) => {
            const animate = (time) => {
                if (!startTime) startTime = time;
                const coords = this.getCoords();
                const progress = Math.min((time - startTime) / duration, 1);
                const offset = Math.sin(2 * Math.PI * progress) * height;
                const centerOffset = CONFIG.characterSize / 2;
                const x = coords.x - centerOffset + this.up().x * (offset - centerOffset);
                const y = coords.y - centerOffset + this.up().y * (offset - centerOffset);
                this.character.style.left = `${x}px`;
                this.character.style.top = `${y}px`;
                if (progress < 1) requestAnimationFrame(animate);
                else resolve();
            };
            requestAnimationFrame(animate);
        });
    }
}

window.addEventListener('load', () => {
    const character = new Character();
    character.currentEdge = 0;
    character.facing = 1;
    character.position = 0.89;
    character.animate();
});

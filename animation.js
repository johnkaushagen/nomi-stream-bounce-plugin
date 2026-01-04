const STREAMCONFIG = {
    width: 1920,
    height: 1080,
    padding: 20,
}

// We want a function that takes the characters position on an edge and returns
// the "forward" and "up" vectors for that edge.


class Edge {
    constructor(forward, up, length, start, stop) {
        this.forward = forward;
        this.up = up;
        this.start = start;
        this.stop = stop;
        this.length = length;
    }

    getAbsoluteCoords(t) {
        return {
            x: (this.stop.x - this.start.x) * t + this.start.x,
            y: (this.stop.y - this.start.y) * t + this.start.y,
        };
    }
}

class Character {
    constructor() {
        this.character = document.getElementById('character');
        this.facing = 1; // 1 for right, -1 for left
        this.edges = [
            // Bottom edge
            new Edge(
                {x: 1, y: 0},
                {x: 0, y: 1},
                STREAMCONFIG.width - 2 * STREAMCONFIG.padding,
                {x: STREAMCONFIG.padding, y: STREAMCONFIG.height - STREAMCONFIG.padding},
                {x: STREAMCONFIG.width - STREAMCONFIG.padding, y: STREAMCONFIG.height - STREAMCONFIG.padding}
            ),
            // Right edge
            new Edge(
                {x: 0, y: 1},
                {x: -1, y: 0},
                STREAMCONFIG.height - 2 * STREAMCONFIG.padding,
                {x: STREAMCONFIG.width - STREAMCONFIG.padding, y: STREAMCONFIG.height - STREAMCONFIG.padding},
                {x: STREAMCONFIG.width - STREAMCONFIG.padding, y: STREAMCONFIG.padding}
            ),
            // Top edge
            new Edge(
                {x: -1, y: 0},
                {x: 0, y: -1},
                STREAMCONFIG.width - 2 * STREAMCONFIG.padding,
                {x: STREAMCONFIG.width - STREAMCONFIG.padding, y: STREAMCONFIG.padding},
                {x: STREAMCONFIG.padding, y: STREAMCONFIG.padding}
            ),
            // Left edge
            new Edge(
                {x: 0, y: -1},
                {x: 1, y: 0},
                STREAMCONFIG.height - 2 * STREAMCONFIG.padding,
                {x: STREAMCONFIG.padding, y: STREAMCONFIG.padding},
                {x: STREAMCONFIG.padding, y: STREAMCONFIG.height - STREAMCONFIG.padding}
            ),
        ];
        this.startingEdge = 0;
        this.currentEdge = 0;
    }

    orientCharacter() {
        // Make sure the character is facing the correct direction
        // Our character's normal vector is always pointing UP with respect to
        // the current edge.
        // So if we get the angle between forward and up (which is our normal)
        // we can rotate our character accordingly.
        const forward = this.getForwardDirection();
        const up = this.getUpDirection();
        const angle = Math.atan2(forward.y, forward.x) - Math.atan2(up.y, up.x);
        console.log('Angle:', angle);
        console.log('Facing:', this.facing);
        this.character.style.transform = `scaleX(${-this.facing}) rotate(${angle}rad)`;
    }

    getForwardDirection() {
        const edgeOrientation = this.edges[this.currentEdge].forward;
        const characterOrientation = this.facing;
        return {x: edgeOrientation.x * characterOrientation, y: edgeOrientation.y * characterOrientation};
    }

    getUpDirection() {
        // Up is always up since our character doesn't turn upside down
        return this.edges[this.currentEdge].up;
    }


    getEdgeLength(edge) {
        return edge === 'top' || edge === 'bottom'
            ? STREAMCONFIG.width
            : STREAMCONFIG.height;
    }

    getCoords() {
        switch (this.startingEdge) {
            case 'bottom':
                return {
                    x: this.character.position,
                    y: STREAMCONFIG.height - STREAMCONFIG.padding,
                };
            case 'right':
                return {
                    x: STREAMCONFIG.width - STREAMCONFIG.padding,
                    y: STREAMCONFIG.height - this.character.position,
                };
            case 'top':
                return {
                    x: STREAMCONFIG.width - this.character.position,
                    y: STREAMCONFIG.padding,
                };
            case 'left':
                return {
                    x: STREAMCONFIG.padding,
                    y: this.character.position,
                };
        }
    }

    initializePosition() {
        this.character.position = 0;
        this.character.style.top = `${STREAMCONFIG.height - STREAMCONFIG.padding}px`;
        this.character.style.left = `${0 + STREAMCONFIG.padding}px`;
    }
    
    async hop(distance, duration) {
        let startTime = null;
        const startPosition = this.character.position;
        return new Promise((resolve) => {
            const animate = (time) => {
                if (!startTime) startTime = time;
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const hopHeight = Math.sin(progress * Math.PI) * 100; // Example hop height calculation
                this.character.position = startPosition + distance * progress;
                console.log(this.character.position);
                this.character.style.left = `${this.character.position + STREAMCONFIG.padding}px`;
                this.character.style.top = `${STREAMCONFIG.height - STREAMCONFIG.padding - hopHeight}px`;
                // this.updatePosition(progress);
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    updatePosition(progress) {
        const {x, y} = this.getCoords();
        this.character.style.top = `${y}px`;
        this.character.style.left = `${x}px`;
    }
}

window.addEventListener('load', () => {
    const character = new Character();
    character.initializePosition();
    // character.updatePosition(0);
    // character.hop(123, 500);
    character.currentEdge = 3
    character.facing = -1;
    character.orientCharacter();

});

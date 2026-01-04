const STREAMCONFIG = {
    width: 1920,
    height: 1080,
}

class Character {
    constructor() {
        this.character = document.getElementById('nomi');
    }
    
    async updatePosition() {
        let start = null;
        const duration = 1000;

        return new Promise((resolve) => {
            const animate = (time) => {
                if (!start) start = time;
                const elapsed = time - start;
                const progress = Math.min(elapsed / duration, 1);
                this.character.style.left = `${progress * STREAMCONFIG.width}px`;
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }
}

window.addEventListener('load', () => {
    const character = new Character();
    character.updatePosition();
});

class Character {
    constructor() {
        this.character = document.getElementById('nomi');
        console.log(this.character);
    }
}

window.addEventListener('load', () => {
    const character = new Character();
});

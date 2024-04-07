const images = []; let pause = true; let suit = localStorage.getItem("suit") != null ? localStorage.getItem("suit") : 0; let shop = (localStorage.getItem("shop") != null ? localStorage.getItem("shop") : "100000000000").split("");
const suits = [
  { img: 0, cost: 0 }, { img: 19, cost: 10 }, { img: 21, cost: 20 }, { img: 13, cost: 30 },
  { img: 11, cost: 35 }, { img: 23, cost: 40 }, { img: 10, cost: 45 }, { img: 22, cost: 50 },
  { img: 24, cost: 66 }, { img: 25, cost: 77 }, { img: 20, cost: 88 }, { img: 12, cost: 99 }
];



// MENU
class MenuButton extends Button {
  constructor(x, y, size, img, func) { super(x, y, 0, 0); this.start = true; this.finalSize = size; this.func = func; this.img = img; this.render(); }

  render() { renderImage(images[this.img], this.transform, 1); }
  animate(value) {
    clearTransform(this.transform, 1);
    this.transform.size.x += value; this.transform.size.y += value;
    this.render();
  }

  lateUpdate() {
    super.lateUpdate();
    if (!this.start) return;
    if (this.transform.size.x < this.finalSize) this.transform.size.x += float2int(this.finalSize / 20);
    if (this.transform.size.y < this.finalSize) this.transform.size.y += float2int(this.finalSize / 20);
    this.start = this.transform.size.x < this.finalSize & this.transform.size.y < this.finalSize;
    this.render();
  }

  onRelease() { this.animate(50); this.func.call(); }
  onInterrupt() { this.animate(50); }
  onPress() { this.animate(-50); }
}


class MoneyText extends GameObject {
  constructor() { super(100, 200, 100, 100); this.money = localStorage.getItem("money") != null ? (localStorage.getItem("money") * 1) : 0; }
  render() { clearTransform(new Vector4(540, this.transform.position.y, 1080, this.transform.size.y), 1); renderImage(images[2], this.transform, 1); layers[1].context.fillText(this.money, this.transform.position.x + 55, this.transform.position.y + 10); }
  setMoney(value) { this.money = value; localStorage.setItem("money", this.money); this.render(); }
  getMoney() { return this.money; }
}


class ScoreText extends GameObject {
  constructor() { super(100, 100, 100, 100); this.score = 0; this.highScore = localStorage.getItem("score") != null ? localStorage.getItem("score") : 0; }
  update() { if (pause) return; this.score += 1 / 60; if (float2int(this.score) > float2int(this.highScore)) { this.highScore = float2int(this.score); localStorage.setItem("score", this.highScore); } }
  lateUpdate() { if (!pause) this.render(); }
  render() { clearTransform(new Vector4(540, this.transform.position.y, 1080, this.transform.size.y), 1); renderImage(images[5], this.transform, 1); layers[1].context.fillText(float2int(this.score), this.transform.position.x + 55, this.transform.position.y + 10); }
  renderHighScore() { clearTransform(new Vector4(540, this.transform.position.y, 1080, this.transform.size.y), 1); renderImage(images[5], this.transform, 1); layers[1].context.fillText(float2int(this.highScore), this.transform.position.x + 55, this.transform.position.y + 10); }
}
// MENU



// GAME
class Background extends GameObject {
  constructor() { super(540, 960, 1080, 1920); this.speed = 10; this.x = 1080; }
  render() { this.x -= this.speed + float2int(objects[3].score / 60); if (this.x <= 0) this.x += 1080; renderImage(images[3], new Vector4(this.x - 540, 960, 1080, 1920), 0); renderImage(images[3], new Vector4(this.x + 540, 960, 1080, 1920), 0); }
  lateUpdate() { if (!pause) { clearTransform(this.transform, 0); this.render(); } }
}


class Control extends Button { constructor() { super(540, 960, 1080, 1920); } onPress() { if (!pause) objects[6].tap(); } }


class Player extends GameObject {
  constructor(img) { super(540, 960, 200, 200); this.img = img; this.speed = -30; this.weight = 5; }

  update() { if (!pause) { this.speed += 1 / 6 * this.weight; this.transform.position.y += float2int(this.speed); if (this.transform.position.y > 1920 + this.transform.size.y) gameOver(); } }

  lateUpdate() { if (!pause) this.render(); }

  render() {
    this.transform.size.x = float2int(10000 / abs(this.speed)); if (this.transform.size.x > 200) this.transform.size.x = 200;
    this.transform.size.y = float2int((abs(this.speed) * 4.5)); if (this.transform.size.y < 200) this.transform.size.y = 200;
    renderImage(this.img, this.transform, 0);
  }

  tap() { this.speed = 49; }

  collision(other) {
    if (other.constructor.name === "Platform" || other.constructor.name === "MovePlatform") {
      let a = this.transform.position.y < other.transform.position.y;
      this.transform.position.y = other.transform.position.y + (other.transform.size.y + this.transform.size.y) / 2 * (a ? -1 : 1);
      this.speed /= a ? -1.5 : 2;
    }
  }
}


class LevelGenerator extends GameObject {
  constructor() { super(0, 0, 0, 0); this.platform_timeout = 0; this.platform_time = 1; this.fake_platform_timeout = 0; this.fake_platform_time = 1; this.coin_timeout = 10; this.coin_time = 0; }
  
  update() {
    if (!pause) {
      this.platform_time += 1 / (this.platform_timeout * 60); if (this.platform_time >= 1) { this.platform_time = 0; this.generatePlatform(); }
      this.coin_time += 1 / (this.coin_timeout * 60); if (this.coin_time >= 1) { this.coin_time = 0; this.generateCoin(); }
      if (objects[3].score % 60 > 15) { this.fake_platform_time += 1 / (this.fake_platform_timeout * 60); if (this.fake_platform_time >= 1) { this.fake_platform_time = 0; this.generateFakePlatform(); } }
    }
  }
  
  generatePlatform() {
    let y = 960 + float2int(random() * 910);

    if (objects[3].score % 60 > 30 & random() > 0.5) objects.push(new MovePlatform(y, (objects[3].score % 60 > 45 & random() > 0.5) ? true : false));
    else objects.push(new Platform(y));

    this.platform_timeout = float2int(random() * 100 + 50) / 100;
  }

  generateFakePlatform() {
    objects.push(new FakePlatform(960 + float2int(random() * 910)));
    this.fake_platform_timeout = float2int(random() * 100 + 50) / 100;
  }

  generateCoin() {
    objects.push(new Coin(150 + float2int(random() * 660)));
    this.coin_timeout = 10 - (float2int(objects[3].score / 18) >= 9.9 ? 9.9 : float2int(objects[3].score / 18));
  }
}


class HorizontalObject extends GameObject {
  constructor(y, width, height) { super(1180, y, width, height); this.speed = 10; }

  update() { if (!pause) { this.transform.position.x -= this.speed + float2int(objects[3].score / 60); if (this.transform.position.x < -this.transform.size.x / 2) this.destroyed = true; } }
  lateUpdate() { if (!pause) this.render(); }

  collision() { }
}


class Platform extends HorizontalObject {
  constructor(y) { super(y, 200, 1); }
  render() { renderImage(images[1], new Vector4(this.transform.position.x, this.transform.position.y, 200, 100), 0); }
}


class MovePlatform extends Platform {
  constructor(y, direction) { super(y, 200, 1); this.direction = direction; this.time = 0; }
  update() {
    super.update(); if (!pause) {
      this.time += 0.1; if (this.direction) this.transform.position.x += float2int(Math.sin(this.time) * 10);
      else this.transform.position.y += float2int(Math.sin(this.time) * 10);
    }
  }
  render() { renderImage(images[18], new Vector4(this.transform.position.x, this.transform.position.y, 200, 100), 0); }
}


class FakePlatform extends HorizontalObject {
  constructor(y) { super(y, 200, 1); this.hide = false; this.a = 0; }
  update() { super.update(); if (!pause) { if (this.hide) { this.transform.position.y += this.a; this.a += 2; } } }
  render() { renderImage(images[17], new Vector4(this.transform.position.x, this.transform.position.y, 200, 100), 0); }
  collision(other) { if (other.constructor.name === "Player") this.hide = true; }
}


class Coin extends HorizontalObject {
  constructor(y) { super(y, 150, 150); this.hide = false; }

  update() { super.update(); if(!pause) { if (this.hide) { this.transform.size.x -= 10; this.transform.size.y -= 10; if (this.transform.size.x <= 0) { objects[2].setMoney(objects[2].getMoney() + 1); this.destroyed = true; } } } }
  render() { renderImage(images[2], this.transform, 0); }
  collision(other) { if (!this.hide & other.constructor.name === "Player") this.hide = true; }
}


function gameOver() {
  pause = true; objects.push(new MenuButton(540, 785, 550, 6, () => { if (objects[2].getMoney() >= 21) { objects[2].setMoney(objects[2].getMoney() - 21); respawn(); } }));
  objects.push(new MenuButton(540, 1360, 300, 7, () => { scene_control.load("Game"); })); objects.push(new MenuButton(240, 1210, 250, 8, () => { scene_control.load("Menu"); }));
  objects.push(new MenuButton(840, 1210, 250, 9, () => { vkBridge.send('VKWebAppShare', { link: "https://vk.com/app51897159" }); }));
}


function respawn() {
  objects[6].transform.position.y = 960; objects[6].speed = -30; pause = false;
  objects.forEach(object => { if (object.constructor.name === "MenuButton") { object.destroyed = true; object.render = () => {} } });
  clearTransform(new Vector4(540, 960, 1080, 1920 - 600), 1);
}
// GAME



// SHOP
class ShopButton extends Button {
  constructor(x, y, id) { super(x, y, 200, 200); this.id = id; this.startY = y; this.a = 0; this.active = shop[this.id] == "1" ? true : false; }

  onRelease() {
    if (this.active) { suit = this.id; localStorage.setItem("suit", suit); }
    else if (objects[2].getMoney() >= suits[this.id].cost) {
      objects[2].setMoney(objects[2].getMoney() - suits[this.id].cost);
      suit = this.id; this.active = true; localStorage.setItem("suit", suit);
      shop[this.id] = "1"; localStorage.setItem("shop", shop.join(""));
      clearTransform(new Vector4(this.transform.position.x, this.transform.position.y + 200, this.transform.size.x, this.transform.size.y), 1)
    }
  }

  update() {
    super.update(); clearTransform(this.transform, 1);
    if (suit == this.id || this.transform.position.y != this.startY) {
      this.transform.position.y -= float2int(this.a); this.a -= 5 / 3;
      if (this.transform.position.y > this.startY) { this.a += 20; this.transform.position.y = this.startY; }
    }

    renderImage(images[suits[this.id].img], this.transform, 1);
    if (!this.active) {
      layers[1].context.textAlign = "center";
      layers[1].context.fillText(suits[this.id].cost, this.transform.position.x, this.transform.position.y + 200);
      layers[1].context.textAlign = "left"; 
    }
  }
}
// SHOP



// ENGINE TOOLS
class SceneControl extends GameObject {
  constructor(scenes) { super(540, 960, 1080, 1920); this.move = false; this.scene = "Load"; this.scenes = scenes; }

  load(scene) { this.scene = scene; this.move = true; this.transform.position.y = 2880; }

  clearObjects() { for (let i = 4; i < objects.length; i++) { objects.splice(i, 1); i--; } for (let i = 0; i < layers.length; i++) clearTransform(this.transform, i); }

  update() {
    if (this.move) {
      clearTransform(this.transform, 2); this.transform.position.y -= 240; if (this.transform.position.y == 960) { this.clearObjects(); this.scenes[this.scene](); } if (this.transform.position.y == -960) this.move = false;
      layers[2].context.fillRect(this.transform.position.x - this.transform.size.x / 2, this.transform.position.y - this.transform.size.y / 2, this.transform.size.x, this.transform.size.y);
    }
  }
}


const scene_control = new SceneControl(
  {
    "Menu": () => {
      renderImage(images[26], new Vector4(540, 660, 1080, 650), 1); objects[2].render(); objects[3].renderHighScore();
      objects.push(new MenuButton(540, 1310, 500, 4, () => { scene_control.load("Game"); }));
      objects.push(new MenuButton(250, 1720, 300, 14, () => { scene_control.load("Shop"); }));
      objects.push(new MenuButton(830, 1720, 300, 16, () => { window.open("https://vk.com/id450952979"); }));
    },
    "Game": () => {
      pause = false; objects.push(new Background()); objects.push(new Control());
      objects.push(new Player(images[suits[suit].img])); objects.push(new LevelGenerator());
      objects[2].render(); objects[3].score = 0;
    },
    "Shop": () => {
      objects[2].render(); objects[3].renderHighScore(); objects.push(new MenuButton(540, 1720, 250, 15, () => { scene_control.load("Menu"); }));
      for (let i = 0; i < 12; i++) objects.push(new ShopButton(216 * (1 + i % 4), 450 + 420 * float2int(i / 4), i));
    },
  }
);


function start() {
  seed = (new Date()).getMilliseconds(); for (let i = 0; i < 2; i++) layers.push(new Layer());
  layers[1].context.font = "100px Monaco, monospace"; layers[1].context.textBaseline = "middle"; layers[2].context.fillStyle = "#feff0b";
  objects.push(scene_control); objects.push(new MoneyText()); objects.push(new ScoreText()); scene_control.load("Menu");
}


class Loader {
  constructor(images_count) { this.images_count = images_count; this.progress = 0; }
  load() { for (let i = 0; i < this.images_count; i++) { images.push(new Image()); images[i].src = `resources/images/${i}.png`; images[i].onload = () => this.setLoadProgress(this.progress + 1); } }
  setLoadProgress(progress) { this.progress = progress; /* console.log(`loading: ${float2int(this.progress / this.images_count * 100)}%`); */ if (this.progress === this.images_count) start(); else this.render(); }
  render() { clearTransform(new Vector4(540, 960, 1080, 1920), 0); layers[0].context.fillText(`${float2int(this.progress / this.images_count * 100)}%`, 540, 960); }
}
// ENGINE TOOLS



layers[0].context.font = "400px Monaco, monospace"; layers[0].context.textBaseline = "middle"; layers[0].context.textAlign = "center";
const loader = new Loader(27); loader.load();

/**
 * Главный класс игры
 */
class Game {
  constructor() {
    this._game_title = document.querySelector(".game_title");
    this._game_timer = document.querySelector(".game_timer");
    this._game = document.querySelector(".game");
    this._level = 1;
    this._click_enable = true;
    this._first_card = null;
    this._second_card = null;
    this._cards_left = this.rows * this.columns;
  }

  nextLevel() {
    this._level = this._level === MAX_LEVEL ? MAX_LEVEL : this._level + 1;
    this.init();
  }

  loadLevel(level) {
    this._level = level >= 1 && level <= MAX_LEVEL ? level : MAX_LEVEL;
    this.init();
  }

  init() {
    const numbersArray = Array.from(
      { length: this._cards_left },
      (_, i) => i + 1
    );
    numbersArray.sort(() => 0.5 - Math.random());
    const cards = numbersArray.map((number) => {
      const card = new Card("monsters", number);
      card.node.addEventListener("click", () => {
        this.cardClick(card);
      });
      return card;
    });
    cards.forEach((card) => {
      this._game.appendChild(card.node);
    });

    this._game.classList.add(`level-${this._level}`);

    //this.start();
  }

  start() {
    const timer = new Timer(this._game_timer);
    timer.start();
  }

  cardClick(card) {
    console.log(this._first_card, this._second_card);
    if (this._click_enable && card._state === "close") {
      card.open();
      if (!this._first_card) {
        this._first_card = card;
      } else {
        this._second_card = card;
        this.checkCards();
      }
    }
  }

  checkCards() {
    this._click_enable = false;
    if (this._first_card.coupleNumber === this._second_card.coupleNumber) {
      this.roundWin();
    } else {
      this.roundLose();
    }
  }

  roundWin() {
    this._first_card.remove();
    this._second_card.remove();
    this._cards_left -= 2;
    this.checkGameWin();
  }

  roundLose() {
    setTimeout(() => {
      this._first_card.close();
      this._second_card.close();
      this.cardsReset();
    }, 1000);
  }

  checkGameWin() {
    if (this._cards_left === 0) {
      this.win();
    } else {
      this.cardsReset();
    }
  }

  cardsReset() {
    this._first_card = null;
    this._second_card = null;
    this._click_enable = true;
  }

  win() {
    setTimeout(() => {
      alert("GJ");
    }, 1000);
  }

  get rows() {
    return this._level + 3;
  }
  get columns() {
    return this._level + 2;
  }
}

/**
 * Таймер. Занимается отсчетом времени и возвращает затраченное время.
 */
class Timer {
  constructor(target) {
    this._tenthseconds = 0;
    this._seconds = 0;
    this._minutes = 0;
    this._target = target;
  }

  start() {
    this._timer = setInterval(() => {
      this._tenthseconds += 1;
      if (this._tenthseconds === 10) {
        this._tenthseconds = 0;
        this._seconds += 1;
        if (this._seconds === 60) {
          this._seconds = 0;
          this._minutes += 1;
        }
      }
      this._target.textContent = this.time;
    }, 100);
  }

  stop() {
    clearInterval(this._timer);
  }

  reset() {
    this._tenthseconds = 0;
    this._seconds = 0;
    this._minutes = 0;
  }

  get time() {
    return `${this.minutes}:${this.seconds}.${this.tenthseconds}`;
  }

  get tenthseconds() {
    return this._tenthseconds.toString();
  }
  get seconds() {
    return this._seconds < 10 ? `0${this._seconds}` : this._seconds.toString();
  }
  get minutes() {
    return this._minutes.toString();
  }
}

/**
 * Карточка
 */
class Card {
  constructor(type, id) {
    this._type = type;
    this._id = id;
    this._state = "close";
    this.node = this._getNode();
  }
  _getNode() {
    const node = document.createElement("div");
    node.classList.add("card");
    node.innerHTML = `
    <div class="card__flipper">
        <div class="card__front"></div>
        <div class="card__back">
          <img src="images/${this._type}/${this.coupleNumber}.png" alt="image 1" />
        </div>
      </div>
    `;

    return node;
  }
  open() {
    this._state = "open";
    this.node.classList.add("open");
  }
  remove() {
    this._state = "remove";
    this.node.classList.add("hide");
  }
  close() {
    this._state = "close";
    this.node.classList.remove("open");
  }

  get coupleNumber() {
    return Math.ceil(this._id / 2);
  }

  get isOpen() {
    return this._state === "open";
  }
}

MAX_LEVEL = 3;

const game = new Game();
game.init();

/**
 * Игрок может выбрать настройки для будущей игры
 */
class Settings {
  constructor() {
    this._target = document.getElementById("settings");
    this._input_rows = document.getElementById("input_rows");
    this._input_columns = document.getElementById("input_columns");
    this._start_button = document.getElementById("start_button");
    this._error_target = document.getElementById("message_container");
    this._start_button.addEventListener("click", () => {
      this._onStart();
    });
    this._error_messages = {
      invalid_rows: "<br>Недопустимое количество рядов",
      invalid_cols: "<br>Недопустимое количество столбцов",
      odd: "<br>Нечетное количество карточек",
      girls: "<br>Героинь больше 12<br>Выберите другое количество",
    };
  }

  _onStart() {
    const rows = this._input_rows.value;
    const cols = this._input_columns.value;
    const image_type = document.querySelector(
      'input[name="image_type"]:checked'
    ).value;
    const is_data_valid = this._checkGameData(rows, cols, image_type);
    if (is_data_valid) {
      this._creaateGame(rows, cols, image_type);
    }
  }

  _checkGameData(rows, cols, image_type) {
    let error_message = "";
    const cards_amount = rows * cols;
    this._error_target.innerHTML = "";
    if (rows < MIN_CARDS || rows > MAX_CARDS) {
      error_message += this._error_messages.invalid_rows;
    }
    if (cols < MIN_CARDS || cols > MAX_CARDS) {
      error_message += this._error_messages.invalid_cols;
    }
    if (cards_amount % 2 !== 0) {
      error_message += this._error_messages.odd;
    }
    if (image_type === "girls" && cards_amount > 12) {
      error_message += this._error_messages.girls;
    }
    this._error_target.innerHTML = error_message;
    return error_message === "";
  }

  _creaateGame(rows, cols, image_type) {
    this._hideSettings();
    const game = new Game(rows, cols, image_type);
  }

  _hideSettings() {
    this._target.classList.add("none");
  }
}

/**
 * Главный класс игры
 */
class Game {
  constructor(rows, columns, image_type) {
    this._target = document.querySelector(".game");
    this._rows = rows;
    this._cols = columns;
    this._card_type = image_type;
    this._click_enable = true;
    this._first_card = null;
    this._second_card = null;
    this._cards_amount = this._rows * this._cols;
    this._init();
  }

  _init() {
    const cards = this._createCards();
    cards.forEach((card) => {
      this._target.appendChild(card.node);
    });

    this._target.classList.remove("none");
    this._target.classList.add(`columns_${this._cols}`);

    //this.start();
  }

  _createCards() {
    const numbersArray = this._getRandomArray(this._cards_amount);
    const cards = numbersArray.map((number) => {
      const card = this._createCard(this._card_type, number);
      card.node.addEventListener("click", () => {
        this._cardClick(card);
      });
      return card;
    });
    return cards;
  }

  _getRandomArray(length) {
    const numbersArray = Array.from({ length }, (_, i) => i + 1);
    numbersArray.sort(() => 0.5 - Math.random());
    return numbersArray;
  }

  _createCard(type, number) {
    switch (type) {
      case "girls":
      case "monsters":
        return new ImageCard(type, number);
      case "colors":
        return new ColorCard(number);
      default:
        return new ColorCard(number);
    }
  }

  start() {
    const timer = new Timer(this._game_timer);
    timer.start();
  }

  _cardClick(card) {
    console.log(this._first_card, this._second_card);
    if (this._click_enable && card._state === "close") {
      card.open();
      if (!this._first_card) {
        this._first_card = card;
      } else {
        this._second_card = card;
        this._checkCards();
      }
    }
  }

  _checkCards() {
    this._click_enable = false;
    if (
      this._first_card.getCoupleNumber() === this._second_card.getCoupleNumber()
    ) {
      this._roundWin();
    } else {
      this._roundLose();
    }
  }

  _roundWin() {
    this._first_card.remove();
    this._second_card.remove();
    this._cards_amount -= 2;
    this._checkGameWin();
  }

  _roundLose() {
    setTimeout(() => {
      this._first_card.close();
      this._second_card.close();
      this.roundReset();
    }, 1000);
  }

  _checkGameWin() {
    if (this._cards_amount === 0) {
      this.win();
    } else {
      this.roundReset();
    }
  }

  roundReset() {
    this._first_card = null;
    this._second_card = null;
    this._click_enable = true;
  }

  win() {
    setTimeout(() => {
      alert("GJ");
    }, 1000);
  }
}

/**
 * Таймер. Занимается отсчетом времени и возвращает затраченное время.
 */
class Timer {
  constructor(target) {
    this._seconds = 0;
    this._target = target;
  }

  start() {
    this._timer = setInterval(() => {
      this._seconds += 0.1;
      this.showTime();
    }, 100);
  }
  showTime() {
    const minutes = Math.floor(parseInt(this._seconds) / 60);
    const seconds = (this._seconds -= minutes * 60);
    this._target.textContent = `this.time`;
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
 * Базовый класс для карточки
 */
class Card {
  constructor(type, id) {
    this._type = type;
    this._id = id;
    this._state = "close";
    this.node = this._getNode(); // каждый дочерний класс должен иметь метод _getNode().
    // он возвращает узел с разметкой карточки.
  }

  open() {
    this._state = "open";
    this.node.classList.add("open");
  }
  remove() {
    this._state = "remove";
    this.node.classList.add("remove");
  }
  close() {
    this._state = "close";
    this.node.classList.remove("open");
  }

  getCoupleNumber() {
    return Math.ceil(this._id / 2);
  }

  isOpen() {
    return this._state === "open";
  }
}

class ImageCard extends Card {
  constructor(type, id) {
    super(type, id);
  }

  _getNode() {
    const node = document.createElement("div");
    node.classList.add("card");
    node.innerHTML = `
    <div class="card__flipper">
        <div class="card__front"></div>
        <div class="card__back">
          <img src="images/${
            this._type
          }/${this.getCoupleNumber()}.png" alt="image ${this.id}" />
        </div>
      </div>
    `;
    return node;
  }
}

class ColorCard extends Card {
  constructor(id) {
    super("colors", id);
  }
  _getNode() {
    const node = document.createElement("div");
    node.classList.add("card");
    node.innerHTML = `
    <div class="card__flipper">
        <div class="card__front"></div>
        <div class="card__back">
          <div class="card__color" style="background-color: ${this._getColor()}"></div>
        </div>
      </div>
    `;
    return node;
  }

  _getColor() {
    const colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#ffff00",
      "#00ffff",
      "#ff00ff",

      "#800000",
      "#008000",
      "#000080",
      "#808000",
      "#800080",
      "#008080",

      "#000000",
      "#ffffff",
      "#808080",
      "#ff8080",
      "#8080ff",
      "#80ff80",

      "#ff8000",
      "#ff0080",
      "#80ff00",
      "#8000ff",
      "#00ff80",
      "#0080ff",

      "#3388aa",
      "#33aa88",
      "#88aa33",
      "#8833aa",
      "3aa3388",
      "#aa8833",

      "#1199ff",
      "#ff9911",
      "#99ff11",
      "#11ff99",
      "#ff1199",
      "#9911ff",
    ];
    const couple_number = this.getCoupleNumber();
    return colors[couple_number];
  }
}

MIN_CARDS = 2;
MAX_CARDS = 8;

const settings = new Settings();
// game.init();

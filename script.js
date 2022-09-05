/**
 * Класс, который управляет содержимым на странице
 */
class Controller {
  constructor() {
    this._node = document.getElementById("target");
    this._settings = new Settings(this._getGameSettings());
    this._timer = new Timer();
    this._game = new Game();
    this._results = new Results(this._repeatGame(), this._resetGame());
    this._game_settings = null;
    this._showSettings();
  }

  _getGameSettings() {
    return (game_settings) => {
      this._game_settings = game_settings;
      this._createGame();
    };
  }

  _showSettings() {
    this._node.innerHTML = "";
    this._node.append(this._settings._node);
  }

  _showResults() {
    return () => {
      this._results.init(this._timer.time);
      this._node.innerHTML = "";
      this._node.append(this._results._node);
    };
  }

  _createGame() {
    this._game.create(this._game_settings, this._timer, this._showResults());
    this._node.innerHTML = "";
    this._node.append(this._game._node);
    this._node.insertAdjacentElement("beforebegin", this._timer._node);
  }

  _repeatGame() {
    return () => {
      this._createGame();
    };
  }

  _resetGame() {
    return () => {
      this._showSettings();
    };
  }
}

/**
 * Игрок может выбрать настройки для будущей игры.
 * Класс позволяет получить словарь с количеством рядов, столбцов и типом изображений
 * Конструктор принимает callback, в который передаются выбранные пользователем настройки
 */
class Settings {
  constructor(callback) {
    this._node = document.getElementById("settings");
    this.callback = callback;
    this._input_rows = document.getElementById("input_rows");
    this._input_columns = document.getElementById("input_columns");
    this._start_button = document.getElementById("start_button");
    this._start_button.addEventListener("click", () => {
      this._saveSettings();
    });

    this._error_target = document.getElementById("message_container");
    this._error_messages = {
      invalid_rows: "Недопустимое количество рядов",
      invalid_cols: "Недопустимое количество столбцов",
      odd: "Нечетное количество карточек",
      girls: "Героинь не может быть больше 12",
    };
  }

  _saveSettings() {
    const rows = this._input_rows.value;
    const columns = this._input_columns.value;
    const card_type = document.querySelector(
      'input[name="image_type"]:checked'
    ).value;
    const is_data_valid = this._checkGameData(rows, columns, card_type);
    if (is_data_valid) {
      this.callback({ rows, columns, card_type });
    }
  }

  _checkGameData(rows, columns, card_type) {
    const error_message = document.createElement("div");
    const cards_amount = rows * columns;
    this._error_target.innerHTML = "";
    if (rows < MIN_CARDS || rows > MAX_CARDS) {
      error_message.append(
        this._createErrorRow(this._error_messages.invalid_rows)
      );
    }
    if (columns < MIN_CARDS || columns > MAX_CARDS) {
      error_message.append(
        this._createErrorRow(this._error_messages.invalid_cols)
      );
    }
    if (cards_amount % 2 !== 0) {
      error_message.append(this._createErrorRow(this._error_messages.odd));
    }
    if (card_type === "girls" && cards_amount > 12) {
      error_message.append(this._createErrorRow(this._error_messages.girls));
    }
    this._error_target.append(error_message);
    return error_message.childNodes.length === 0;
  }

  _createErrorRow(message) {
    const error_node = document.createElement("p");
    error_node.textContent = message;
    return error_node;
  }
}

/**
 * Главный класс игры
 */
class Game {
  constructor() {
    this._node = document.createElement("div");
    this._node.classList.add("game");
    this._rows = null;
    this._columns = null;
    this._card_type = null;
    this._first_card = null;
    this._second_card = null;
    this._click_enable = true;
    this._cards_amount = null;
    this._is_first_click = true;
    this._timer = null;
  }

  create({ rows, columns, card_type }, timer, callback) {
    this._node.innerHTML = "";
    this._rows = rows;
    this._columns = columns;
    this._card_type = card_type;
    this._cards_amount = rows * columns;
    this._timer = timer;
    this._callback = callback;
    this._is_first_click = true;
    this._click_enable = true;
    this._first_card = null;
    this._second_card = null;
    this._timer.reset();
    this._timer._show();
    const cards = this._createCards();
    cards.forEach((card) => {
      this._node.appendChild(card.node);
    });
    this._node.classList.remove(...this._node.classList);
    this._node.classList.add("game", `columns_${this._columns}`);
  }

  _createCards() {
    const numbersArray = this._getRandomArray(this._cards_amount);
    const cards = numbersArray.map((number) => this._createCard(number));
    return cards;
  }

  _getRandomArray(length) {
    const numbersArray = Array.from({ length }, (_, i) => i + 1);
    numbersArray.sort(() => 0.5 - Math.random());
    return numbersArray;
  }

  _createCard(number) {
    switch (this._card_type) {
      case "girls":
      case "monsters":
        return new ImageCard(this._card_type, number, this._cardClick());
      case "colors":
        return new ColorCard(number, this._cardClick());
      default:
        return new ColorCard(number, this._cardClick());
    }
  }

  _cardClick() {
    return (card) => {
      if (this._is_first_click) {
        this._is_first_click = false;
        this._timer.start();
      }
      if (this._click_enable && card._state === "close") {
        card.open();
        if (!this._first_card) {
          this._first_card = card;
        } else {
          this._second_card = card;
          this._checkCards();
        }
      }
    };
  }

  _checkCards() {
    this._click_enable = false;
    if (
      this._first_card.getCoupleNumber() === this._second_card.getCoupleNumber()
    ) {
      this._cardsCorrect();
    } else {
      this._cardsWrong();
    }
  }

  _cardsCorrect() {
    this._first_card.remove();
    this._second_card.remove();
    this._cards_amount -= 2;
    this._checkGameWin();
  }

  _cardsWrong() {
    setTimeout(() => {
      this._first_card.close();
      this._second_card.close();
      this._roundReset();
    }, 1000);
  }

  _checkGameWin() {
    if (this._cards_amount === 0) {
      this._win();
    } else {
      this._roundReset();
    }
  }

  _roundReset() {
    this._first_card = null;
    this._second_card = null;
    this._click_enable = true;
  }

  _win() {
    this._timer.stop();
    setTimeout(() => {
      this._callback();
    }, 500);
  }
}

/**
 * Таймер. Занимается отсчетом времени и возвращает затраченное время.
 */
class Timer {
  constructor() {
    this._node = document.createElement("h3");
    this._node.classList.add("timer");
    this._seconds = 0;
    this._showTime();
  }

  start() {
    this._show();
    this._timer = setInterval(() => {
      this._seconds += 0.1;
      this._showTime();
    }, 100);
  }

  stop() {
    this._hide();
    clearInterval(this._timer);
  }

  reset() {
    this._seconds = 0;
  }

  _hide() {
    this._node.classList.add("hide");
  }

  _show() {
    this._showTime();
    this._node.classList.remove("hide");
  }

  _showTime() {
    this._node.textContent = this.time;
  }

  get seconds() {
    const sec = (this._seconds - this.minutes * 60).toFixed(1);
    return sec < 10 ? `0${sec}` : sec.toString();
  }

  get minutes() {
    return Math.floor(parseInt(this._seconds) / 60);
  }

  get time() {
    return `${this.minutes}:${this.seconds}`;
  }
}

/**
 * Базовый класс для карточки
 */
class Card {
  constructor(type, id, callback) {
    this._type = type;
    this._id = id;
    this._callback = callback;
    this._state = "close";
    this.node = this._getNode();
    this.node.addEventListener("click", () => {
      callback(this);
    });
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
}

class ImageCard extends Card {
  constructor(type, id, callback) {
    super(type, id, callback);
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
  constructor(id, callback) {
    super("colors", id, callback);
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

/**
 * Класс с результатами игры.
 * Принимает два callback - рестарт существующей и создание новой игры
 */
class Results {
  constructor(repeat, reset) {
    this._repeatButton = this._createButton(
      "Сыграть еще раз",
      "button",
      repeat
    );
    this._resetButton = this._createButton(
      "Создать новую игру",
      "button",
      reset
    );
    this._node = null;
  }

  init(time) {
    const node = document.createElement("div");
    node.classList.add("results");
    node.textContent = time;
    node.append(this._repeatButton, this._resetButton);
    this._node = node;
  }

  _createButton(text, style, callback) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add(style);
    button.addEventListener("click", callback);
    return button;
  }
}

MIN_CARDS = 2;
MAX_CARDS = 8;

const main = new Controller();

'use strict';

(function () {
  const root = document.querySelector(':root');  
  const restart = document.querySelector('.button--restart');

  const GRID_GAP = parseInt(getComputedStyle(root).getPropertyValue('--gap'));
  const DURATION = 500;
  const TRANSITION_STYLE = `all 0.1s linear, transform ${DURATION / 1000}s ease`;
  const AREAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const mapAreas = {
    1: `a`,
    2: `b`,
    3: `c`,
    4: `d`,
    5: `e`,
    6: `f`,
    7: `g`,
    8: `h`,
    9: `i`,
    10: `j`,
    11: `k`,
    12: `l`,
    13: `m`,
    14: `n`,
    15: `o`,
    16: `p`
  };

  // Генерирует и возвращает случайное число в пределах заданных параметров
  const getRandomNumber = function (max, min = 0) {
    if (typeof max === 'object') {
      [min, max] = max;
    }
    return Math.round(Math.random() * (max - min) + min);
  }; 

// Сортирует массив методом Фишера-Йетса
  const sortFisherYates = function (arr, isGetNewArray) {
    let j;

    if (isGetNewArray) {
      arr = arr.slice(0);
    }

    for (let i = arr.length - 1; i > 0; i--) {
      j = getRandomNumber(arr.length - 1);
      [arr[j], arr[i]] = [arr[i], arr[j]];
    }

    return arr;
  };

  class BarleyBreak {
    constructor() {
      this.field = document.querySelector('.wrap');
      this.chips = this.field.querySelectorAll('.el');
      this.vacuum = 16;
      this.chipsData = new Map();
      this.directions = {
        top: null,
        right: 15,
        bottom: 12,
        left: null
      };
      this.onFlieldClick = this.onFlieldClick.bind(this);
    };

    makeAreas() {
      return sortFisherYates(AREAS, true);
    };

    getAreaLetter(number) {
      return mapAreas[number];
    };

    isRightPossibly() {
      return Math.ceil((this.vacuum - 1) / 4) === Math.ceil(this.vacuum / 4);
    };

    isLeftPossibly() {
      return Math.ceil((this.vacuum + 1) / 4) === Math.ceil(this.vacuum / 4);
    };

    calculateDiretion() {
      this.directions.top = this.vacuum + 4 <= 16 ? this.vacuum + 4 : null;
      this.directions.bottom = this.vacuum - 4 > 0 ? this.vacuum - 4 : null;
      this.directions.right = this.isRightPossibly() ? this.vacuum - 1 : null;
      this.directions.left = this.isLeftPossibly() ? this.vacuum + 1 : null;
    };

    cleanDirections() {
      for (let it of this.chipsData.values()) {
        it.direction = null;
      }
    };

    writeDirections() {
      this.cleanDirections();

      for (let route in this.directions) {
        for (let it of this.chipsData.values()) {
          if (it.area === this.directions[route]) {
            it.direction = route;
          }
        }
      }
    };

    completeMove(elem) {
      [this.vacuum, this.chipsData.get(elem).area] = [this.chipsData.get(elem).area, this.vacuum];

      setTimeout(() => {
        elem.style.transition = ``;
        elem.style.transform = ``;
        elem.style.gridArea = this.getAreaLetter(this.chipsData.get(elem).area);
      }, DURATION);
    };

    runMove(direction, elem) {
      switch (direction) {
        case `top`:
          elem.style.transition = TRANSITION_STYLE;
          elem.style.transform = `translateY(-${elem.clientHeight + GRID_GAP}px)`;
          this.completeMove(elem);
          this.calculateDiretion();
          this.writeDirections();
          break;

        case `bottom`:
          elem.style.transition = TRANSITION_STYLE;
          elem.style.transform = `translateY(${elem.clientHeight + GRID_GAP}px)`;
          this.completeMove(elem);
          this.calculateDiretion();
          this.writeDirections();
          break;

        case `left`:
          elem.style.transition = TRANSITION_STYLE;
          elem.style.transform = `translateX(-${elem.clientHeight + GRID_GAP}px)`;
          this.completeMove(elem);
          this.calculateDiretion();
          this.writeDirections();
          break;

        case `right`:
          elem.style.transition = TRANSITION_STYLE;
          elem.style.transform = `translateX(${elem.clientHeight + GRID_GAP}px)`;
          this.completeMove(elem);
          this.calculateDiretion();
          this.writeDirections();
          break;
      
        default:
          break;
      }
    };

    onFlieldClick(e) {
      e.preventDefault();

      const chip = e.target.closest('.el');

      if (!chip) {
        return;
      }

      try {
        const chipData = this.chipsData.get(chip);

        if (chipData.direction) {
          this.runMove(chipData.direction, chip);
        }
      } catch (err) {
        alert('Не знаю, как так вышло, но похоже такой фишки нет в нашей базе');
        console.dir(err);
      }
    };

    startGame() {
      this.makeAreas().forEach((it, i) => {
        this.chips[i].style.gridArea = this.getAreaLetter(it);
        this.chipsData.set(this.chips[i], {area: it, direction: null});
      });
      
      this.vacuum = 16;

      this.calculateDiretion();
      this.writeDirections();

      this.field.addEventListener(`click`, this.onFlieldClick);
    };
  };

  const onElementMouseDown = function (e) {
    const chip = e.target.closest('.el');

    if (chip) {
      var start = {
        x: e.clientX,
        y: e.clientY
      };
  
      const onTargetMousemove = function (moveEvt) {
        if (document.elementFromPoint(moveEvt.clientX, moveEvt.clientY) !== chip) {
          onTargetMouseup();
        }
      };
  
      const onTargetMouseup = function () {
        document.removeEventListener('mousemove', onTargetMousemove);
        document.removeEventListener('mouseup', onTargetMouseup);
      };
      
      document.addEventListener('mousemove', onTargetMousemove);
      document.addEventListener('mouseup', onTargetMouseup);
    }
  };

  const barleyBreak = new BarleyBreak();
  barleyBreak.startGame();
  restart.addEventListener(`click`, barleyBreak.startGame.bind(barleyBreak));
})();
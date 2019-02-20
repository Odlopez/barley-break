'use strict';

(function () {
  const root = document.querySelector(':root');  
  const restart = document.querySelector('.button--restart');

  const GRID_GAP = parseInt(getComputedStyle(root).getPropertyValue('--gap'));
  const DURATION = 500;
  const CLICK_TIME = 300;
  const TOUCH_COEFFICIENT = 1.3;
  
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

  /**
   * Генерирует и возвращает случайное число в пределах заданных параметров
   * @param {Number} max 
   * @param {Number} min 
   */
  const getRandomNumber = function (max, min = 0) {
    if (typeof max === 'object') {
      [min, max] = max;
    }
    return Math.round(Math.random() * (max - min) + min);
  }; 

/**
 * Сортирует массив методом Фишера-Йетса
 * @param {Array} arr 
 * @param {Boolean} isGetNewArray 
 */
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
      this.activeChip = null;
      // this.onFlieldClick = this.onFlieldClick.bind(this);
      this.onFlieldMousedown = this.onFlieldMousedown.bind(this);
      this.onFlieldTouchstart = this.onFlieldTouchstart.bind(this);
    };

    /**
     * Возвращает новый отсортированный массив с номерами фишек
     */
    makeAreas() {
      return sortFisherYates(AREAS, true);
    };

    /**
     * Возвращает имя поля, который соответствует номеру поля по порядку
     * @param {Number} number 
     */
    getAreaLetter(number) {
      return mapAreas[number];
    };

    /**
     * Проверяет возможность двигать фишку враво
     */
    isRightPossibly() {
      return Math.ceil((this.vacuum - 1) / 4) === Math.ceil(this.vacuum / 4);
    };

    /**
     * Проверяет возможность двигать фишку враво
     */
    isLeftPossibly() {
      return Math.ceil((this.vacuum + 1) / 4) === Math.ceil(this.vacuum / 4);
    };

    /**
     * Вычисляет номера полей, с которых возможны движения фишек и в ту или иную сторону
     */
    calculateDiretion() {
      this.directions.top = this.vacuum + 4 <= 16 ? this.vacuum + 4 : null;
      this.directions.bottom = this.vacuum - 4 > 0 ? this.vacuum - 4 : null;
      this.directions.right = this.isRightPossibly() ? this.vacuum - 1 : null;
      this.directions.left = this.isLeftPossibly() ? this.vacuum + 1 : null;
    };

    /**
     * Очищает из мапы с данными о фишках направления, в которых могут фишки двигаться
     */
    cleanDirections() {
      for (let it of this.chipsData.values()) {
        it.direction = null;
      }
    };

    /**
     * Записывает новые возможные направления для фишек в мапу с данными
     */
    writeDirections() {
      this.cleanDirections();
      this.calculateDiretion();

      for (let route in this.directions) {
        for (let it of this.chipsData.values()) {
          if (it.area === this.directions[route]) {
            it.direction = route;
          }
        }
      }
    };

    /**
     * В конце движения фишки, меняет местами данные о положения вакуума и сыгравшей фишки, сбрасывает стили для скольжения, сменяет grid-позицию в области
     * @param {Node} elem 
     */
    completeMove(elem, duration) {
      [this.vacuum, this.chipsData.get(elem).area] = [this.chipsData.get(elem).area, this.vacuum];

      setTimeout(() => {
        elem.style.transition = ``;
        elem.style.transform = ``;
        elem.style.gridArea = this.getAreaLetter(this.chipsData.get(elem).area);
      }, duration);
    };

    /**
     * Запускает плавное перемещение фишки
     * @param {String} direction 
     * @param {Node} elem 
     */
    runMove(direction, elem, duration = DURATION, distance = elem.clientHeight + GRID_GAP, isReverse = false) {
      this.activeChip = elem;
      elem.style.transition = `all 0.1s linear, transform ${(duration / 1000).toFixed(2)}s ease`;
      switch (direction) {
        case `top`:
          elem.style.transform = `translateY(-${distance}px)`;
          break;

        case `bottom`:
          elem.style.transform = `translateY(${distance}px)`;
          break;

        case `left`:
          elem.style.transform = `translateX(-${distance}px)`;
          break;

        case `right`:
          elem.style.transform = `translateX(${distance}px)`;
          break;
      
        default:
          break;
      }
      
      if (!isReverse) {
        this.completeMove(elem, duration);
        this.writeDirections();
      }

      setTimeout(() => {
        this.activeChip = null;
      }, duration);
    };

    /**
     * Колбэк для события нажатия мышки по игровому полю
     * @param {Event} e 
     */
    onFlieldMousedown(e) {
      e.preventDefault();

      const self = this;
      const chip = e.target.closest('.el');
      const startTime = performance.now();
      let bias = 0;
      let reverseRoute;
      let chipData;
      let factor;

      if (!chip || this.activeChip === chip) {
        return;
      }

       try {
        chipData = this.chipsData.get(chip);

        if (!chipData.direction) {
          return;
        }
      } catch (err) {
        alert('Не знаю, как так вышло, но похоже такой фишки нет в нашей базе');
        console.dir(err);
      }

      const start = {
        x: chip.offsetLeft,
        y: chip.offsetTop
      };

      const end = {
        x: chip.offsetLeft,
        y: chip.offsetTop
      };

      const shift = {
        x: e.clientX - start.x,
        y: e.clientY - start.y
      };

      const onChipMousemove = function (moveEvt) {
        // определяем на какое свойство события нам следует смотреть: movementY или movementX
        const direction = chipData.direction === 'top' || chipData.direction === 'bottom' ? 'movementY' : 'movementX';

        // определяем какое свойство transform нам поднадобится
        let translateProperty = direction === 'movementX' ? 'translateX' : 'translateY';

        // определяем коэффециент для математических операций с координатами смещения
        factor = chipData.direction === 'top' || chipData.direction === 'left' ? -1 : 1;


        if (direction === 'movementX') {
          // определяем обратное направление движения
          reverseRoute = (moveEvt.clientX - shift.x) * factor > end.x * factor && factor > 0 ? 'right' : 'left';

          end.x = moveEvt.clientX - shift.x;
          bias = end.x - start.x;
        } else {
          reverseRoute = (moveEvt.clientY - shift.y) * factor > end.y * factor && factor > 0 ? 'bottom' : 'top';
          end.y = moveEvt.clientY - shift.y;
          bias = end.y - start.y;
        }
        
        // Если фишка заезжает слишком далеко вперед или слишком далеко назад - прерываем функцию
        if (Math.abs(bias) > chip.clientHeight + GRID_GAP || bias * factor <= 0) {
          return;
        }

        chip.style.transform = `${translateProperty}(${bias}px)`;
      }

      const onChipMouseup = function () {
        // определяем смещение фишки не от положения мышки, а от свойства transform на фишке
        bias = parseInt(chip.style.transform.slice(11)) || 0;

        // вычисляем время анимации движения мышки пропорционально оставшегося пути
        const restDuration = (1 - Math.abs(bias) / (chip.clientHeight + GRID_GAP)) * DURATION;

        // Если передвинули фишку назад и при этом назад ей лететь ближе, чем вперед, и событие длилось дольше, чем CLICK_TIME, тогда отменяем движение вперед, иначе - обычный запуск движения фишки
        if (reverseRoute !== chipData.direction && bias * factor < (chip.clientHeight + GRID_GAP) / 2 && performance.now() - startTime > CLICK_TIME) {
          self.runMove(reverseRoute, chip, restDuration, 0, true);
        } else {
          self.runMove(chipData.direction, chip, restDuration);
        }

        document.removeEventListener('mousemove', onChipMousemove);
        document.removeEventListener('mouseup', onChipMouseup);
      };
      
      document.addEventListener('mousemove', onChipMousemove);
      document.addEventListener('mouseup', onChipMouseup);
    };

    /**
     * Колбэк для события touch по игровому полю
     * @param {Event} e 
     */
    onFlieldTouchstart(e) {
      e.preventDefault();

      const self = this;
      const chip = e.target.closest('.el');
      const startTime = performance.now();
      let bias = 0;
      let reverseRoute;
      let chipData;
      let factor;

      if (!chip || this.activeChip === chip) {
        return;
      }

       try {
        chipData = this.chipsData.get(chip);

        if (!chipData.direction) {
          return;
        }
      } catch (err) {
        alert('Не знаю, как так вышло, но похоже такой фишки нет в нашей базе');
        console.dir(err);
      }

      const start = {
        x: chip.offsetLeft,
        y: chip.offsetTop
      };

      const end = {
        x: chip.offsetLeft,
        y: chip.offsetTop
      };

      const shift = {
        x: e.changedTouches[0].pageX - start.x,
        y: e.changedTouches[0].pageY - start.y
      };

      const onChipTouchmove = function (moveEvt) {
        const direction = chipData.direction === 'top' || chipData.direction === 'bottom' ? 'movementY' : 'movementX';
        let translateProperty = direction === 'movementX' ? 'translateX' : 'translateY';
        factor = chipData.direction === 'top' || chipData.direction === 'left' ? -1 : 1;
      
        if (direction === 'movementX') {
          reverseRoute = (moveEvt.changedTouches[0].pageX - shift.x) * factor > end.x * factor && factor > 0 ? 'right' : 'left';
          end.x = moveEvt.changedTouches[0].pageX - shift.x;
          bias = end.x - start.x;
        } else {
          reverseRoute = (moveEvt.changedTouches[0].pageY - shift.y) * factor > end.y * factor && factor > 0 ? 'bottom' : 'top';
          end.y = moveEvt.changedTouches[0].pageY - shift.y;
          bias = end.y - start.y;
        }

        if (Math.abs(bias) > chip.clientHeight + GRID_GAP || bias * factor <= 0) {
          return;
        }

        chip.style.transform = `${translateProperty}(${bias}px)`;
      }

      const onChipTouchend = function () {
        bias = parseInt(chip.style.transform.slice(11)) || 0;

        const restDuration = (1 - Math.abs(bias) / (chip.clientHeight + GRID_GAP)) * DURATION;


        if (reverseRoute !== chipData.direction && bias * factor < (chip.clientHeight + GRID_GAP) / 1.25 && performance.now() - startTime > CLICK_TIME) {
          self.runMove(reverseRoute, chip, restDuration / TOUCH_COEFFICIENT, 0, true);
        } else {
          self.runMove(chipData.direction, chip, restDuration / TOUCH_COEFFICIENT);
        }

        document.removeEventListener('touchmove', onChipTouchmove);
        document.removeEventListener('touchend', onChipTouchend);
      };
      
      document.addEventListener('touchmove', onChipTouchmove);
      document.addEventListener('touchend', onChipTouchend);
    };

    /**
     * Перемешивает фишки для начала игры, вешает обработчик на поле, вычисляет возможные направления движения фишек
     */
    startGame() {
      this.makeAreas().forEach((it, i) => {
        this.chips[i].style.gridArea = this.getAreaLetter(it);
        this.chipsData.set(this.chips[i], {area: it, direction: null});
      });
      
      this.vacuum = 16;
      this.writeDirections();
      this.field.addEventListener(`mousedown`, this.onFlieldMousedown);
      this.field.addEventListener(`touchstart`, this.onFlieldTouchstart);
    };
  };

  const barleyBreak = new BarleyBreak();
  barleyBreak.startGame();
  restart.addEventListener(`click`, barleyBreak.startGame.bind(barleyBreak));
})();
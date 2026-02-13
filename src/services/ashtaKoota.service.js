import { NAKSHATRAS, RASHIS, VARNA, VASHYA, RASHI_LORD } from "../utils/constants.js";
import YONI_MATRIX from "../utils/yoniMatrix.js";
import FRIENDSHIP from "../utils/grahaMaitri.js";

class AshtaKoota {

  static calculate(boy, girl) {
    const scores = {
      varna: this.varna(boy, girl),
      vashya: this.vashya(boy, girl),
      tara: this.tara(boy, girl),
      yoni: this.yoni(boy, girl),
      grahaMaitri: this.grahaMaitri(boy, girl),
      gana: this.gana(boy, girl),
      bhakoot: this.bhakoot(boy, girl),
      nadi: this.nadi(boy, girl)
    };

    scores.total = Object.values(scores).reduce((a,b)=>a+b,0);
    return scores;
  }

  static varna(boy, girl) {
    return VARNA[boy.rashi] >= VARNA[girl.rashi] ? 1 : 0;
  }

  static vashya(boy, girl) {
    return VASHYA[boy.rashi] === VASHYA[girl.rashi] ? 2 : 1;
  }

  static tara(boy, girl) {
    const b = NAKSHATRAS.indexOf(boy.nakshatra);
    const g = NAKSHATRAS.indexOf(girl.nakshatra);
    const diff = (g - b + 27) % 27;
    const tara = diff % 9;
    return tara === 0 ? 3 : 1;
  }

  static yoni(boy, girl) {
    const y1 = boy.yoni;
    const y2 = girl.yoni;
    return YONI_MATRIX[y1]?.[y2] ?? 2;
  }

  static grahaMaitri(boy, girl) {
    const lord1 = RASHI_LORD[boy.rashi];
    const lord2 = RASHI_LORD[girl.rashi];

    if (lord1 === lord2) return 5;
    if (FRIENDSHIP[lord1]?.includes(lord2)) return 4;
    return 2;
  }

  static gana(boy, girl) {
    const matrix = {
      Deva:{Deva:6,Manushya:5,Rakshasa:1},
      Manushya:{Deva:5,Manushya:6,Rakshasa:3},
      Rakshasa:{Deva:1,Manushya:3,Rakshasa:6}
    };
    return matrix[boy.gan]?.[girl.gan] ?? 0;
  }

  static bhakoot(boy, girl) {
    const b = RASHIS.indexOf(boy.rashi);
    const g = RASHIS.indexOf(girl.rashi);
    const diff = Math.abs(b-g);
    if ([6,8].includes(diff)) return 0;
    return 7;
  }

  static nadi(boy, girl) {
    return boy.nadi === girl.nadi ? 0 : 8;
  }
}

export default AshtaKoota;

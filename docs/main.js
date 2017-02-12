(() => {
  "use strict";

  const geti = id => document.getElementById(id),
    _ = new Library(),
    keys = ["c", "cis", "d", "es", "e", "f", "fis", "g", "as", "a", "b", "h"].map(nm => geti("key_" + nm)),
    desc = geti('description'),
    play_button = geti('play'),
    next_button = geti('next'),
    result_table = geti('result'),
    enviro = flock.init(),
    defaultSynth = freq => ({
      synthDef: {
        id: "osc",
        ugen: "flock.ugen.sinOsc",
        freq: freq,
        mul: {
          id: "control",
          ugen: "flock.ugen.line",
          start: 0.25,
          end: 0,
          duration: 1.0
        }
      }
    });

  let oscs = [],
    answer,
    you = _.repeat(false, 12),
    questionNum = 0,
    results = _.repeat({ real: [], you: [] }, 12);

  function setKeyboardColor(y) {
    keys.forEach((key, i) => {
      key.style.backgroundColor = (new HSLColor(i * 30, 100, y[i] ? 80 : 20)).toString();
      key.style.color = (new HSLColor(i * 30, 100, y[i] ? 20 : 80)).toString();
    });
  }

  function getFreqFromNoteNumber(num, freq_A) {
    let recur = (r, n) => (n == 69) ? r : ((n > 69) ? recur(r * 1.05946309436, n - 1) : recur(r * 0.94387431268, n + 1));
    return Math.round(recur(freq_A, num) * 100) / 100;
  }

  function genQuestion(harmony) {
    let pitchClasses = _.pipe(_.range(0, 12), [_.shuffle], [(a, n) => a.slice(0, n), harmony]),
      freqs = pitchClasses.map(p => getFreqFromNoteNumber(p + 12 * Math.floor(Math.random() * 3 + 4), 440)),
      ans = _.range(0, 12).map(i => pitchClasses.includes(i) ? true : false);
    return {
      frequencies: freqs,
      answer: ans
    };
  }

  function getNoteNameFromArray(arr) {
    return arr.map((e, i) => {
      if (e) {
        switch (i) {
        case 0:
          return "C";
        case 1:
          return "C♯";
        case 2:
          return "D";
        case 3:
          return "E♭";
        case 4:
          return "E";
        case 5:
          return "F";
        case 6:
          return "F♯";
        case 7:
          return "G";
        case 8:
          return "A♭";
        case 9:
          return "A";
        case 10:
          return "B♭";
        case 11:
          return "B";
        }
      } else {
        return false;
      }
    }).filter(e => e).join('<br>');
  }

  function createTableCellElement(type, content) {
    let cell = document.createElement(type);
    cell.innerHTML = content;
    return cell;
  }

  function showResult(res, disp) {
    let table = document.createElement('table'),
      qname_row = table.insertRow(),
      right_row = table.insertRow(),
      your_row = table.insertRow(),
      tf_row = table.insertRow();
    qname_row.appendChild(createTableCellElement('th', "問題番号"));
    right_row.appendChild(createTableCellElement('td', "正答"));
    your_row.appendChild(createTableCellElement('td', "あなたの答え"));
    tf_row.appendChild(createTableCellElement('td', "正誤"));
    _.range(0, 12).map(i => [
      createTableCellElement('th', (i + 1).toString(10)),
      createTableCellElement('td', getNoteNameFromArray(res[i].real)),
      createTableCellElement('td', getNoteNameFromArray(res[i].you)),
      createTableCellElement('td', res[i].real.every((ele, idx) => ele === res[i].you[idx]) ? "GOOD" : "BAD")
    ]).forEach(a => {
      qname_row.appendChild(a[0]);
      right_row.appendChild(a[1]);
      your_row.appendChild(a[2]);
      tf_row.appendChild(a[3]);
    });
    table.border = 1;
    disp.appendChild(table);
  }

  window.onload = () => {
    let q = genQuestion(1);
    setKeyboardColor(you);
    keys.forEach((key, i) => {
      key.onclick = () => {
        you[i] = !you[i];
        setKeyboardColor(you);
      };
    });
    answer = q.answer;
    oscs = q.frequencies.map(f => defaultSynth(f)).map(syn => flock.synth(syn));
    desc.innerHTML = "(1/12) 音を聴いて音名を答えよ。<br>音は[PLAY]を押すと再生されます。<br>聞こえた音を<span style='color: red;'>全て</span>選び，[NEXT]で答えを確定させてください。";
  };

  play_button.onclick = () => {
    enviro.stop();
    oscs.forEach(syn => {
      syn.set("control.duration", 1.0);
    });
    enviro.start();
  };
  next_button.onclick = () => {
    let q;

    results[questionNum] = {
      real: answer,
      you: you
    };

    enviro.stop();
    you = _.repeat(false, 12);
    setKeyboardColor(you);
    questionNum++;
    if (questionNum >= 12) {
      desc.innerHTML = "終了です。";
      showResult(results, result_table);
      next_button.onclick = () => null;
    } else {
      q = genQuestion((questionNum < 6) ? 1 : ((questionNum < 10) ? 2 : 3));
      answer = q.answer;
      oscs = q.frequencies.map(f => defaultSynth(f)).map(syn => flock.synth(syn));
      desc.innerHTML = "(" + (questionNum + 1).toString(10) + "/12) 音を聴いて音名を答えよ。";
    }
  };

})();

import { execSync } from "child_process";
import path from "path";

export default class ADB {
  static KEYCODE_0 = 0;
  static KEYCODE_SOFT_LEFT = 1;
  static KEYCODE_SOFT_RIGHT = 2;
  static KEYCODE_HOME = 3;
  static KEYCODE_BACK = 4;
  static KEYCODE_CALL = 5;
  static KEYCODE_ENDCALL = 6;
  static KEYCODE_0_ = 7;
  static KEYCODE_1 = 8;
  static KEYCODE_2 = 9;
  static KEYCODE_3 = 10;
  static KEYCODE_4 = 11;
  static KEYCODE_5 = 12;
  static KEYCODE_6 = 13;
  static KEYCODE_7 = 14;
  static KEYCODE_8 = 0xf;
  static KEYCODE_9 = 0x10;
  static KEYCODE_STAR = 17;
  static KEYCODE_POUND = 18;
  static KEYCODE_DPAD_UP = 19;
  static KEYCODE_DPAD_DOWN = 20;
  static KEYCODE_DPAD_LEFT = 21;
  static KEYCODE_DPAD_RIGHT = 22;
  static KEYCODE_DPAD_CENTER = 23;
  static KEYCODE_VOLUME_UP = 24;
  static KEYCODE_VOLUME_DOWN = 25;
  static KEYCODE_POWER = 26;
  static KEYCODE_CAMERA = 27;
  static KEYCODE_CLEAR = 28;
  static KEYCODE_A = 29;
  static KEYCODE_B = 30;
  static KEYCODE_C = 0x1f;
  static KEYCODE_D = 0x20;
  static KEYCODE_E = 33;
  static KEYCODE_F = 34;
  static KEYCODE_G = 35;
  static KEYCODE_H = 36;
  static KEYCODE_I = 37;
  static KEYCODE_J = 38;
  static KEYCODE_K = 39;
  static KEYCODE_L = 40;
  static KEYCODE_M = 41;
  static KEYCODE_N = 42;
  static KEYCODE_O = 43;
  static KEYCODE_P = 44;
  static KEYCODE_Q = 45;
  static KEYCODE_R = 46;
  static KEYCODE_S = 47;
  static KEYCODE_T = 48;
  static KEYCODE_U = 49;
  static KEYCODE_V = 50;
  static KEYCODE_W = 51;
  static KEYCODE_X = 52;
  static KEYCODE_Y = 53;
  static KEYCODE_Z = 54;
  static KEYCODE_COMMA = 55;
  static KEYCODE_PERIOD = 56;
  static KEYCODE_ALT_LEFT = 57;
  static KEYCODE_ALT_RIGHT = 58;
  static KEYCODE_SHIFT_LEFT = 59;
  static KEYCODE_SHIFT_RIGHT = 60;
  static KEYCODE_TAB = 61;
  static KEYCODE_SPACE = 62;
  static KEYCODE_SYM = 0x3f;
  static KEYCODE_EXPLORER = 0x40;
  static KEYCODE_ENVELOPE = 65;
  static KEYCODE_ENTER = 66;
  static KEYCODE_DEL = 67;
  static KEYCODE_GRAVE = 68;
  static KEYCODE_MINUS = 69;
  static KEYCODE_EQUALS = 70;
  static KEYCODE_LEFT_BRACKET = 71;
  static KEYCODE_RIGHT_BRACKET = 72;
  static KEYCODE_BACKSLASH = 73;
  static KEYCODE_SEMICOLON = 74;
  static KEYCODE_APOSTROPHE = 75;
  static KEYCODE_SLASH = 76;
  static KEYCODE_AT = 77;
  static KEYCODE_NUM = 78;
  static KEYCODE_HEADSETHOOK = 79;
  static KEYCODE_FOCUS = 80;
  static KEYCODE_PLUS = 81;
  static KEYCODE_MENU = 82;
  static KEYCODE_NOTIFICATION = 83;
  static KEYCODE_APP_SWITCH = 187;
  static KEYCODE_CTRL_A = 109;

  static execEmulator(emulator, command) {
    const shell = `ldconsole adb --name ${emulator} --command "${command}"`;

    console.log(shell);
    const buffer = execSync(shell);
    console.log(buffer.toString("utf-8"));
  }

  static runProfile(emulator) {
    execSync(`ldconsole launch --name ${emulator}`);
  }

  static stopProfile(emulator) {
    execSync(`ldconsole quit --name ${emulator}`);
  }

  static isRunningProfile(emulator) {
    const buffer = execSync(`ldconsole isrunning --name ${emulator}`);
    return buffer.toString("utf-8") === "running" ? true : false;
  }

  static GetDevices() {
    const listdevice = [];
    const devices = execSync("ldconsole list")
      .toString()
      .replace("List of devices attached\r\n", "")
      .replace("'", "")
      .replace("List of devices attached ", "")
      .split("\r\n");
    for (const device of devices) {
      if (device !== "") {
        listdevice.push(device.split("\tdevice")[0]);
      }
    }
    return listdevice;
  }

  static InstallApp(emulator, path) {
    this.execEmulator(emulator, `install ${path}`);
  }

  static OpenApp(emulator, packageName) {
    this.execEmulator(
      emulator,
      `shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`
    );
  }

  static StopApp(emulator, packageName) {
    this.execEmulator(emulator, `shell am force-stop ${packageName}`);
  }

  static PushFile(emulator, pathpc, pathphone) {
    this.execEmulator(emulator, `push ${pathpc} ${pathphone}`);
  }

  static KeyEvent(emulator, key) {
    this.execEmulator(emulator, `shell input keyevent ${key}`);
  }

  static InputText(emulator, text) {
    if (!text) return;
    const encodedText = Buffer.from(text, "utf-8").toString("base64").slice(1);
    this.execEmulator(
      emulator,
      `shell am broadcast -a ADB_INPUT_B64 --es msg ${encodedText}`
    );
  }

  static Swipe(emulator, x1, y1, x2, y2) {
    this.execEmulator(
      emulator,
      `shell input touchscreen swipe ${x1} ${y1} ${x2} ${y2}`
    );
  }

  static Pull(emulator, path) {
    this.execEmulator(emulator, `pull ${path}`);
  }

  static Push(emulator, path, path1) {
    this.execEmulator(emulator, `push ${path} ${path1}`);
  }

  static Click(emulator, x, y) {
    this.execEmulator(
      emulator,
      `shell input tap ${parseInt(x)} ${parseInt(y)}`
    );
  }

  static FindImg(emulator, target_pic_name) {
    try {
      const img = cv2.imread(target_pic_name);
      const img2 = cv2.imread(this.ScreenCapture(emulator));
      const w = img.shape[1],
        h = img.shape[0];
      const result = cv2.matchTemplate(img, img2, cv2.TM_CCOEFF_NORMED);
      const location = numpy.where(result >= 0.8);
      const data = Array.from({ length: location[0].length }, (_, i) => [
        location[1][i],
        location[0][i],
      ]);
      const isMatch = data.length > 0;
      if (isMatch) {
        const [x, y] = data[0];
        return [x + Math.floor(w / 2), y + Math.floor(h / 2)];
      } else {
        return [false, false];
      }
    } catch (error) {
      return [false, false];
    }
  }

  static TapImg(emulator, img_path) {
    const [x, y] = this.FindImg(emulator, img_path);
    if (x !== false) {
      this.Click(emulator, x, y);
      return true;
    } else {
      return false;
    }
  }

  static DeleteCache(emulator, packageName) {
    this.execEmulator(emulator, `shell pm clear ${packageName}`);
  }

  static Paste(emulator) {
    this.execEmulator(emulator, `shell input keyevent 279`);
  }

  static DumXml(emulator) {
    const name = emulator.includes(":")
      ? emulator.replace(":", "").replace(".", "")
      : emulator;
    this.execEmulator(emulator, `shell uiautomator dump`);

    this.execEmulator(emulator, `pull /sdcard/window_dump.xml ${name}.xml`);
    return `${name}.xml`;
  }

  static GetPosXml(emulator, element) {
    const pos = [];
    try {
      const path = this.DumXml(emulator);
      if (!fs.existsSync(path)) return pos;
      const xmlData = fs.readFileSync(path, "utf-8");
      const tree = html.parse(xmlData);
      for (const bound of tree.xpath(element)) {
        const gg = bound.attrib["bounds"]
          .split("][")[0]
          .replace("[", "")
          .split(",");
        pos.push([parseInt(gg[0]), parseInt(gg[1])]);
      }
      return pos;
    } catch (error) {
      return pos;
    }
  }

  static TapXml(emulator, xpath) {
    const pos = this.GetPosXml(emulator, xpath);
    if (pos.length !== 0) {
      const [x, y] = pos[pos.length - 1];
      this.Click(emulator, x, y);
    }
  }
  // Define other methods similarly
}

// module.exports = { ADB };

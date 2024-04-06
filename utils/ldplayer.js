import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import xml2js from "xml2js";
import {
  delay,
  delayRandom,
  findNodesByResourceId,
  getPosElement,
  getPosFromResourceId,
  getRandomNumber,
  logg,
  trackUserName,
} from "./helper.js";

export default class LDPlayer {
  constructor() {
    this.backupFilepath = "E:\\BACKUP_LD_EBAY";
    this.pathLD = "D:\\LDPlayer\\LDPlayer9";
    this.local = "";
  }

  info(param, NameOrId, ebayInfo) {
    const devices = this.getDevices2();
    console.log(devices);
    this.ebayInfo = ebayInfo;
    this.customName = devices.find(
      (dv) => Number(dv.index) === Number(NameOrId)
    ).name;
    this.param = param;
    this.NameOrId = NameOrId;
    this.get();
  }

  executeLD(shell) {
    const buffer = execSync(`dnconsole ${shell}`, {
      cwd: this.pathLD,
      windowsHide: true,
      encoding: "utf-8",
    });

    // console.log(shell, buffer.toString("utf-8"));
    return buffer.toString("utf-8");
  }

  connect() {
    const check = this.adbLd(`connect ${this.local}`);
    console.log(check);
    if (!check.includes("connected")) {
      return this.connect();
    }
  }

  get() {
    const port = 5555 + parseInt(this.NameOrId);
    this.local = `127.0.0.1:${port}`;
  }

  changeProxy(proxy) {
    this.adbLd(`shell settings put global http_proxy ${proxy}`);
  }

  removeProxy() {
    this.changeProxy(":0");
  }

  dumXml() {
    const resourcesDir = path.join(process.cwd(), "resources");
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir);
    }
    this.adbLd("shell uiautomator dump");
    const filePath = path.join(
      resourcesDir,
      `window_dump_${this.NameOrId}.xml`
    );
    this.adbLd(`pull /sdcard/window_dump.xml "${filePath}"`);
    return filePath;
  }

  findXml(element, file, index = 0) {
    try {
      const tree = parse(file).xpath(element);
    } catch (error) {
      return [[], null];
    }
    const pos = [];
    for (const bound of tree) {
      const gg = bound.attrib["bounds"]
        .split("][")[0]
        .replace("[", "")
        .split(",");
      pos.push([parseInt(gg[0]), parseInt(gg[1])]);
    }
    return [pos, tree.length === 0 ? null : tree[index]];
  }

  getPos({ key, value }) {
    return new Promise((resolve, reject) => {
      const filePath = this.dumXml();
      const fileContent = fs.readFileSync(filePath, "utf8");
      const pos = getPosElement(fileContent, key, value);
      resolve(pos);
    });
  }

  getPosXml(element) {
    const filePath = this.dumXml();
    const fileContent = fs.readFileSync(filePath, "utf8");
    const pos = getPosFromResourceId(fileContent, element);
    return pos;
  }

  getUsernameAccount(element) {
    let foundNodes;
    const filePath = this.dumXml();
    const fileContent = fs.readFileSync(filePath, "utf8");

    xml2js.parseString(fileContent, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }
      const nodes = findNodesByResourceId(result.hierarchy.node, element);
      foundNodes = nodes;
    });

    const username = trackUserName(foundNodes);

    return username;
  }

  async tapXml(xpath, index = 0) {
    logg(`Click xml ${xpath} lần thứ ${index + 1}`);
    const pos = await this.getPos({ key: "resource-id", value: xpath });
    if (pos && !isNaN(pos.x1)) {
      logg(`click pos ${JSON.stringify(pos)}`);
      this.click(
        getRandomNumber(pos.x1 + 40, pos.x2 - 40),
        getRandomNumber(pos.y1 + 10, pos.y2 - 10)
      );
    } else {
      if (index < 5) return this.tapXml(xpath, index + 1);
      else {
        throw new Error(`Click xml ${xpath} không thành công`);
      }
    }
  }

  click(x, y) {
    return this.adbLd(`shell input tap ${x} ${y}`);
  }

  async adbInputTextSlow(text) {
    for (let i = 0; i < text.length; i++) {
      const delayNumber = getRandomNumber(0, 30);
      const char = text.charAt(i);
      this.adbLd(`shell input text '${char}'`);
      await delay(delayNumber, true);
    }
  }

  async sendText(text, VN = false) {
    if (VN) {
      text = Buffer.from(text).toString("base64");
      this.adbLd(`shell ime set com.android.adbkeyboard/.AdbIME`);
      this.adbLd(`shell am broadcast -a ADB_INPUT_B64 --es msg ${text}`);
    } else {
      await this.adbInputTextSlow(text);
    }
  }

  swipe(x1, y1, x2, y2, delay = 0) {
    this.adbLd(
      `shell input touchscreen swipe ${x1} ${y1} ${x2} ${y2} ${delay}`
    );
  }

  pushImg(path, filename) {
    this.adbLd(`root`);
    console.log(this.adbLd(`push ${path} /sdcard/Download/${filename}`));
  }

  clearDownload() {
    this.adbLd(`root`);
    console.log(this.adbLd(`shell rm /sdcard/Download/*`));
  }

  screenCapture() {
    const resourcesDir = path.join(__dirname, "resources");
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir);
    }
    const filePath = path.join(resourcesDir, `screenshot_${this.NameOrId}.png`);
    this.adbLd(
      `shell screencap /sdcard/Download/1_screenshot_${this.NameOrId}.png`
    );
    this.adbLd(
      `pull /sdcard/Download/1_screenshot_${this.NameOrId}.png "${filePath}"`
    );
    return filePath;
  }

  findImg(target_pic_name, where = 0.8) {
    const img = cv2.imread(target_pic_name);
    const img2 = cv2.imread(this.screenCapture());
    const w = img.cols;
    const h = img.rows;
    const result = cv2.matchTemplate(img, img2, cv2.TM_CCOEFF_NORMED);
    const location = cv2.findNonZero(result >= where);
    const data = location.map((pt) => [pt.x, pt.y]);
    const is_match = data.length > 0;
    if (is_match) {
      const [x, y] = data[0];
      return [x + Math.floor(w / 2), y + Math.floor(h / 2)];
    } else {
      return [false, false];
    }
  }

  tapImageSrc(src, click = true) {
    return this.tapImagePath(this.screenCapture(), src, click);
  }

  tapImagePath(bg, src, click = true) {
    const img = cv2.imdecode(src, cv2.IMREAD_COLOR);
    const img2 = cv2.imread(bg);
    const w = img.cols;
    const h = img.rows;
    const result = cv2.matchTemplate(img, img2, cv2.TM_CCOEFF_NORMED);
    const location = cv2.findNonZero(result >= 0.8);
    const data = location.map((pt) => [pt.x, pt.y]);
    const is_match = data.length > 0;
    if (is_match) {
      const [x, y] = data[0];
      if (click) this.click(x + Math.floor(w / 2), y + Math.floor(h / 2));
      return [x, y];
    } else {
      return [false, false];
    }
  }

  tapImage(pathImg) {
    const [x, y] = this.findImg(pathImg);
    if (x) {
      this.click(x, y);
    }
  }

  keyEvent(key) {
    this.adbLd(`shell input keyevent ${key}`);
  }

  deleteCache(pkg) {
    return this.adbLd(`shell pm clear ${pkg}`);
  }

  openLink(link, pkg = "") {
    this.adbLd(
      `shell am start -a android.intent.action.VIEW -d "${link}" ${pkg}`
    );
  }

  changeFolderPicture(path) {
    const filePath = path.join(
      this.pathLD,
      `vms/config/leidian${this.NameOrId}.config`
    );
    let data = fs.readFileSync(filePath, "utf-8");
    const pathOld = data
      .split('"statusSettings.sharedPictures": "')[1]
      .split('"')[0];
    data = data.replace(pathOld, path.replace(/\\/g, "/"));
    fs.writeFileSync(filePath, data, "utf-8");
  }

  openTikTokLite() {
    console.log(
      this.adbLd(
        "shell am start -a android.intent.action.VIEW -d snssdk1233://notification com.zhiliaoapp.musically.go"
      )
    );
  }

  changeInfo() {
    const model = [
      "Samsung_E2100B",
      "Samsung_B5702",
      "Samsung_B520",
      "Samsung_C5212",
      "Samsung_W259_Duos",
      "Samsung_SCH-W699",
      "Samsung_S3030_Tobi",
      "Samsung_W299_Duos",
      "Samsung_S9402_Ego",
      "Samsung_U810_Renown",
      "Samsung_i770_Saga",
      "Samsung_A867_Eternity",
      "Samsung_A777",
      "Samsung_T919_Behold",
      "Samsung_T459_Gravity",
      "Samsung_E2510",
      "Samsung_T219",
      "Samsung_E1410",
      "Samsung_T119",
      "Samsung_E1117",
      "Samsung_i907_Epix",
      "Samsung_E1110",
      "Samsung_C6620",
      "Samsung_A767_Propel",
      "Samsung_C510",
      "Samsung_M3200_Beat_s",
      "Samsung_S3600",
      "Samsung_M7500_Emporio_Armani",
      "Samsung_F270_Beat",
      "Samsung_i7110",
      "Samsung_F275",
      "Samsung_M8800_Pixon",
      "Samsung_T339",
      "Samsung_T229",
      "Samsung_A637",
      "Samsung_A837_Rugby",
      "Samsung_B210",
      "Samsung_A237",
      "Samsung_B320",
      "Samsung_M3510_Beat_b",
      "Samsung_P270",
      "Samsung_M200",
      "Samsung_F268",
      "Samsung_B2700",
      "Samsung_T109",
      "Samsung_E200_ECO",
      "Samsung_D980",
      "Samsung_B510",
      "Samsung_E215",
      "Samsung_B130",
      "Samsung_i8510_INNOV8",
      "Samsung_S7330",
      "Samsung_i740",
      "Asus_PadFone_2",
      "ZTE_Blade_V",
      "HTC_EndeavorU",
      "Samsung_GT-P3100",
      "Asus_ME173X",
      "Sony_C5302",
      "Samsung_E200_ECO",
      "Samsung_B320",
    ][Math.floor(Math.random() * 60)].replace(/ /g, "_");
    const dauso = [
      "1951",
      "1405",
      "1908",
      "1508",
      "1539",
      "1234",
      "1509",
      "1210",
      "1818",
      "1810",
      "1920",
      "1787",
    ];
    this.changeProperty(
      `--cpu 4 --memory 4096 --manufacturer ${
        model.split("_")[0]
      } --model ${model} --resolution 540,960,240 --imei auto --pnumber +"${
        dauso[Math.floor(Math.random() * dauso.length)]
      }${
        Math.floor(Math.random() * 8999999) + 1000000
      }" --androidid auto --mac auto --simserial auto --imsi auto`
    );
  }

  start() {
    this.executeLD(`launch --${this.param} ${this.NameOrId}`);
  }

  backup(backupFilepath, oldPath) {
    const output = `${backupFilepath ? backupFilepath : this.backupFilepath}\\${
      this.customName
    }.ldbk`;
    if (fs.existsSync(`${oldPath}\\${this.customName}.ldbk`)) {
      fs.unlinkSync(`${oldPath}\\${this.customName}.ldbk`);
      console.log(`Đã xóa tệp cũ: ${oldPath}\\${this.customName}.ldbk`);
    }
    if (fs.existsSync(output)) {
      fs.unlinkSync(output);
      console.log(`Đã xóa tệp cũ: ${output}`);
    }

    // backup  <--name mnq_name | --index mnq_idx> --file <filepath>
    this.executeLD(
      `backup --${this.param} ${this.NameOrId} --file "${output}"`
    );
  }

  openApp(pkg_Name) {
    this.executeLD(
      `launchex --${this.param} ${this.NameOrId} --packagename ${pkg_Name}`
    );
  }

  grant(pkg, permission) {
    this.adbLd(`shell pm grant ${pkg} android.permission.${permission}`);
  }

  stopApp(pkg_Name) {
    this.executeLD(
      `killapp --${this.param} ${this.NameOrId} --packagename ${pkg_Name}`
    );
  }

  close() {
    this.executeLD(`quit --${this.param} ${this.NameOrId}`);
  }

  closeAll() {
    this.executeLD("quitall");
  }

  reboot() {
    this.executeLD(`reboot --${this.param} ${this.NameOrId}`);
  }

  create(Name) {
    this.executeLD(`add --name ${Name}`);
  }

  restore(Name, filePath) {
    console.log(this.executeLD(`restore --name ${Name} --file ${filePath}`));
  }

  copy(Name, From_NameOrId) {
    this.executeLD(`copy --name ${Name} --from ${From_NameOrId}`);
  }

  remove(param, name) {
    this.executeLD(`remove --${param || this.param} ${name || this.NameOrId}`);
  }

  rename(title_new) {
    this.executeLD(
      `rename --${this.param} ${this.NameOrId} --title ${title_new}`
    );
    this.customName = title_new;
  }

  installAppFile(path) {
    this.adbLd(`-e install ${path}`);
  }

  checkInstalled(pkg) {
    return this.adbLd("shell pm list packages").includes(pkg);
  }

  installAppPackage(pkg_Name) {
    this.executeLD(
      `installapp --${this.param} ${this.NameOrId} --packagename ${pkg_Name}`
    );
  }

  uninstallApp(pkg_Name) {
    this.executeLD(
      `uninstallapp --${this.param} ${this.NameOrId} --packagename ${pkg_Name}`
    );
  }

  runApp(pkg_Name) {
    this.executeLD(
      `runapp --${this.param} ${this.NameOrId} --packagename ${pkg_Name}`
    );
  }

  killApp(pkg_Name) {
    this.executeLD(
      `killapp --${this.param} ${this.NameOrId} --packagename ${pkg_Name}`
    );
  }

  locate(Lng, Lat) {
    this.executeLD(
      `locate --${this.param} ${this.NameOrId} --LLI ${Lng},${Lat}`
    );
  }

  changeProperty(cmd) {
    return this.executeLD(`modify --${this.param} ${this.NameOrId} ${cmd}`);
  }

  setProp(key, value) {
    this.executeLD(
      `setprop --${this.param} ${this.NameOrId} --key ${key} --value ${value}`
    );
  }

  installAGetPropppPackage(key) {
    return this.executeLD(
      `getprop --${this.param} ${this.NameOrId} --key ${key}`
    );
  }

  adbLd(cmd) {
    const fullCmd = `adb --${this.param} ${this.NameOrId} --command "${cmd}"`;
    return this.executeLD(fullCmd);
  }

  downCPU(rate) {
    this.executeLD(`downcpu --${this.param} ${this.NameOrId} --rate ${rate}`);
  }

  isDeviceRunning() {
    const a = this.executeLD(`isrunning --${this.param} ${this.NameOrId}`);
    return a.includes("running");
  }

  downCPU(audio, fast_play, clean_mode) {
    this.executeLD(
      `globalsetting --${this.param} ${this.NameOrId} --audio ${audio} --fastplay ${fast_play} --cleanmode ${clean_mode}`
    );
  }

  getDevices() {
    const list = this.executeLD("list")
      .replace(/b'|'/g, "")
      .replace(/\n/g, "")
      .split("\\r");
    console.log(list);
    return list;
  }

  getAllLDPlayerRunning() {
    const allcommandlines = [];
    const allnames = [];
    psutil.processIter().forEach((p) => {
      if (p.name().toLowerCase() === "dnplayer.exe") {
        try {
          allcommandlines.push(p.asDict());
        } catch (error) {
          // pass
        }
      }
    });
    allnames.push(
      allcommandlines.map((co) => ({
        path: path.normalize(co["cmdline"][0]),
        index: co["cmdline"][1].replace("index=|", ""),
      }))
    );
    return allnames;
  }

  getDevices2() {
    const list2 = this.executeLD("list2").split("\r\n");

    const Info_Devices = [];
    list2.forEach((i) => {
      if (i === "" || i.includes("99999")) {
        return;
      }
      const item = i.split(",");
      Info_Devices.push({
        name: item[1],
        index: item[0],
        id: "-1",
      });
    });

    return Info_Devices;
  }

  getNodes(element) {
    let foundNodes;
    const filePath = this.dumXml();
    const fileContent = fs.readFileSync(filePath, "utf8");

    xml2js.parseString(fileContent, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }
      const nodes = findNodesByResourceId(result.hierarchy.node, element);
      foundNodes = nodes;
    });

    return foundNodes;
  }

  tapRandomEbayProduct(element) {
    const nodes = this.getNodes(element);
    const productNodeRandom = nodes[getRandomNumber(0, nodes.length - 1)];
    const bounds = productNodeRandom?.$?.bounds;
    if (bounds) {
      const [x, y] = bounds.split("][")[0].replace("[", "").split(",");
      this.click(x, y);

      return true;
    }

    return false;
  }

  async randomSwipe(min = 5, max = 10) {
    const numberOfSwipes = getRandomNumber(min, max);
    const startX = 500;
    const minY = 800;
    const maxY = 300;
    for (let i = 0; i < numberOfSwipes; i++) {
      const randomUpOrDown = getRandomNumber(1, 3);
      const randomY = getRandomNumber(minY - 100, maxY);
      this.swipe(
        getRandomNumber(300, 500),
        randomUpOrDown !== 2 ? minY : randomY,
        getRandomNumber(300, 500),
        randomUpOrDown !== 2 ? randomY : minY,
        getRandomNumber(300, 500)
      );
      await delayRandom(2, 4);
    }
  }
}
